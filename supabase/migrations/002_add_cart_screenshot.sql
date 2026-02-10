-- Add cart screenshot URL to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cart_screenshot_url TEXT;

-- Create cart screenshots bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cart-screenshots', 'cart-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cart screenshots
DROP POLICY IF EXISTS "Cart screenshots are publicly readable" ON storage.objects;
CREATE POLICY "Cart screenshots are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cart-screenshots');

DROP POLICY IF EXISTS "Users can upload cart screenshots" ON storage.objects;
CREATE POLICY "Users can upload cart screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cart-screenshots' AND auth.uid() IS NOT NULL);
