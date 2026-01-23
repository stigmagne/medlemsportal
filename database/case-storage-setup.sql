-- Storage Setup for Case Attachments

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('case_attachments', 'case_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies

-- Allow authenticated members to upload files
DROP POLICY IF EXISTS "Authenticated users can upload case attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload case attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'case_attachments' );

-- Allow public access to view case attachments (since bucket is public)
-- or check auth
DROP POLICY IF EXISTS "Public can view case attachments" ON storage.objects;
CREATE POLICY "Public can view case attachments"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'case_attachments' );

-- Optional: Delete own files
DROP POLICY IF EXISTS "Users can delete own case attachments" ON storage.objects;
CREATE POLICY "Users can delete own case attachments"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'case_attachments' AND owner = auth.uid() );
