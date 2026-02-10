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
    """Scrape cart by extracting from rendered page DOM"""
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
        
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        page = await context.new_page()
        
        try:
            print(f"Loading cart page: {url}")
            await page.goto(url, wait_until='networkidle', timeout=60000)
            
            # Wait for products to load - try multiple strategies
            print("Waiting for products to render...")
            
            # Strategy 1: Wait for specific selectors
            product_loaded = False
            selectors_to_try = [
                '[class*="goods-item"]',
                '[class*="product"]',
                '[class*="share-goods"]',
                'img[src*="shein"]',
            ]
            
            for selector in selectors_to_try:
                try:
                    await page.wait_for_selector(selector, timeout=10000)
                    print(f"✓ Found products with selector: {selector}")
                    product_loaded = True
                    break
                except:
                    continue
            
            # Strategy 2: Scroll to trigger lazy loading
            print("Scrolling to trigger lazy loading...")
            await page.evaluate('''() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            }''')
            await asyncio.sleep(2)
            await page.evaluate('''() => {
                window.scrollTo(0, document.body.scrollHeight);
            }''')
            await asyncio.sleep(2)
            
            # Strategy 3: Additional wait if products didn't load
            if not product_loaded:
                print("Products not detected, waiting additional 5 seconds...")
                await asyncio.sleep(5)
            
            # Save HTML for debugging
            html = await page.content()
            with open('cart_page.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"Saved page HTML ({len(html)} chars)")
            
            # Try to extract product data from page
            print("\n=== Attempting DOM extraction ===")
            items = await extract_from_dom(page)
            
            if items:
                print(f"✓ Successfully extracted {len(items)} items from DOM")
            else:
                print("✗ No items found in DOM, checking for JavaScript data...")
                
                # Try JavaScript objects as fallback
                js_data = await page.evaluate('''() => {
                    const sources = [
                        {name: '__NUXT__', data: window.__NUXT__},
                        {name: '__INITIAL_STATE__', data: window.__INITIAL_STATE__},
                        {name: '__pinia', data: window.__pinia},
                        {name: 'gbRaidData', data: window.gbRaidData}
                    ];
                    
                    for (const source of sources) {
                        if (source.data) {
                            return source;
                        }
                    }
                    return null;
                }''')
                
                if js_data:
                    print(f"Found JS data source: {js_data['name']}")
                    items = parse_cart_data(js_data['data'])
                    if items:
                        print(f"✓ Extracted {len(items)} items from {js_data['name']}")
            
        except Exception as e:
            print(f"Error scraping: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
    
    return items


async def extract_from_dom(page) -> List[CartItem]:
    """Extract items from DOM with improved selectors"""
    items = []
    seen_skus = set()
    
    # Try multiple selector strategies
    selectors = [
        '[class*="goods-item"]',
        '[class*="product-item"]',
        '[class*="cart-item"]',
        '[class*="share-goods"]',
        '[class*="sui-goods"]',
        '.goods-card',
        '.product-card',
        'article',  # Sometimes products are in article tags
        '[class*="item-card"]',
        'div[class*="card"]'  # Generic card selector
    ]
    
    for selector in selectors:
        elements = await page.query_selector_all(selector)
        print(f"Selector '{selector}': {len(elements)} elements")
        
        if not elements:
            continue
        
        for idx, elem in enumerate(elements):
            try:
                # Get all text content for debugging
                elem_text = await elem.inner_text()
                
                if len(elem_text.strip()) < 10:  # Skip elements with minimal text
                    continue
                
                # Check if this looks like a product (has image and some text)
                has_image = await elem.query_selector('img')
                if not has_image:
                    continue
                
                print(f"\n--- Processing element {idx + 1} ---")
                print(f"Text preview: {elem_text[:100].strip()}")
                
                item_data = {}
                
                # Extract name - try multiple approaches
                name = None
                name_selectors = [
                    '[class*="goods-name"]',
                    '[class*="product-name"]',
                    '[class*="goods-title"]',
                    '[class*="product-title"]',
                    '[class*="title"]',
                    'h3', 'h2', 'h4',
                    '.name',
                    'a[class*="name"]'
                ]
                
                for name_sel in name_selectors:
                    name_elem = await elem.query_selector(name_sel)
                    if name_elem:
                        text = await name_elem.inner_text()
                        if text and len(text.strip()) > 10:
                            name = text.strip()
                            print(f"  ✓ Name: {name[:50]}...")
                            break
                
                if not name:
                    # Try to extract from element text directly
                    lines = [l.strip() for l in elem_text.split('\n') if len(l.strip()) > 15]
                    if lines:
                        # Filter out price lines and other non-name content
                        for line in lines:
                            if not re.search(r'[R$€£¥]\s*\d+', line) and not re.search(r'\d+\+?\s*sold', line):
                                name = line
                                print(f"  ✓ Name (from text): {name[:50]}...")
                                break
                
                if name:
                    item_data['name'] = name
                
                # Extract price - look for currency symbols
                price_patterns = [
                    r'R\s*[\d,]+\.?\d*',
                    r'\$\s*[\d,]+\.?\d*',
                    r'€\s*[\d,]+\.?\d*',
                    r'£\s*[\d,]+\.?\d*',
                ]
                
                for pattern in price_patterns:
                    matches = re.findall(pattern, elem_text)
                    if matches:
                        # Usually the first price is the current/sale price
                        item_data['price'] = matches[0].strip()
                        print(f"  ✓ Price: {item_data['price']}")
                        break
                
                # Extract image
                img_selectors = [
                    'img[src*="sheimg"]',
                    'img[src*="shein"]',
                    'img[src*="ltwebstatic"]',
                    'img[class*="goods"]',
                    'img[class*="product"]',
                    'img:first-of-type'
                ]
                
                for img_sel in img_selectors:
                    img_elem = await elem.query_selector(img_sel)
                    if img_elem:
                        src = await img_elem.get_attribute('src') or await img_elem.get_attribute('data-src')
                        if src and 'placeholder' not in src.lower():
                            if not src.startswith('http'):
                                src = 'https:' + src if src.startswith('//') else 'https://img.shein.com' + src
                            item_data['image'] = src
                            print(f"  ✓ Image: {src[:60]}...")
                            break
                
                # Extract SKU from data attributes or URL
                sku = None
                for attr in ['data-goods-id', 'data-product-id', 'data-sku', 'data-id', 'data-spu']:
                    val = await elem.get_attribute(attr)
                    if val:
                        sku = val
                        break
                
                # Try to get SKU from links
                if not sku:
                    links = await elem.query_selector_all('a[href]')
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            match = re.search(r'goods[_-]id[=:](\w+)|[/-]p[/-](\w+)', href)
                            if match:
                                sku = match.group(1) or match.group(2)
                                break
                
                if sku:
                    item_data['sku'] = sku
                    print(f"  ✓ SKU: {sku}")
                
                # Only add if we have at least a name or SKU
                if item_data.get('name') or item_data.get('sku'):
                    # Deduplicate by SKU or name
                    dedup_key = item_data.get('sku') or item_data.get('name')
                    if dedup_key not in seen_skus:
                        seen_skus.add(dedup_key)
                        items.append(CartItem(**item_data))
                        print(f"  ✓ Added item")
                
            except Exception as e:
                print(f"Error processing element {idx}: {e}")
                continue
        
        if items:
            print(f"\n✓ Found {len(items)} items with selector: {selector}")
            break
    
    return items


def parse_cart_data(data, depth=0) -> List[CartItem]:
    """Parse cart data from JavaScript objects with recursive search"""
    items = []
    max_depth = 5
    
    if depth > max_depth:
        return items
    
    if isinstance(data, dict):
        # First check for Shein API response format
        if 'info' in data and isinstance(data['info'], dict):
            # Common Shein API structure: {code, info: {goodsInfo: [...]}}
            if 'goodsInfo' in data['info'] and isinstance(data['info']['goodsInfo'], list):
                print(f"Found goodsInfo in API response with {len(data['info']['goodsInfo'])} items")
                for item in data['info']['goodsInfo']:
                    if isinstance(item, dict):
                        parsed = parse_single_item(item)
                        if parsed:
                            items.append(parsed)
                return items
        
        # Check for direct goodsInfo
        if 'goodsInfo' in data and isinstance(data['goodsInfo'], list):
            print(f"Found direct goodsInfo with {len(data['goodsInfo'])} items")
            for item in data['goodsInfo']:
                if isinstance(item, dict):
                    parsed = parse_single_item(item)
                    if parsed:
                        items.append(parsed)
            return items
        
        # Look for common cart item array keys
        cart_keys = [
            'cart', 'cartItems', 'items', 'goods', 'goodsList',
            'products', 'productList', 'data', 'list', 'cartList',
            'shareGoodsList', 'share_goods_list', 'result'
        ]
        
        for key in cart_keys:
            if key in data and isinstance(data[key], list) and data[key]:
                print(f"Found cart items array at key: '{key}' with {len(data[key])} items")
                for item in data[key]:
                    if isinstance(item, dict):
                        parsed = parse_single_item(item)
                        if parsed:
                            items.append(parsed)
                if items:
                    return items
        
        # If no items found, recursively search nested objects
        if not items:
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    nested = parse_cart_data(value, depth + 1)
                    if nested:
                        items.extend(nested)
                        if items:  # Return on first successful parse
                            return items
    
    elif isinstance(data, list) and data:
        print(f"Parsing list with {len(data)} items")
        for item in data:
            if isinstance(item, dict):
                parsed = parse_single_item(item)
                if parsed:
                    items.append(parsed)
    
    return items


def parse_single_item(item: dict) -> Optional[CartItem]:
    """Parse a single item with comprehensive field mapping"""
    data = {}
    
    # Print item structure for debugging
    print(f"Parsing item keys: {list(item.keys())}")
    
    # Name - try multiple variations
    for key in ['name', 'title', 'goodsName', 'goods_name', 'productName', 'product_name', 'goods_title', 'productTitle']:
        if key in item and item[key]:
            data['name'] = str(item[key]).strip()
            break
    
    # Price - try multiple variations and nested paths
    for key in ['price', 'salePrice', 'sale_price', 'unit_price', 'retailPrice', 'retail_price', 'amount', 'unitPrice']:
        if key in item:
            val = item[key]
            if val:
                # Handle nested price objects
                if isinstance(val, dict):
                    for subkey in ['amount', 'value', 'usdAmount', 'amountWithSymbol']:
                        if subkey in val and val[subkey]:
                            data['price'] = str(val[subkey])
                            break
                else:
                    data['price'] = str(val)
                if 'price' in data:
                    break
    
    # Quantity
    for key in ['quantity', 'qty', 'num', 'amount', 'productNum', 'product_num']:
        if key in item and item[key]:
            data['quantity'] = str(item[key])
            break
    
    # Image - handle various formats
    for key in ['image', 'img', 'goodsImg', 'goods_img', 'productImg', 'product_img', 'goods_image', 'mainImage', 'thumb']:
        if key in item and item[key]:
            img = item[key]
            # Handle nested image objects
            if isinstance(img, dict):
                img = img.get('src') or img.get('url') or img.get('origin_image') or ''
            img = str(img)
            if img and not img.startswith('http'):
                img = 'https:' + img if img.startswith('//') else 'https://img.shein.com' + img
            if img:
                data['image'] = img
                break
    
    # SKU
    for key in ['sku', 'id', 'goodsId', 'goods_id', 'productId', 'product_id', 'goods_sn', 'productSn']:
        if key in item and item[key]:
            data['sku'] = str(item[key])
            break
    
    # Color
    for key in ['color', 'colour', 'attr_color', 'attrColor']:
        if key in item and item[key]:
            val = item[key]
            if isinstance(val, dict):
                data['color'] = str(val.get('name') or val.get('value') or val)
            else:
                data['color'] = str(val)
            break
    
    # Size
    for key in ['size', 'attr_size', 'attrSize']:
        if key in item and item[key]:
            val = item[key]
            if isinstance(val, dict):
                data['size'] = str(val.get('name') or val.get('value') or val)
            else:
                data['size'] = str(val)
            break
    
    print(f"Parsed data: {data}")
    return CartItem(**data) if data.get('name') or data.get('sku') else None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
