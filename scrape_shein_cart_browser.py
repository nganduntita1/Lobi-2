#!/usr/bin/env python3
"""
Shein Cart Scraper with Browser Support
Uses Playwright to handle JavaScript-rendered content
"""

import sys
import json
import re
import asyncio
from typing import List, Dict, Optional
from urllib.parse import urlencode

try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("Error: playwright not installed")
    print("Install it with: pip install playwright")
    print("Then run: playwright install chromium")
    sys.exit(1)


class SheinCartScraperBrowser:
    """Scraper for Shein public cart URLs using browser automation"""
    
    def __init__(self, headless=True):
        self.timeout = 60000  # 60 seconds
        self.headless = headless
    
    async def scrape_cart(self, url: str) -> List[Dict[str, any]]:
        """
        Scrape items from a Shein cart URL using browser automation
        
        Args:
            url: Public Shein cart URL
            
        Returns:
            List of cart items with their details
        """
        # Handle share/redirect URLs
        if 'api-shein.shein.com' in url or 'sharejump' in url:
            print(f"Share URL detected, converting to cart landing URL...")
            url = await self._convert_share_url_to_cart_url(url)
            if not url:
                print("Could not extract cart landing URL")
                return []
            print(f"Cart landing URL: {url}")
        
        async with async_playwright() as p:
            print("Launching browser...")
            # Use more realistic browser settings to avoid detection
            browser = await p.chromium.launch(
                headless=self.headless,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='Africa/Johannesburg'
            )
            
            # Add extra stealth measures
            await context.add_init_script("""
                // Override the navigator.webdriver property
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                
                // Override plugins to make it look real
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                
                // Override languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
                
                // Override chrome property
                window.chrome = {
                    runtime: {}
                };
                
                // Override permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
            """)
            
            page = await context.new_page()
            
            try:
                print(f"Loading page: {url}")
                # Try to load with minimal wait requirements
                try:
                    await page.goto(url, wait_until='domcontentloaded', timeout=self.timeout)
                except Exception as e:
                    print(f"Initial load attempt failed: {e}")
                    print("Trying alternative approach...")
                    # Try with no wait_until
                    await page.goto(url, timeout=self.timeout)
                
                # Wait for cart content to load with human-like delays
                print("Waiting for cart data to load...")
                await asyncio.sleep(3)  # Initial wait
                
                # Simulate human behavior - scroll and move mouse
                print("Simulating human behavior...")
                await page.mouse.move(100, 100)
                await asyncio.sleep(0.5)
                await page.mouse.move(200, 300)
                await asyncio.sleep(0.5)
                
                # Scroll down slowly
                for i in range(3):
                    await page.evaluate('window.scrollBy(0, 300)')
                    await asyncio.sleep(0.7)
                
                # Wait a bit more for any dynamic content
                await asyncio.sleep(3)
                
                # Optionally wait for specific elements
                try:
                    await page.wait_for_selector('body', timeout=5000)
                except PlaywrightTimeout:
                    print("Warning: Timeout waiting for body, proceeding anyway...")
                
                # Extract cart items
                items = await self._extract_items_from_page(page)
                
                if not items:
                    # Try to get page content for debugging
                    content = await page.content()
                    # Look for any JSON data in the page
                    items = self._extract_from_html_content(content)
                
                return items
                
            except Exception as e:
                print(f"Error during scraping: {e}")
                return []
            finally:
                await browser.close()
    
    async def _convert_share_url_to_cart_url(self, share_url: str) -> Optional[str]:
        """Convert Shein share URL to actual cart landing URL"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto(share_url, timeout=10000)
                content = await page.content()
                await browser.close()
                
                # Look for shareInfo in JavaScript
                match = re.search(r'var\s+shareInfo\s*=\s*({[^;]+});', content)
                if match:
                    share_info = json.loads(match.group(1))
                    share_id = share_info.get('shareId') or share_info.get('id')
                    local_country = share_info.get('localcountry', '')
                    cart_share = share_info.get('cart_share', 1)
                    
                    if share_id:
                        country_code = local_country.lower() if local_country else ''
                        if country_code:
                            base_url = f'https://m.shein.com/{country_code}/cart/share/landing'
                        else:
                            base_url = 'https://m.shein.com/cart/share/landing'
                        
                        params = {
                            'group_id': share_id,
                            'local_country': local_country,
                            'url_from': '',
                            'cart_share': cart_share
                        }
                        return f"{base_url}?{urlencode(params)}"
            except Exception as e:
                print(f"Error converting share URL: {e}")
            finally:
                if browser.is_connected():
                    await browser.close()
        
        return None
    
    async def _extract_items_from_page(self, page) -> List[Dict[str, any]]:
        """Extract cart items from the loaded page using browser automation"""
        items = []
        
        try:
            # Save screenshot for debugging
            await page.screenshot(path='debug_screenshot.png')
            print("Saved screenshot to debug_screenshot.png")
            
            # Try to extract from JavaScript variables first
            cart_data = await page.evaluate('''() => {
                // Try to find cart data in common places
                if (window.__NUXT__) return window.__NUXT__;
                if (window.__INITIAL_STATE__) return window.__INITIAL_STATE__;
                if (window.cartData) return window.cartData;
                if (window.gbRawData) return window.gbRawData;
                
                // Check for data in script tags
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const text = script.textContent;
                    if (text.includes('cartData') || text.includes('cartInfo')) {
                        return text;
                    }
                }
                return null;
            }''')
            
            if cart_data:
                if isinstance(cart_data, str):
                    # If it's a string, try to parse it
                    items = self._extract_from_html_content(cart_data)
                else:
                    items = self._parse_json_for_items(cart_data)
                    
                if items:
                    print(f"Found {len(items)} items from JavaScript data")
                    return items
            
            # Try more comprehensive DOM extraction
            print("Trying DOM extraction...")
            
            # Get all text content for inspection
            all_text = await page.evaluate('''() => {
                return document.body.innerText;
            }''')
            
            # Try various selectors for cart items
            selectors = [
                'div[data-product]',
                'div[class*="cart-item"]',
                'li[class*="cart-item"]',
                'div[class*="goods-item"]',
                'div[class*="product-item"]',
                '.cart-goods-item',
                '.goods-item',
                '[class*="CartItem"]',
                '[data-testid*="cart"]',
            ]
            
            for selector in selectors:
                product_elements = await page.query_selector_all(selector)
                if len(product_elements) > 0:
                    print(f"Found {len(product_elements)} elements with selector: {selector}")
                    
                    for element in product_elements:
                        try:
                            item = {}
                            
                            # Get all text from element
                            element_text = await element.inner_text()
                            element_html = await element.inner_html()
                            
                            # Try multiple selectors for name
                            name_selectors = [
                                '[class*="name"]', '[class*="title"]', '[class*="Name"]', 
                                'h2', 'h3', 'h4', 'p[class*="title"]', 'a[class*="name"]'
                            ]
                            
                            for name_sel in name_selectors:
                                name_elem = await element.query_selector(name_sel)
                                if name_elem:
                                    name_text = await name_elem.inner_text()
                                    if name_text and len(name_text.strip()) > 0:
                                        item['name'] = name_text.strip()
                                        break
                            
                            # Try multiple selectors for price
                            price_selectors = [
                                '[class*="price"]', '[class*="Price"]', 
                                '[data-price]', 'span[class*="amount"]'
                            ]
                            
                            for price_sel in price_selectors:
                                price_elem = await element.query_selector(price_sel)
                                if price_elem:
                                    price_text = await price_elem.inner_text()
                                    if price_text and ('$' in price_text or 'R' in price_text or any(c.isdigit() for c in price_text)):
                                        item['price'] = price_text.strip()
                                        break
                            
                            # Extract quantity
                            qty_selectors = ['[class*="quantity"]', '[class*="qty"]', 'input[type="number"]']
                            for qty_sel in qty_selectors:
                                qty_elem = await element.query_selector(qty_sel)
                                if qty_elem:
                                    qty_text = await qty_elem.inner_text() or await qty_elem.get_attribute('value')
                                    if qty_text:
                                        item['quantity'] = qty_text.strip()
                                        break
                            
                            # Extract image
                            img_elem = await element.query_selector('img')
                            if img_elem:
                                img_src = await img_elem.get_attribute('src') or await img_elem.get_attribute('data-src')
                                if img_src:
                                    item['image'] = img_src
                            
                            # If we found at least a name or price, add it
                            if item.get('name') or item.get('price'):
                                items.append(item)
                        except Exception as e:
                            print(f"Error parsing element: {e}")
                            continue
                    
                    if items:
                        break
            
            if items:
                print(f"Found {len(items)} items from DOM elements")
                return items
            
            # Last resort: save HTML for manual inspection
            html_content = await page.content()
            with open('debug_page.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            print("Saved page HTML to debug_page.html for inspection")
            
        except Exception as e:
            print(f"Error extracting items: {e}")
            import traceback
            traceback.print_exc()
        
        return items
    
    def _extract_from_html_content(self, html_content: str) -> List[Dict[str, any]]:
        """Fallback: Extract items from raw HTML content"""
        items = []
        
        patterns = [
            r'window\.__NUXT__\s*=\s*(.+?);',
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'var\s+cartData\s*=\s*({.+?});',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, html_content, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(1))
                    items = self._parse_json_for_items(data)
                    if items:
                        break
                except:
                    continue
        
        return items
    
    def _parse_json_for_items(self, data: any) -> List[Dict[str, any]]:
        """Recursively search for cart items in JSON structure"""
        items = []
        
        cart_keys = ['cart', 'cartItems', 'items', 'products', 'goods', 'cartGoods', 'productList', 'goodsList', 'cartInfo']
        
        if isinstance(data, dict):
            for key in cart_keys:
                if key in data and isinstance(data[key], list):
                    for item in data[key]:
                        if isinstance(item, dict):
                            parsed_item = self._parse_item(item)
                            if parsed_item:
                                items.append(parsed_item)
            
            if not items:
                for value in data.values():
                    if isinstance(value, (dict, list)):
                        nested_items = self._parse_json_for_items(value)
                        items.extend(nested_items)
                        if items:
                            break
        
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    parsed_item = self._parse_item(item)
                    if parsed_item:
                        items.append(parsed_item)
        
        return items
    
    def _parse_item(self, item: dict) -> Optional[Dict[str, any]]:
        """Parse a single item from JSON data"""
        product_info = {}
        
        # Product name/title
        for key in ['name', 'title', 'productName', 'goodsName', 'goods_name', 'goods_title', 'productRelationID']:
            if key in item and item[key]:
                product_info['name'] = str(item[key])
                break
        
        # Price
        for key in ['price', 'salePrice', 'retailPrice', 'amount', 'unit_price', 'goods_price', 'unitPrice']:
            if key in item and item[key]:
                product_info['price'] = item[key]
                break
        
        # Quantity
        for key in ['quantity', 'qty', 'num', 'amount', 'goods_num']:
            if key in item and item[key]:
                product_info['quantity'] = item[key]
                break
        
        # Image
        for key in ['image', 'img', 'thumbnail', 'pic', 'goodsImg', 'goods_img', 'goods_image', 'goodsThumb']:
            if key in item and item[key]:
                product_info['image'] = item[key]
                break
        
        # SKU/Product ID
        for key in ['sku', 'id', 'productId', 'goodsId', 'goods_id', 'goods_sn', 'productRelationID']:
            if key in item and item[key]:
                product_info['sku'] = str(item[key])
                break
        
        # Color/Size
        if 'color' in item:
            product_info['color'] = item['color']
        if 'size' in item:
            product_info['size'] = item['size']
        
        # Attributes
        for key in ['attr', 'attributes', 'sku_info', 'skuInfo', 'attrInfo']:
            if key in item and isinstance(item[key], (dict, list)):
                product_info['attributes'] = item[key]
                break
        
        return product_info if product_info else None


async def main():
    """Main function to run the scraper"""
    if len(sys.argv) < 2:
        print("Usage: python scrape_shein_cart_browser.py <shein_cart_url> [--headless]")
        print("\nExample:")
        print("  python scrape_shein_cart_browser.py https://www.shein.com/cart/...")
        print("  python scrape_shein_cart_browser.py https://api-shein.shein.com/h5/sharejump/appjump?link=...")
        print("  python scrape_shein_cart_browser.py <url> --headless  # Run in headless mode")
        print("\nNote: By default, runs with visible browser to handle CAPTCHAs")
        sys.exit(1)
    
    url = sys.argv[1]
    
    # Check for headless flag
    headless = '--headless' in sys.argv or '-h' in sys.argv
    
    print(f"Scraping Shein cart URL: {url}")
    print(f"Mode: {'Headless' if headless else 'Visible Browser'}")
    print("-" * 60)
    
    scraper = SheinCartScraperBrowser(headless=headless)
    items = await scraper.scrape_cart(url)
    
    if items:
        print(f"\n✓ Found {len(items)} item(s) in cart:\n")
        print(json.dumps(items, indent=2, ensure_ascii=False))
        return 0
    else:
        print("\n✗ No items found or unable to scrape the cart.")
        print("\nPossible reasons:")
        print("  - Cart is empty")
        print("  - Cart URL has expired")
        print("  - URL requires authentication")
        print("  - Page structure has changed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
