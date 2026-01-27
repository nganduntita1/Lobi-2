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
