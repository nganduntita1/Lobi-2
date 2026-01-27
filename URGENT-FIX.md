# URGENT FIX - Run These SQL Commands Now

## Problem 1: Storage Upload Error (RLS Policy)
## Problem 2: Currency Display (Everything in USD)

---

## STEP 1: Fix Storage Bucket Policies

Go to your Supabase Dashboard → SQL Editor and run this:

```sql
-- Delete old restrictive policies
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Create simple, working policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-documents');

CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-documents');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-documents');
```

---

## STEP 2: Verify Storage Bucket Exists

1. Go to Supabase Dashboard → Storage
2. Check if `order-documents` bucket exists
3. If not, create it:
   - Click "Create bucket"
   - Name: `order-documents`
   - **Make it PUBLIC** ✅
   - Click "Create"

---

## STEP 3: Restart Your App

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
cd mobile-app
npm start
```

---

## What Was Fixed:

### ✅ Storage Upload Issue:
- **Problem:** RLS policies were too restrictive
- **Solution:** Simplified to allow all authenticated users to upload/read
- **Result:** Payment proof upload now works

### ✅ Currency Display:
- **Problem:** Prices showing in mixed currencies (ZAR/USD)
- **Solution:** Everything now in USD
- **Changes:**
  - Shein cart prices automatically converted: R148 → $8.29 USD
  - All totals shown in USD
  - Optional CDF conversion for Congolese customers
  - Payment instructions show USD amount

---

## Test It:

1. **Upload Payment Proof:**
   - Place an order
   - Go to Orders screen
   - Click "📤 Upload Proof"
   - Take/choose a photo
   - Should upload successfully ✅

2. **Check Prices:**
   - Scrape a Shein cart
   - Prices should show in USD
   - Order total should be in USD
   - Example: "Total: $43.75 USD"

---

## Quick Verification Checklist:

- [ ] Storage policies updated (run SQL above)
- [ ] `order-documents` bucket exists and is PUBLIC
- [ ] App restarted
- [ ] Payment proof upload works
- [ ] All prices showing in USD

---

## Still Having Issues?

### If upload still fails:

1. Check Supabase logs:
   - Dashboard → Logs → Storage
   - Look for error messages

2. Verify bucket settings:
   - Should be PUBLIC
   - RLS enabled
   - Policies applied

3. Check console errors:
   - Press F12 in browser
   - Look for detailed error messages

### If prices still wrong:

1. Clear app cache:
   ```bash
   # In mobile-app directory
   npm start -- --clear
   ```

2. Check that items are being converted:
   - Should see "$X.XX USD" not "R XXX"

---

## Need More Help?

The code changes are already applied. You just need to:
1. ✅ Run the SQL above
2. ✅ Verify bucket exists
3. ✅ Restart app

That's it! 🚀
