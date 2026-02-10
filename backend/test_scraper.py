"""
Test script to debug Shein cart scraping
"""
import asyncio
from playwright.async_api import async_playwright

async def test_scrape():
    # Test URL - replace with actual cart URL
    url = input("Enter Shein cart URL to test: ")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,  # Show browser
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
        
        print(f"Loading URL: {url}")
        await page.goto(url, wait_until='load', timeout=90000)
        
        print("Waiting for content...")
        await asyncio.sleep(15)
        
        # Save HTML for inspection
        html = await page.content()
        with open('debug_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Saved HTML to debug_page.html")
        
        # Check for JavaScript data
        cart_data = await page.evaluate('''() => {
            const sources = {
                NUXT: window.__NUXT__,
                STATE: window.__INITIAL_STATE__,
                RAID: window.gbRaidData,
                CART: window.cart,
                CART_DATA: window.cartData
            };
            
            for (const [name, data] of Object.entries(sources)) {
                if (data) {
                    console.log(`Found ${name}:`, data);
                    return { source: name, data: data };
                }
            }
            return null;
        }''')
        
        if cart_data:
            print(f"\n✓ Found JS data source: {cart_data['source']}")
            import json
            with open('cart_data.json', 'w') as f:
                json.dump(cart_data, f, indent=2)
            print("Saved to cart_data.json")
        else:
            print("\n✗ No JS data found")
        
        # Check DOM elements
        print("\n--- Checking DOM Elements ---")
        selectors = [
            '[class*="cart-item"]',
            '[class*="goods-item"]',
            '[class*="product-item"]',
            '[class*="CartItem"]',
        ]
        
        for selector in selectors:
            elements = await page.query_selector_all(selector)
            if elements:
                print(f"✓ '{selector}': {len(elements)} elements")
                
                # Get first element details
                if elements:
                    first = elements[0]
                    html = await first.inner_html()
                    print(f"  First element HTML (truncated): {html[:200]}...")
            else:
                print(f"✗ '{selector}': 0 elements")
        
        print("\nPress Enter to close browser...")
        input()
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_scrape())
