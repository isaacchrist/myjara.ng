-- Create storage bucket for store assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own store folder
CREATE POLICY \"Users can upload to own store folder\"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- Allow public read access
CREATE POLICY \"Public can view store assets\"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-assets');

-- Allow users to update their own store assets
CREATE POLICY \"Users can update own store assets\"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- Allow users to delete their own store assets
CREATE POLICY \"Users can delete own store assets\"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);
