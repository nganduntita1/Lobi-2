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
            # Load page
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(5)  # Wait for JS to execute
            
            # Try to extract from JavaScript
            cart_data = await page.evaluate('''() => {
                if (window.__NUXT__) return { source: 'NUXT', data: window.__NUXT__ };
                if (window.__INITIAL_STATE__) return { source: 'STATE', data: window.__INITIAL_STATE__ };
                return null;
            }''')
            
            if cart_data and cart_data.get('data'):
                items = parse_cart_data(cart_data['data'])
            
            # Try DOM extraction if no items found
            if not items:
                items = await extract_from_dom(page)
            
        except Exception as e:
            print(f"Error scraping: {e}")
        finally:
            await browser.close()
    
    return items


async def extract_from_dom(page) -> List[CartItem]:
    """Extract items from DOM"""
    items = []
    seen = set()  # Track unique items
    
    # Try comprehensive selectors
    selectors = [
        '[class*="cart-item"]',
        '[class*="goods-item"]',
        '[class*="product-item"]',
    ]
    
    for selector in selectors:
        elements = await page.query_selector_all(selector)
        if not elements:
            continue
        
        for elem in elements:
            item_data = {}
            
            # Check element size - skip small nested elements
            try:
                box = await elem.bounding_box()
                if box and box['height'] < 50:
                    continue
            except:
                pass
            
            # Name - prioritize main product name elements
            name_selectors = [
                '[class*="goods-name"]',
                '[class*="product-name"]', 
                '[class*="goods-title"]',
                'h2', 'h3',
                '[class*="name"]'
            ]
            for name_sel in name_selectors:
                name_elem = await elem.query_selector(name_sel)
                if name_elem:
                    text = await name_elem.inner_text()
                    if text and len(text.strip()) > 10:  # Only longer names
                        item_data['name'] = text.strip()
                        break
            
            # Price - get main price only
            price_elems = await elem.query_selector_all('[class*="price"]')
            for price_elem in price_elems:
                text = await price_elem.inner_text()
                # Check if contains currency and numbers
                if text and any(c in text for c in ['R', '$', '€', '£', '¥']) and any(c.isdigit() for c in text):
                    # Clean up extra whitespace
                    item_data['price'] = ' '.join(text.split())
                    break
            
            # Image - skip placeholder images
            img = await elem.query_selector('img[src*="img"], img[data-src]')
            if img:
                src = await img.get_attribute('src') or await img.get_attribute('data-src')
                if src and 'placeholder' not in src.lower() and 'loading' not in src.lower():
                    if not src.startswith('http'):
                        src = 'https:' + src if src.startswith('//') else 'https://img.shein.com' + src
                    item_data['image'] = src
            
            # Quantity
            qty_elem = await elem.query_selector('input[type="number"], [class*="quantity"] input')
            if qty_elem:
                qty = await qty_elem.get_attribute('value')
                if qty and int(qty) > 0:
                    item_data['quantity'] = qty
            
            # Only add if we have a name and it's unique
            if item_data.get('name'):
                # Create unique key
                unique_key = (item_data.get('name', '') + 
                             item_data.get('price', '') + 
                             item_data.get('image', '')).lower()
                
                if unique_key not in seen:
                    seen.add(unique_key)
                    items.append(CartItem(**item_data))
        
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
