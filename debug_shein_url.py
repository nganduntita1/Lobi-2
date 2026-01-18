#!/usr/bin/env python3
"""Debug script to see what Shein share URLs return"""

import requests
import json
import sys

url = sys.argv[1] if len(sys.argv) > 1 else "https://api-shein.shein.com/h5/sharejump/appjump?link=lbCieue0XMV_b&localcountry=ZA"

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

print(f"Testing URL: {url}\n")

session = requests.Session()
response = session.get(url, headers=headers, timeout=10, allow_redirects=True)

print(f"Status Code: {response.status_code}")
print(f"Final URL: {response.url}")
print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
print(f"\nResponse length: {len(response.content)} bytes")
print(f"\nFirst 1000 characters of response:")
print("-" * 60)
print(response.text[:1000])
print("-" * 60)

# Try to parse as JSON
try:
    data = json.loads(response.text)
    print("\n✓ Response is valid JSON:")
    print(json.dumps(data, indent=2)[:2000])
except json.JSONDecodeError:
    print("\n✗ Response is not JSON")
    print("\nFull response (first 2000 chars):")
    print(response.text[:2000])
