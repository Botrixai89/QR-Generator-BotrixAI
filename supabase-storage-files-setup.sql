-- Supabase Storage Setup for QR Code Files
-- Run this in your Supabase SQL Editor

-- Create storage bucket for QR code files
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-files', 'qr-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Public read access for QR files" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-files');

CREATE POLICY "Authenticated users can upload QR files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'qr-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own QR files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'qr-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own QR files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'qr-files' 
  AND auth.role() = 'authenticated'
);

