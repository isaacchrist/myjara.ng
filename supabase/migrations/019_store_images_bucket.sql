-- Create a new storage bucket for store images (gallery, banners, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-images', 'store-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access (Anyone can view store images)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-images' );

-- Policy: Allow authenticated users to upload images (Retailers/Brands)
-- We can refine this later to only allow store owners, but for now auth users is fine as they need to upload during registration
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'store-images' AND auth.role() = 'authenticated' );

-- Policy: Allow users to update/delete their own uploads (or checking owner_id path convention if we enforce one)
-- For now, relying on standard RLS where users can manage objects they created if we add owner column, 
-- but simpler policy for MVP:
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'store-images' AND auth.uid() = owner );

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'store-images' AND auth.uid() = owner );
