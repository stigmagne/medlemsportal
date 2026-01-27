-- Storage Security Fix - Phase 2
-- Makes all sensitive storage buckets private and adds org-scoped RLS policies

-- =====================================================
-- 1. Make Buckets Private
-- =====================================================

UPDATE storage.buckets 
SET public = false 
WHERE name IN ('receipts', 'campaign_images', 'case_attachments');

-- =====================================================
-- 2. RLS Policies for Receipts Bucket
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Org members can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can delete receipts" ON storage.objects;

-- View: Members can view receipts from their organization
CREATE POLICY "Org members can view receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  -- Check if user has access to the org in the file path
  -- Path format: {org_id}/{expense_id}/{filename}
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- Upload: Org admins can upload receipts
CREATE POLICY "Org admins can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- Delete: Org admins can delete receipts
CREATE POLICY "Org admins can delete receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- 3. RLS Policies for Campaign Images Bucket
-- =====================================================

DROP POLICY IF EXISTS "Org members can view campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can upload campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can delete campaign images" ON storage.objects;

-- View: Members can view campaign images from their organization
CREATE POLICY "Org members can view campaign images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'campaign_images' AND
  -- Path format: {org_id}/{campaign_id}/{filename}
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- Upload: Org admins can upload campaign images
CREATE POLICY "Org admins can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign_images' AND
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- Delete: Org admins can delete campaign images
CREATE POLICY "Org admins can delete campaign images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign_images' AND
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- 4. RLS Policies for Case Attachments Bucket
-- =====================================================

DROP POLICY IF EXISTS "Org members can view case attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can upload case attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can delete case attachments" ON storage.objects;

-- View: Members can view case attachments from their organization
CREATE POLICY "Org members can view case attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case_attachments' AND
  -- Path format: {org_id}/{case_id}/{filename}
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
  )
);

-- Upload: Org admins can upload case attachments
CREATE POLICY "Org admins can upload case attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case_attachments' AND
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- Delete: Org admins can delete case attachments
CREATE POLICY "Org admins can delete case attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'case_attachments' AND
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = (storage.foldername(name))[1]::uuid
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);
