# Shein Cart Scraper

A Python script to scrape items from a public Shein cart URL.

## Features

- Extracts product information from Shein cart URLs
- **NEW**: Browser-based scraper that handles JavaScript-rendered content
- Handles share URLs and converts them to cart landing URLs
- Returns structured data including:
  - Product name
  - Price
  - Quantity
  - Image URL
  - SKU/Product ID
  - Color/Size/Attributes (when available)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Install Playwright browsers (required for browser-based scraper):
```bash
playwright install chromium
```

## Usage

### Browser-Based Scraper (Recommended)

This version uses a headless browser to execute JavaScript and extract cart data:

```bash
python scrape_shein_cart_browser.py <shein_cart_url>
```

### Basic HTTP Scraper

For simple scraping without browser automation:

```bash
python scrape_shein_cart.py <shein_cart_url>
```

### Examples

```bash
# Using browser-based scraper (handles JavaScript)
python scrape_shein_cart_browser.py "https://api-shein.shein.com/h5/sharejump/appjump?link=lbCieue0XMV_b&localcountry=ZA"

# Using basic scraper
python scrape_shein_cart.py "https://m.shein.com/cart/share/landing?group_id=629363735"
```

## Output

The script outputs JSON formatted data with the cart items:

```json
[
  {
    "name": "Product Name",
    "price": "19.99",
    "quantity": 2,
    "image": "https://...",
    "sku": "12345",
    "color": "Black",
    "size": "M"
  }
]
```

## How It Works

The scraper uses multiple strategies to extract cart data:

1. **JSON Extraction**: Searches for embedded JSON data in script tags or JavaScript variables
2. **HTML Parsing**: Falls back to parsing HTML elements if JSON data isn't found
3. **Flexible Parsing**: Handles various data structures and field names

## Limitations

- Only works with **public** Shein cart URLs (shared carts)
- **Important**: Shein cart pages load data dynamically via JavaScript. The current script extracts the share information and converts share URLs to cart landing URLs, but to get the actual product data, you would need:
  - A headless browser (Selenium/Playwright) to execute JavaScript
  - Or reverse-engineer Shein's internal API endpoints
- May not work if Shein changes their page structure
- Requires active internet connection
- Some cart URLs may expire or require authentication

## Current Functionality

The script successfully:
✓ Converts Shein share URLs (e.g., `https://api-shein.shein.com/h5/sharejump/appjump?link=...`) to cart landing URLs
✓ Extracts share information (group_id, local_country, etc.)
✗ Cannot extract actual product data without JavaScript execution

Your URL: `https://api-shein.shein.com/h5/sharejump/appjump?link=lbCieue0XMV_b&localcountry=ZA`
Converts to: `https://m.shein.com/za/cart/share/landing?group_id=629363735&local_country=ZA&url_from=&cart_share=1`

To get the actual cart items, Shein's page makes API calls after loading. You would need to:
1. Open the URL in a headless browser and wait for data to load
2. Or inspect network traffic to find the API endpoint and call it directly

## Notes

- The script respects Shein's robots.txt and uses appropriate request headers
- For large-scale scraping, consider implementing rate limiting
- Always check Shein's Terms of Service before scraping
