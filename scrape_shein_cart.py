#!/usr/bin/env python3
"""
Shein Cart Scraper
This script scrapes items from a public Shein cart URL and returns the cart items.
"""

import sys
import json
import re
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from urllib.parse import urlencode


class SheinCartScraper:
    """Scraper for Shein public cart URLs"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    def scrape_cart(self, url: str) -> List[Dict[str, any]]:
        """
        Scrape items from a Shein cart URL
        
        Args:
            url: Public Shein cart URL
            
        Returns:
            List of cart items with their details
        """
        try:
            # Validate URL
            if not self._is_valid_shein_url(url):
                raise ValueError("Invalid Shein URL provided")
            
            # Handle share/redirect URLs
            if 'api-shein.shein.com' in url or 'sharejump' in url:
                print(f"Share URL detected, extracting cart landing URL...")
                url = self._convert_share_url_to_cart_url(url)
                if not url:
                    print("Could not extract cart landing URL")
                    return []
                print(f"Cart landing URL: {url}")
            
            # Make request
            session = requests.Session()
            response = session.get(url, headers=self.headers, timeout=10, allow_redirects=True)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract cart items
            items = self._extract_items(soup, response.text)
            
            return items
            
        except requests.RequestException as e:
            print(f"Error fetching URL: {e}", file=sys.stderr)
            return []
        except Exception as e:
            print(f"Error scraping cart: {e}", file=sys.stderr)
            return []
    
    def _is_valid_shein_url(self, url: str) -> bool:
        """Validate if URL is a Shein cart URL"""
        return 'shein.com' in url.lower() or 'sheincart' in url.lower()
    
    def _convert_share_url_to_cart_url(self, share_url: str) -> Optional[str]:
        """
        Convert Shein share URL to actual cart landing URL
        Example: https://api-shein.shein.com/h5/sharejump/appjump?link=lbCieue0XMV_b&localcountry=ZA
        Converts to: https://m.shein.com/cart/share/landing?group_id=...
        """
        try:
            # Fetch the share page
            response = requests.get(share_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            # Look for shareInfo in JavaScript
            match = re.search(r'var\s+shareInfo\s*=\s*({[^;]+});', response.text)
            if match:
                share_info_str = match.group(1)
                share_info = json.loads(share_info_str)
                
                # Extract necessary parameters
                share_id = share_info.get('shareId') or share_info.get('id')
                local_country = share_info.get('localcountry', '')
                cart_share = share_info.get('cart_share', 1)
                
                if share_id:
                    # Build cart landing URL with country code in path
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
                    cart_url = f"{base_url}?{urlencode(params)}"
                    return cart_url
                    
        except Exception as e:
            print(f"Error converting share URL: {e}")
            
        return None
    
    def _extract_items(self, soup: BeautifulSoup, html_text: str) -> List[Dict[str, any]]:
        """
        Extract cart items from parsed HTML
        
        This method tries multiple strategies to find cart items:
        1. Look for JSON data in script tags
        2. Parse HTML elements for product cards
        """
        items = []
        
        # Strategy 1: Try to find JSON data in script tags
        items = self._extract_from_json(soup, html_text)
        
        # Strategy 2: If no items found, try parsing HTML elements
        if not items:
            items = self._extract_from_html(soup)
        
        return items
    
    def _extract_from_json(self, soup: BeautifulSoup, html_text: str) -> List[Dict[str, any]]:
        """Extract items from JSON data embedded in the page"""
        items = []
        
        # Look for script tags containing cart data
        script_tags = soup.find_all('script', type='application/json')
        
        for script in script_tags:
            try:
                data = json.loads(script.string)
                # Try to find cart items in the JSON structure
                items = self._parse_json_for_items(data)
                if items:
                    break
            except (json.JSONDecodeError, AttributeError):
                continue
        
        # Also try to find window.__INITIAL_STATE__ or similar patterns
        if not items:
            patterns = [
                r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
                r'window\.gbRawData\s*=\s*({.+?});',
                r'cartData\s*=\s*({.+?});',
                r'shareInfo\s*=\s*({.+?});'
            ]
            
            for pattern in patterns:
                matches = re.search(pattern, html_text, re.DOTALL)
                if matches:
                    try:
                        data = json.loads(matches.group(1))
                        items = self._parse_json_for_items(data)
                        if items:
                            break
                    except json.JSONDecodeError:
                        continue
        
        return items
    
    def _parse_json_for_items(self, data: dict) -> List[Dict[str, any]]:
        """Recursively search for cart items in JSON structure"""
        items = []
        
        # Common keys that might contain cart items
        cart_keys = ['cart', 'cartItems', 'items', 'products', 'goods', 'cartGoods', 'productList', 'goodsList']
        
        if isinstance(data, dict):
            for key in cart_keys:
                if key in data and isinstance(data[key], list):
                    for item in data[key]:
                        if isinstance(item, dict):
                            parsed_item = self._parse_item(item)
                            if parsed_item:
                                items.append(parsed_item)
            
            # Recursively search nested dictionaries
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
        # Extract common product fields
        product_info = {}
        
        # Product name/title
        for key in ['name', 'title', 'productName', 'goodsName', 'goods_name', 'goods_title']:
            if key in item:
                product_info['name'] = item[key]
                break
        
        # Price
        for key in ['price', 'salePrice', 'retailPrice', 'amount', 'unit_price', 'goods_price']:
            if key in item:
                product_info['price'] = item[key]
                break
        
        # Quantity
        for key in ['quantity', 'qty', 'num', 'amount', 'goods_num']:
            if key in item:
                product_info['quantity'] = item[key]
                break
        
        # Image
        for key in ['image', 'img', 'thumbnail', 'pic', 'goodsImg', 'goods_img', 'goods_image']:
            if key in item:
                product_info['image'] = item[key]
                break
        
        # SKU/Product ID
        for key in ['sku', 'id', 'productId', 'goodsId', 'goods_id', 'goods_sn']:
            if key in item:
                product_info['sku'] = item[key]
                break
        
        # Color/Size
        if 'color' in item:
            product_info['color'] = item['color']
        if 'size' in item:
            product_info['size'] = item['size']
        
        # Attributes
        for key in ['attr', 'attributes', 'sku_info', 'skuInfo']:
            if key in item and isinstance(item[key], (dict, list)):
                product_info['attributes'] = item[key]
                break
        
        # Only return if we found at least a name
        return product_info if 'name' in product_info else None
    
    def _extract_from_html(self, soup: BeautifulSoup) -> List[Dict[str, any]]:
        """Extract items by parsing HTML elements"""
        items = []
        
        # Common CSS selectors for Shein cart items
        selectors = [
            '.cart-item',
            '.cart-product',
            '.product-item',
            '[class*="cart"][class*="item"]',
            '[class*="product"][class*="card"]'
        ]
        
        product_elements = []
        for selector in selectors:
            product_elements = soup.select(selector)
            if product_elements:
                break
        
        for element in product_elements:
            item = {}
            
            # Extract name
            name_elem = element.find(['h3', 'h4', 'h5'], class_=re.compile(r'(name|title|product)', re.I))
            if name_elem:
                item['name'] = name_elem.get_text(strip=True)
            
            # Extract price
            price_elem = element.find(class_=re.compile(r'price', re.I))
            if price_elem:
                item['price'] = price_elem.get_text(strip=True)
            
            # Extract quantity
            qty_elem = element.find(class_=re.compile(r'(quantity|qty|amount)', re.I))
            if qty_elem:
                item['quantity'] = qty_elem.get_text(strip=True)
            
            # Extract image
            img_elem = element.find('img')
            if img_elem:
                item['image'] = img_elem.get('src') or img_elem.get('data-src')
            
            if item:
                items.append(item)
        
        return items


def main():
    """Main function to run the scraper"""
    if len(sys.argv) < 2:
        print("Usage: python scrape_shein_cart.py <shein_cart_url>")
        print("\nExample:")
        print("  python scrape_shein_cart.py https://www.shein.com/cart/...")
        sys.exit(1)
    
    url = sys.argv[1]
    
    print(f"Scraping Shein cart URL: {url}")
    print("-" * 60)
    
    scraper = SheinCartScraper()
    items = scraper.scrape_cart(url)
    
    if items:
        print(f"\nFound {len(items)} item(s) in cart:\n")
        print(json.dumps(items, indent=2, ensure_ascii=False))
    else:
        print("\nNo items found or unable to scrape the cart.")
        print("This could be due to:")
        print("  - Invalid or expired cart URL")
        print("  - Cart is empty")
        print("  - Shein's page structure has changed")
        print("  - URL requires authentication")
    
    return 0 if items else 1


if __name__ == "__main__":
    sys.exit(main())
