# Debug Guide: Missing Product Details 🔍

## What to Check in Console Logs

When you scrape a cart, look for this logging sequence:

```
📦 Parsing product 1:
  ✓ Found name in 'goods_name': Product Name Here
  💰 Price: R 299
  🖼️ Image: found

📦 Parsing product 2: ...
```

## If Images Are Not Found

The console will show:
```
📦 Parsing product 1:
  ✓ Found name in 'goods_name': ...
  💰 Price: ...
  🖼️ Image: not found
```

This means:
1. The product item doesn't have any of these fields:
   - goods_img, goodsImg, goods_image, goodsImage
   - product_img, productImg, image, img, picture
   - thumbnail, thumb, mainImage, main_image, coverImg
   - ... and many others (see the code)

2. Solution: Check the "First product structure" log and look for any field that contains a URL with `/` or `//`

## Understanding the Logging

### When data arrives:
```
✅ Intercepted API call: https://api-shein.shein.com/bff-api/social/share/get_cart_goods_info
📦 API Response structure: code, info, msg
📍 Found goodsInfo in data.info.goodsInfo
📊 Goods array: 4 items
```

### Then it shows the product structure:
```
📊 First product structure:
{
  "goods_id": "123456",
  "goods_name": "Product Name",
  "sale_price": {"amount": "299"},
  "goods_img": "//img.ltwebstatic.com/product.jpg",
  ... more fields
}
```

### Then parsing each product:
```
📦 Parsing product 1:
  ✓ Found name in 'goods_name': Elegant Shirt
  💰 Price: R 299
  🖼️ Image: found
✓ Product 1: Elegant Shirt
```

## If Still Missing Details

1. **Check the first product structure** - it will show ALL fields the API is sending
2. **Find the image field name** - Look for any field with a URL
3. **Find the price field** - Look for numeric values
4. **Tell me the field names** and I'll add them to the extraction

## Example

If the first product structure shows:
```
{
  "name": "My Product",
  "picUrl": "https://example.com/pic.jpg",
  "cost": 199,
  ...
}
```

Then I'll add `picUrl` to image fields and `cost` to price fields, and it will find them!

## Next Steps

Try scraping and check the console logs. The "📊 First product structure" will show exactly what fields the API is sending, and we can update the extraction code to find them.
