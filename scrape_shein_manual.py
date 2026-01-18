#!/usr/bin/env python3
"""
Shein Cart Scraper with Manual CAPTCHA Solving
Opens a browser window and waits for you to solve any CAPTCHAs before extracting data
"""

import sys
import json
import asyncio
from typing import List, Dict
from urllib.parse import urlencode
import re

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Error: playwright not installed")
    print("Install it with: pip install playwright")
    print("Then run: playwright install chromium")
    sys.exit(1)


async def scrape_with_manual_captcha(url: str) -> List[Dict]:
    """
    Scrape cart with manual CAPTCHA solving
    """
    print("=" * 70)
    print("MANUAL CAPTCHA SOLVING MODE")
    print("=" * 70)
    print("\nThis script will:")
    print("1. Open a browser window")
    print("2. Navigate to the cart URL")
    print("3. Wait for you to solve any CAPTCHAs/puzzles")
    print("4. Press Enter in this terminal when ready")
    print("5. Extract the cart data")
    print("\n" + "=" * 70)
    
    async with async_playwright() as p:
        print("\n🌐 Launching browser...")
        browser = await p.chromium.launch(
            headless=False,  # Always visible
            args=['--start-maximized']
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
            timezone_id='Africa/Johannesburg'
        )
        
        page = await context.new_page()
        
        try:
            print(f"📄 Loading page: {url}")
            await page.goto(url, timeout=60000)
            
            # Wait a bit for redirects
            await asyncio.sleep(3)
            
            # Show final URL after redirects
            final_url = page.url
            print(f"\n✓ Page loaded")
            print(f"📍 Final URL: {final_url}")
            
            print("\n" + "=" * 70)
            print("⚠️  INSTRUCTIONS:")
            print("=" * 70)
            print("1. If this is NOT the cart page, manually navigate to the cart")
            print("2. Solve any CAPTCHAs/puzzles that appear")
            print("3. Make sure the cart items are visible")
            print("4. Press ENTER in this terminal when ready to extract data")
            print("=" * 70)
            
            # Wait for user input
            await asyncio.get_event_loop().run_in_executor(None, input)
            
            print("\n✓ Proceeding with data extraction...")
            
            # Small wait to ensure page is stable
            await asyncio.sleep(2)
            
            # Take screenshot
            await page.screenshot(path='final_screenshot.png')
            print("📸 Screenshot saved to final_screenshot.png")
            
            # Extract cart items
            items = await extract_cart_items(page)
            
            # Save HTML for debugging
            html = await page.content()
            with open('final_page.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("💾 Page HTML saved to final_page.html")
            
            return items
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return []
        finally:
            print("\n⏸️  Browser will close in 3 seconds...")
            await asyncio.sleep(3)
            await browser.close()


async def extract_cart_items(page) -> List[Dict]:
    """Extract cart items from the page"""
    items = []
    
    print("\n🔍 Attempting to extract cart data...")
    
    # Method 1: Try to get data from JavaScript variables
    print("  → Checking JavaScript variables...")
    cart_data = await page.evaluate('''() => {
        // Check common data sources
        if (window.__NUXT__) return { source: 'NUXT', data: window.__NUXT__ };
        if (window.__INITIAL_STATE__) return { source: 'INITIAL_STATE', data: window.__INITIAL_STATE__ };
        if (window.cartData) return { source: 'cartData', data: window.cartData };
        if (window.gbRawData) return { source: 'gbRawData', data: window.gbRawData };
        
        // Try to find in script tags
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
            const text = script.textContent || '';
            if (text.includes('cartInfo') || text.includes('goodsList')) {
                return { source: 'script', data: text.substring(0, 5000) };
            }
        }
        
        return null;
    }''')
    
    if cart_data and cart_data.get('data'):
        print(f"  ✓ Found data from: {cart_data.get('source')}")
        parsed = parse_cart_data(cart_data['data'])
        if parsed:
            items.extend(parsed)
    
    # Method 2: Extract from DOM
    if not items:
        print("  → Trying DOM extraction...")
        items = await extract_from_dom(page)
    
    # Method 3: Try API inspection
    if not items:
        print("  → Checking network requests...")
        # Get all localStorage and sessionStorage
        storage = await page.evaluate('''() => {
            return {
                local: Object.assign({}, window.localStorage),
                session: Object.assign({}, window.sessionStorage)
            };
        }''')
        print(f"  ℹ️  Storage data available: {list(storage.keys())}")
    
    return items


async def extract_from_dom(page) -> List[Dict]:
    """Extract items from DOM elements"""
    items = []
    
    # Try comprehensive selectors
    selectors = [
        '[class*="cart-item"]',
        '[class*="goods-item"]',
        '[class*="product-item"]',
        '[data-goods-id]',
        '.she-checkbox-item',
        'li[class*="item"]',
        'div[class*="item-wrap"]'
    ]
    
    for selector in selectors:
        elements = await page.query_selector_all(selector)
        if elements:
            print(f"    Found {len(elements)} elements with selector: {selector}")
            
            for elem in elements:
                item = {}
                
                # Get all text
                text = await elem.inner_text()
                html = await elem.inner_html()
                
                # Try to find name
                name_sels = ['[class*="name"]', '[class*="title"]', 'h2', 'h3', 'a[class*="goods"]']
                for ns in name_sels:
                    ne = await elem.query_selector(ns)
                    if ne:
                        name = await ne.inner_text()
                        if name and len(name.strip()) > 3:
                            item['name'] = name.strip()
                            break
                
                # Try to find price
                price_sels = ['[class*="price"]', '[class*="amount"]', 'span[class*="sale"]']
                for ps in price_sels:
                    pe = await elem.query_selector(ps)
                    if pe:
                        price = await pe.inner_text()
                        if price and any(c.isdigit() for c in price):
                            item['price'] = price.strip()
                            break
                
                # Image
                img = await elem.query_selector('img')
                if img:
                    src = await img.get_attribute('src') or await img.get_attribute('data-src')
                    if src:
                        item['image'] = src
                
                # Quantity
                qty = await elem.query_selector('[class*="quantity"], input[type="number"]')
                if qty:
                    qty_val = await qty.inner_text() or await qty.get_attribute('value')
                    if qty_val:
                        item['quantity'] = qty_val.strip()
                
                if item.get('name') or item.get('price'):
                    items.append(item)
            
            if items:
                break
    
    if items:
        print(f"  ✓ Extracted {len(items)} items from DOM")
    
    return items


def parse_cart_data(data) -> List[Dict]:
    """Parse cart data from various formats"""
    items = []
    
    if isinstance(data, dict):
        # Look for cart-related keys
        for key in ['cart', 'cartItems', 'items', 'goods', 'goodsList', 'products', 'cartInfo']:
            if key in data:
                value = data[key]
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            parsed = parse_single_item(item)
                            if parsed:
                                items.append(parsed)
                elif isinstance(value, dict):
                    # Recursively check
                    items.extend(parse_cart_data(value))
        
        # If no items found, check nested dicts
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
    
    elif isinstance(data, str):
        # Try to find JSON in string
        try:
            # Look for JSON objects
            pattern = r'\{[^{}]*(?:"cart"|"goods"|"items")[^{}]*\}'
            matches = re.findall(pattern, data)
            for match in matches:
                try:
                    obj = json.loads(match)
                    items.extend(parse_cart_data(obj))
                except:
                    continue
        except:
            pass
    
    return items


def parse_single_item(item: dict) -> dict:
    """Parse a single cart item"""
    result = {}
    
    # Name
    for key in ['name', 'title', 'goodsName', 'goods_name', 'productName']:
        if key in item and item[key]:
            result['name'] = str(item[key])
            break
    
    # Price
    for key in ['price', 'salePrice', 'retailPrice', 'unit_price', 'unitPrice']:
        if key in item and item[key]:
            result['price'] = item[key]
            break
    
    # Quantity
    for key in ['quantity', 'qty', 'num', 'goods_num']:
        if key in item and item[key]:
            result['quantity'] = item[key]
            break
    
    # Image
    for key in ['image', 'img', 'thumbnail', 'goodsImg', 'goods_img']:
        if key in item and item[key]:
            result['image'] = item[key]
            break
    
    # SKU
    for key in ['sku', 'id', 'goodsId', 'goods_id', 'productId']:
        if key in item and item[key]:
            result['sku'] = str(item[key])
            break
    
    return result if result else None


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scrape_shein_manual.py <shein_cart_url>")
        print("\nExample:")
        print("  python scrape_shein_manual.py https://m.shein.com/za/cart/share/landing?group_id=...")
        print("  python scrape_shein_manual.py https://api-shein.shein.com/h5/sharejump/appjump?link=...")
        sys.exit(1)
    
    url = sys.argv[1]
    
    print(f"\n📋 Using URL: {url}")
    print("Note: The script will follow any redirects automatically\n")
    
    items = await scrape_with_manual_captcha(url)
    
    if items:
        print(f"\n{'='*70}")
        print(f"✅ SUCCESS! Found {len(items)} items:")
        print("=" * 70)
        print(json.dumps(items, indent=2, ensure_ascii=False))
        
        # Save to file
        with open('cart_items.json', 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Cart items saved to cart_items.json")
        return 0
    else:
        print(f"\n{'='*70}")
        print("❌ No items found")
        print("=" * 70)
        print("\nPlease check:")
        print("  • Did you solve all CAPTCHAs?")
        print("  • Is the cart page fully loaded?")
        print("  • Does the cart actually have items?")
        print("\nCheck final_screenshot.png and final_page.html for debugging")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
