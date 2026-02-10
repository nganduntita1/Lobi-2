# Quick Setup Guide - Database & Settings

## Step 1: Run Database Migration

Copy and paste this into your Supabase SQL Editor:

```sql
-- Add payment and delivery fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 15.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'proof_submitted', 'verified', 'failed'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate_zar_to_usd DECIMAL(10, 4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate_usd_to_cdf DECIMAL(10, 4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_zar DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_usd DECIMAL(10, 2);

-- Update settings to include mobile money numbers
INSERT INTO settings (key, value, description) VALUES
    ('mpesa_number', '+243 XXX XXX XXX', 'M-Pesa mobile money number for payments'),
    ('orange_money_number', '+243 YYY YYY YYY', 'Orange Money number for payments'),
    ('airtel_money_number', '+243 ZZZ ZZZ ZZZ', 'Airtel Money number for payments'),
    ('delivery_fee_usd', '15.00', 'Fixed delivery fee from South Africa to Congo in USD')
ON CONFLICT (key) DO NOTHING;

-- Add comment to explain payment_status workflow
COMMENT ON COLUMN orders.payment_status IS 'Payment verification status: pending (awaiting payment) -> proof_submitted (customer uploaded proof) -> verified (admin confirmed) -> failed (payment rejected)';
```

---

## Step 2: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Bucket name: `order-documents`
4. Make it **Public** (so images can be viewed)
5. Click "Create bucket"

### Set Storage Policies:

```sql
-- Simple policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-documents');

-- Simple policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-documents');

-- Simple policy: Allow public reads (for viewing images)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'order-documents');
```

---

## Step 3: Update Mobile Money Numbers

**IMPORTANT:** Replace the placeholder numbers with your actual mobile money accounts:

```sql
-- Update M-Pesa number
UPDATE settings 
SET value = '+243 812 345 678'  -- ⬅️ CHANGE THIS
WHERE key = 'mpesa_number';

-- Update Orange Money number
UPDATE settings 
SET value = '+243 823 456 789'  -- ⬅️ CHANGE THIS
WHERE key = 'orange_money_number';

-- Update Airtel Money number
UPDATE settings 
SET value = '+243 834 567 890'  -- ⬅️ CHANGE THIS
WHERE key = 'airtel_money_number';
```

---

## Step 4: Install Dependencies

Run this in your terminal:

```bash
cd mobile-app
npm install expo-image-picker
```

---

## Step 5: Test the System

### As a Customer:
1. Scrape a Shein cart
2. Add items and proceed to checkout
3. Enter WhatsApp number
4. See payment instructions with mobile money numbers
5. Place order
6. Upload payment proof from Orders screen

### As an Admin:
1. Switch to admin account
2. Go to "Payments" tab
3. View pending payment verifications
4. Click on an order
5. View payment proof image
6. Verify or reject payment

---

## Optional: Update Exchange Rates

Edit: `mobile-app/src/services/currencyService.ts`

```typescript
const DEFAULT_RATES: ExchangeRates = {
  ZAR_to_USD: 0.056,  // Update with current rate from Google
  USD_to_CDF: 2500,   // Update with current Congolese Franc rate
};
```

Get current rates from: https://www.google.com/search?q=zar+to+usd

---

## Troubleshooting

### "Storage bucket not found" error:
- Make sure you created the `order-documents` bucket in Supabase
- Check bucket name is exactly: `order-documents` (lowercase, with dash)

### "Permission denied" error:
- Check RLS policies are applied
- Ensure user is authenticated

### Payment numbers not showing:
- Run Step 3 to update settings
- Restart the app

### Images not uploading:
- Check storage bucket exists
- Verify storage policies are set
- Check expo-image-picker is installed

---

## Quick Commands Cheat Sheet

```bash
# Install dependencies
cd mobile-app && npm install expo-image-picker

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Deploy backend (if needed)
cd ../backend
flyctl deploy
```

---

## ✅ You're Done!

The payment and delivery system is now fully operational. Users can:
- ✅ See $15 delivery fee in checkout
- ✅ View payment instructions with mobile money numbers
- ✅ Enter WhatsApp number for updates
- ✅ Upload payment proof
- ✅ See multi-currency pricing

Admins can:
- ✅ View pending payment verifications
- ✅ Verify or reject payments
- ✅ Track order status

---

## Need Help?

Check these files for implementation details:
- `IMPLEMENTATION-COMPLETE.md` - Full feature documentation
- `COMPREHENSIVE-ANALYSIS.md` - Business analysis
- `mobile-app/src/components/OrderReviewModal.tsx` - Checkout flow
- `mobile-app/src/screens/AdminPaymentVerificationScreen.tsx` - Admin verification
