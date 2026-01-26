"""
FastAPI Backend for Shein Cart Scraper
Deployed on Railway
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Optional
import asyncio
import re
import json

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None

app = FastAPI(
    title="Shein Cart Scraper API",
    description="API to scrape Shein public cart URLs",
    version="1.0.0"
)

# CORS - allow all origins for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    url: str


class CartItem(BaseModel):
    name: Optional[str] = None
    price: Optional[str] = None
    quantity: Optional[str] = None
    image: Optional[str] = None
    sku: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None


class ScrapeResponse(BaseModel):
    success: bool
    items: List[CartItem]
    total_items: int
    message: Optional[str] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "Shein Cart Scraper API",
        "playwright_available": async_playwright is not None
    }


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_cart(request: ScrapeRequest):
    """
    Scrape a Shein cart URL and return items
    
    Note: Due to Shein's anti-bot measures, this may not always work.
    The URL must be a direct cart share URL.
    """
    if not async_playwright:
        raise HTTPException(
            status_code=500,
            detail="Playwright not installed on server"
        )
    
    try:
        items = await scrape_shein_cart(request.url)
        
        return ScrapeResponse(
            success=True,
            items=items,
            total_items=len(items),
            message="Successfully scraped cart"
        )
    
    except Exception as e:
        return ScrapeResponse(
            success=False,
            items=[],
            total_items=0,
            message=f"Error: {str(e)}"
        )


async def scrape_shein_cart(url: str) -> List[CartItem]:
    """Scrape cart using Playwright"""
    items = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            viewport={'width': 375, 'height': 812},
            locale='en-US'
        )
        
        # Anti-detection
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        page = await context.new_page()
        
        try:
            # Load page with increased timeout
            print(f"Loading URL: {url}")
            try:
                await page.goto(url, wait_until='load', timeout=90000)
            except Exception as e:
                print(f"Page load warning: {e}")
                # Try to continue anyway if partially loaded
            
            # Wait longer for dynamic content to fully render
            print("Waiting for content to render...")
            await asyncio.sleep(15)
            
            # Get HTML content for debugging (without writing to file in production)
            html = await page.content()
            print(f"Loaded HTML content ({len(html)} chars)")
            
            # Try to extract from JavaScript (simplified)
            cart_data = await page.evaluate('''() => {
                if (window.__NUXT__) return { source: 'NUXT', data: window.__NUXT__ };
                if (window.__INITIAL_STATE__) return { source: 'STATE', data: window.__INITIAL_STATE__ };
                if (window.gbRaidData) return { source: 'RAID', data: window.gbRaidData };
                return null;
            }''')
            
            if cart_data:
                print(f"Found JS data source: {cart_data.get('source')}")
                items = parse_cart_data(cart_data['data'])
                print(f"Parsed {len(items)} items from JS")
            
            # Try DOM extraction if no items found
            if not items:
                print("No items from JS, trying DOM extraction...")
                items = await extract_from_dom(page)
                print(f"Found {len(items)} items from DOM")
            
        except Exception as e:
            print(f"Error scraping: {e}")
        finally:
            await browser.close()
    
    return items


async def extract_from_dom(page) -> List[CartItem]:
    """Extract items from DOM with improved SKU and deduplication"""
    items = []
    seen_skus = set()  # Track by SKU primarily
    seen_names = set()  # Fallback to name if no SKU
    
    # Try comprehensive selectors
    selectors = [
        '[class*="cart-item"]',
        '[class*="goods-item"]',
        '[class*="product-item"]',
        '[class*="CartItem"]',
    ]
    
    for selector in selectors:
        elements = await page.query_selector_all(selector)
        print(f"Selector '{selector}': found {len(elements)} elements")
        if not elements:
            continue
        
        for elem in elements:
            item_data = {}
            
            # Check element size - skip tiny nested elements
            try:
                box = await elem.bounding_box()
                if box and box['height'] < 80:  # Increased threshold
                    continue
            except:
                pass
            
            # Extract SKU first (most important for ordering)
            sku_selectors = [
                '[class*="goods-id"]',
                '[class*="product-id"]',
                '[class*="sku"]',
                '[data-goods-id]',
                '[data-product-id]',
                '[data-sku]',
            ]
            for sku_sel in sku_selectors:
                sku_elem = await elem.query_selector(sku_sel)
                if sku_elem:
                    sku = await sku_elem.inner_text() or await sku_elem.get_attribute('data-goods-id') or await sku_elem.get_attribute('data-sku')
                    if sku and sku.strip():
                        item_data['sku'] = sku.strip()
                        break
            
            # Try to extract SKU from element attributes if not found
            if not item_data.get('sku'):
                for attr in ['data-goods-id', 'data-product-id', 'data-sku', 'data-id']:
                    val = await elem.get_attribute(attr)
                    if val:
                        item_data['sku'] = val
                        break
            
            # Try to extract SKU from product links
            if not item_data.get('sku'):
                link_elem = await elem.query_selector('a[href*="goods_id"], a[href*="product"], a[href*="-p-"]')
                if link_elem:
                    href = await link_elem.get_attribute('href')
                    if href:
                        import re
                        # Try to extract goods_id from URL patterns
                        # Pattern 1: goods_id=123456
                        match = re.search(r'goods_id=(\d+)', href)
                        if match:
                            item_data['sku'] = match.group(1)
                        else:
                            # Pattern 2: -p-123456
                            match = re.search(r'-p-(\d+)', href)
                            if match:
                                item_data['sku'] = match.group(1)
            
            # Extract name
            name_selectors = [
                '[class*="goods-name"]',
                '[class*="product-name"]', 
                '[class*="goods-title"]',
                'h3',
                'h2',
            ]
            for name_sel in name_selectors:
                name_elem = await elem.query_selector(name_sel)
                if name_elem:
                    text = await name_elem.inner_text()
                    if text and len(text.strip()) > 10:
                        item_data['name'] = text.strip()
                        break
            
            # Extract price - get ONLY the current/sale price (first price element)
            price_elem = await elem.query_selector('[class*="sale-price"], [class*="current-price"], [class*="price"]:first-child')
            if price_elem:
                text = await price_elem.inner_text()
                # Extract only numbers and currency
                if text:
                    import re
                    # Match price pattern: R123.45 or R123
                    match = re.search(r'[R$€£¥]\s*\d+(?:\.\d{2})?', text)
                    if match:
                        item_data['price'] = match.group(0).strip()
            
            # Extract image - prefer main product image
            img_selectors = [
                'img[class*="goods-img"]',
                'img[class*="product-img"]',
                'img[src*="thumbnail"]',
                'img:first-of-type',
            ]
            for img_sel in img_selectors:
                img = await elem.query_selector(img_sel)
                if img:
                    src = await img.get_attribute('src') or await img.get_attribute('data-src')
                    if src and 'placeholder' not in src.lower() and src.strip():
                        # Convert thumbnail to larger image
                        src = src.replace('_thumbnail_', '_').replace('240x', '480x')
                        if not src.startswith('http'):
                            src = 'https:' + src if src.startswith('//') else 'https://img.shein.com' + src
                        item_data['image'] = src
                        break
            
            # Extract quantity
            qty_elem = await elem.query_selector('input[type="number"], [class*="quantity"] input, [class*="num"] input')
            if qty_elem:
                qty = await qty_elem.get_attribute('value')
                if qty:
                    try:
                        item_data['quantity'] = str(int(qty))
                    except:
                        item_data['quantity'] = "1"
            
            # Extract color and size if available
            color_elem = await elem.query_selector('[class*="color"], [class*="Color"]')
            if color_elem:
                color_text = await color_elem.inner_text()
                if color_text:
                    item_data['color'] = color_text.strip()
            
            size_elem = await elem.query_selector('[class*="size"], [class*="Size"]')
            if size_elem:
                size_text = await size_elem.inner_text()
                if size_text:
                    item_data['size'] = size_text.strip()
            
            # Deduplicate: prioritize SKU, fallback to name
            if item_data.get('name'):
                sku = item_data.get('sku')
                name = item_data.get('name')
                
                # Check if already seen
                if sku and sku in seen_skus:
                    continue
                if not sku and name in seen_names:
                    continue
                
                # Add to seen sets
                if sku:
                    seen_skus.add(sku)
                seen_names.add(name)
                
                # Add item
                items.append(CartItem(**item_data))
                print(f"Added item: {name[:50]}... | SKU: {sku or 'N/A'} | Price: {item_data.get('price', 'N/A')} | Size: {item_data.get('size', 'N/A')} | Color: {item_data.get('color', 'N/A')}")
        
        if items:
            break
    
    return items


def parse_cart_data(data) -> List[CartItem]:
    """Parse cart data from JavaScript objects"""
    items = []
    
    if isinstance(data, dict):
        for key in ['cart', 'cartItems', 'items', 'goods', 'goodsList']:
            if key in data and isinstance(data[key], list):
                for item in data[key]:
                    if isinstance(item, dict):
                        parsed = parse_single_item(item)
                        if parsed:
                            items.append(parsed)
        
        if not items:
            for value in data.values():
                if isinstance(value, (dict, list)):
                    nested = parse_cart_data(value)
                    if nested:
                        items.extend(nested)
                        break
    
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                parsed = parse_single_item(item)
                if parsed:
                    items.append(parsed)
    
    return items


def parse_single_item(item: dict) -> Optional[CartItem]:
    """Parse a single item"""
    data = {}
    
    for key in ['name', 'title', 'goodsName', 'goods_name']:
        if key in item and item[key]:
            data['name'] = str(item[key])
            break
    
    for key in ['price', 'salePrice', 'unit_price']:
        if key in item and item[key]:
            data['price'] = str(item[key])
            break
    
    for key in ['quantity', 'qty', 'num']:
        if key in item and item[key]:
            data['quantity'] = str(item[key])
            break
    
    for key in ['image', 'img', 'goodsImg']:
        if key in item and item[key]:
            img = item[key]
            if not img.startswith('http'):
                img = 'https:' + img if img.startswith('//') else img
            data['image'] = img
            break
    
    for key in ['sku', 'id', 'goodsId']:
        if key in item and item[key]:
            data['sku'] = str(item[key])
            break
    
    return CartItem(**data) if data else None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
