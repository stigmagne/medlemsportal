-- Storage Setup for Campaign Images

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign_images', 'campaign_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies

-- Allow authenticated members to upload
DROP POLICY IF EXISTS "Authenticated users can upload campaign images" ON storage.objects;
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'campaign_images' );

-- Allow public access to view
DROP POLICY IF EXISTS "Public can view campaign images" ON storage.objects;
CREATE POLICY "Public can view campaign images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'campaign_images' );

-- Allow users to delete own files
DROP POLICY IF EXISTS "Users can delete own campaign images" ON storage.objects;
CREATE POLICY "Users can delete own campaign images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'campaign_images' AND owner = auth.uid() );
