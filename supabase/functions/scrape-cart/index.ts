import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes('shein.com')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid Shein URL',
          items: [],
          total_items: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Scrape the cart
    const items = await scrapeSheinCart(url);

    return new Response(
      JSON.stringify({
        success: items.length > 0,
        items,
        total_items: items.length,
        message: items.length > 0 ? 'Successfully scraped cart' : 'No items found'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message,
        items: [],
        total_items: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function scrapeSheinCart(url: string) {
  // Convert share URL if needed
  if (url.includes('sharejump') || url.includes('api-shein.shein.com')) {
    url = await convertShareUrl(url);
  }

  // Fetch the page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cart page: ${response.status}`);
  }

  const html = await response.text();

  // Try to extract from embedded JSON
  let items = extractFromJson(html);

  // If no items found, try DOM parsing (basic)
  if (items.length === 0) {
    items = extractFromHtml(html);
  }

  return items;
}

async function convertShareUrl(shareUrl: string): Promise<string> {
  try {
    const response = await fetch(shareUrl);
    const html = await response.text();

    // Extract shareInfo
    const match = html.match(/var\s+shareInfo\s*=\s*({[^;]+});/);
    if (match) {
      const shareInfo = JSON.parse(match[1]);
      const shareId = shareInfo.shareId || shareInfo.id;
      const country = shareInfo.localcountry || '';

      const params = new URLSearchParams({
        group_id: shareId,
        local_country: country,
        cart_share: '1',
      });

      return `https://m.shein.com/${country.toLowerCase()}/cart/share/landing?${params}`;
    }
  } catch (error) {
    console.error('Error converting share URL:', error);
  }
  
  return shareUrl;
}

function extractFromJson(html: string) {
  const items: any[] = [];

  // Try to find __NUXT__ or __INITIAL_STATE__
  const patterns = [
    /window\.__NUXT__\s*=\s*({.+?});/s,
    /window\.__INITIAL_STATE__\s*=\s*({.+?});/s,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const extracted = parseCartData(data);
        if (extracted.length > 0) {
          return extracted;
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
  }

  return items;
}

function parseCartData(data: any): any[] {
  const items: any[] = [];
  const cartKeys = ['cart', 'cartItems', 'items', 'goods', 'goodsList'];

  function traverse(obj: any) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const parsed = parseItem(item);
        if (parsed) items.push(parsed);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of cartKeys) {
        if (obj[key] && Array.isArray(obj[key])) {
          traverse(obj[key]);
          return;
        }
      }
      for (const value of Object.values(obj)) {
        if (typeof value === 'object') traverse(value);
      }
    }
  }

  traverse(data);
  return items;
}

function parseItem(item: any) {
  if (typeof item !== 'object') return null;

  const result: any = {};

  // Name
  for (const key of ['name', 'title', 'goodsName', 'goods_name']) {
    if (item[key]) {
      result.name = String(item[key]);
      break;
    }
  }

  // Price
  for (const key of ['price', 'salePrice', 'unit_price']) {
    if (item[key]) {
      result.price = String(item[key]);
      break;
    }
  }

  // Quantity
  for (const key of ['quantity', 'qty', 'num']) {
    if (item[key]) {
      result.quantity = String(item[key]);
      break;
    }
  }

  // Image
  for (const key of ['image', 'img', 'goodsImg']) {
    if (item[key]) {
      let img = String(item[key]);
      if (!img.startsWith('http')) {
        img = img.startsWith('//') ? `https:${img}` : img;
      }
      result.image = img;
      break;
    }
  }

  // SKU
  for (const key of ['sku', 'id', 'goodsId']) {
    if (item[key]) {
      result.sku = String(item[key]);
      break;
    }
  }

  return result.name ? result : null;
}

function extractFromHtml(html: string) {
  const items: any[] = [];
  
  // Basic regex-based extraction (not as reliable as DOM parsing)
  // This is a fallback and may need improvement
  const productNamePattern = /<[^>]*class="[^"]*(?:goods-name|product-name)[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi;
  const pricePattern = /<[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/[^>]*>/gi;

  let match;
  const names: string[] = [];
  const prices: string[] = [];

  while ((match = productNamePattern.exec(html)) !== null) {
    names.push(match[1].trim());
  }

  while ((match = pricePattern.exec(html)) !== null) {
    const price = match[1].trim();
    if (/[$€£¥R]/.test(price) && /\d/.test(price)) {
      prices.push(price);
    }
  }

  // Pair names with prices
  const minLen = Math.min(names.length, prices.length);
  for (let i = 0; i < minLen; i++) {
    items.push({
      name: names[i],
      price: prices[i],
      quantity: '1',
    });
  }

  return items;
}
