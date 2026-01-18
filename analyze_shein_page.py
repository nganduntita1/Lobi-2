#!/usr/bin/env python3
"""Extract and analyze JavaScript data from Shein share page"""

import requests
import json
import re
import sys

url = sys.argv[1] if len(sys.argv) > 1 else "https://api-shein.shein.com/h5/sharejump/appjump?link=lbCieue0XMV_b&localcountry=ZA"

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

print(f"Analyzing URL: {url}\n")

response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)

# Look for common JavaScript data patterns
patterns = [
    (r'window\.__INITIAL_STATE__\s*=\s*({.+?});', "window.__INITIAL_STATE__"),
    (r'window\.gbRawData\s*=\s*({.+?});', "window.gbRawData"),
    (r'window\.__CART_DATA__\s*=\s*({.+?});', "window.__CART_DATA__"),
    (r'cartData\s*=\s*({.+?});', "cartData"),
    (r'var\s+productList\s*=\s*(\[.+?\]);', "productList"),
    (r'var\s+goods\s*=\s*(\[.+?\]);', "goods"),
]

print("Searching for embedded JavaScript data...\n")

found_data = False
for pattern, name in patterns:
    matches = re.search(pattern, response.text, re.DOTALL)
    if matches:
        print(f"✓ Found: {name}")
        try:
            data = json.loads(matches.group(1))
            print(f"  Preview: {json.dumps(data, indent=2)[:500]}...")
            print()
            found_data = True
        except json.JSONDecodeError as e:
            print(f"  ✗ Error parsing JSON: {e}")
            print(f"  Raw data preview: {matches.group(1)[:200]}")
            print()

if not found_data:
    print("✗ No obvious JavaScript data patterns found")
    print("\nSearching for any JSON-like structures...")
    
    # Look for any object that might contain cart/product data
    json_like = re.findall(r'\{[^{}]*(?:"(?:cart|product|goods|item)"[^{}]*)\}', response.text)
    if json_like:
        print(f"Found {len(json_like)} potential JSON objects")
        for i, obj in enumerate(json_like[:3]):
            print(f"\n{i+1}. {obj[:200]}...")
    else:
        print("No cart-related JSON found in page")

# Save full HTML for inspection
with open('shein_page.html', 'w', encoding='utf-8') as f:
    f.write(response.text)
print(f"\n✓ Full HTML saved to shein_page.html ({len(response.text)} chars)")
