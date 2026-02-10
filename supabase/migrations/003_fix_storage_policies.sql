-- Create storage bucket and simplified RLS policies for payment proofs
-- Run this in Supabase SQL Editor

-- First, ensure the bucket exists (run this in Storage UI or here)
-- Bucket name: order-documents
-- Public: true

-- Delete any existing policies
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

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
