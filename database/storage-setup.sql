-- Storage Setup for Receipts

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Should be on by default, but good to ensure)
-- tables are in storage schema, usually handled by Supabase

-- 3. Policies

-- Allow authenticated members to upload files
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'receipts' );

-- Allow public access to view receipts (since bucket is public)
-- Or restrict to authenticated if preferred. 
-- For now, matching the "Public" bucket setting for simplicity in MVP.
CREATE POLICY "Public can view receipts"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'receipts' );

-- Allow users to update/delete their own files (Optional)
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'receipts' AND owner = auth.uid() );
