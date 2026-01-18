#!/usr/bin/env python3
"""Analyze cart landing page structure"""

import requests
import json
import re

url = "https://m.shein.com/za/cart/share/landing?group_id=629363735&local_country=ZA&url_from=&cart_share=1"

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

print(f"Fetching: {url}\n")

response = requests.get(url, headers=headers, timeout=10)

print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Length: {len(response.text)}\n")

# Search for cart data patterns
patterns = [
    (r'window\.__INITIAL_STATE__\s*=\s*(\{.+?\});', 'window.__INITIAL_STATE__'),
    (r'window\.__NUXT__\s*=\s*(.+?);', 'window.__NUXT__'),
    (r'window\.gbRawData\s*=\s*(\{.+?\});', 'window.gbRawData'),
    (r'var\s+cartData\s*=\s*(\{.+?\});', 'cartData'),
    (r'var\s+productList\s*=\s*(\[.+?\]);', 'productList'),
]

found = False
for pattern, name in patterns:
    match = re.search(pattern, response.text, re.DOTALL)
    if match:
        print(f"✓ Found {name}")
        try:
            data = json.loads(match.group(1))
            print(f"  Type: {type(data)}")
            if isinstance(data, dict):
                print(f"  Keys: {list(data.keys())[:10]}")
            print(f"  Preview: {json.dumps(data, indent=2)[:500]}...")
            found = True
            break
        except json.JSONDecodeError as e:
            print(f"  JSON parse error: {e}")

if not found:
    print("No data patterns found, saving HTML...")
    with open('cart_landing.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("Saved to cart_landing.html")
    
    # Show first 2000 chars
    print(f"\nFirst 2000 characters:\n{response.text[:2000]}")
