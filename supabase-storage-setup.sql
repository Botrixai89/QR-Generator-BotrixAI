-- Supabase Storage Setup for QR Logos
-- Run this in your Supabase SQL Editor

-- Create storage bucket for QR logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-logos', 'qr-logos', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Public read access for QR logos" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-logos');

CREATE POLICY "Authenticated users can upload QR logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'qr-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own QR logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'qr-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own QR logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'qr-logos' 
  AND auth.role() = 'authenticated'
);

