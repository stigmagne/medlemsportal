-- =====================================================
-- RLS Policy Verification Queries
-- Purpose: Verify all RLS policies are active in production
-- K5: Critical Security Task
-- =====================================================

-- =====================================================
-- 1. Check RLS Enabled Status
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'email_campaigns',
    'notification_queue',
    'onboarding_progress',
    'travel_expenses',
    'payment_batches',
    'members',
    'payments',
    'meetings',
    'case_items',
    'user_org_access'
  )
ORDER BY tablename;

-- Expected: All tables should have rls_enabled = true

-- =====================================================
-- 2. List All RLS Policies
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    WHEN cmd = '*' THEN 'All'
    ELSE cmd
  END as operation_label,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'email_campaigns',
    'notification_queue',
    'onboarding_progress',
    'travel_expenses',
    'payment_batches',
    'members',
    'payments',
    'meetings',
    'case_items'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- 3. Verify Email Campaigns Policies
-- =====================================================

SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'email_campaigns'
ORDER BY policyname;

-- Expected policies:
-- - "Org members can view campaigns" (SELECT)
-- - "Org admins can manage campaigns" (*)

-- =====================================================
-- 4. Verify Notification Queue Policies
-- =====================================================

SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notification_queue'
ORDER BY policyname;

-- Expected policies:
-- - "Org members can view notifications" (SELECT)
-- - "Org admins can manage notifications" (*)

-- =====================================================
-- 5. Verify Onboarding Progress Policies
-- =====================================================

SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'onboarding_progress'
ORDER BY policyname;

-- Expected policies:
-- - "Admins can view own onboarding" (SELECT)
-- - "Admins can update own onboarding" (*)

-- =====================================================
-- 6. Verify Travel Expenses Policies
-- =====================================================

SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'travel_expenses'
ORDER BY policyname;

-- Expected policies:
-- - "Members can view expenses in own org" (SELECT)
-- - "Members can create expenses in own org" (INSERT)
-- - "Admins can manage expenses" (UPDATE)
-- - "Admins can delete expenses" (DELETE)

-- =====================================================
-- 7. Verify Payment Batches Policies
-- =====================================================

SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'payment_batches'
ORDER BY policyname;

-- Expected policies:
-- - "Admins can view batches" (SELECT)
-- - "Admins can manage batches" (*)

-- =====================================================
-- 8. Check Storage Bucket Privacy Settings
-- =====================================================

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('receipts', 'campaign_images', 'case_attachments')
ORDER BY name;

-- Expected: All buckets should have public = false

-- =====================================================
-- 9. Verify Storage RLS Policies
-- =====================================================

SELECT 
  policyname,
  cmd AS operation,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%receipts%' 
   OR policyname LIKE '%campaign_images%'
   OR policyname LIKE '%case_attachments%'
ORDER BY policyname;

-- Expected policies per bucket:
-- Receipts:
-- - "Org members can view receipts" (SELECT)
-- - "Org admins can upload receipts" (INSERT)
-- - "Org admins can delete receipts" (DELETE)
-- Campaign Images:
-- - "Org members can view campaign images" (SELECT)
-- - "Org admins can upload campaign images" (INSERT)
-- - "Org admins can delete campaign images" (DELETE)
-- Case Attachments:
-- - "Org members can view case attachments" (SELECT)
-- - "Org admins can upload case attachments" (INSERT)
-- - "Org admins can delete case attachments" (DELETE)

-- =====================================================
-- 10. Count Policies Per Table (Summary)
-- =====================================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'email_campaigns',
    'notification_queue',
    'onboarding_progress',
    'travel_expenses',
    'payment_batches',
    'members',
    'payments',
    'meetings',
    'case_items'
  )
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 11. Check for Missing Policies
-- =====================================================

-- Tables that should have RLS but might be missing policies
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'email_campaigns',
    'notification_queue',
    'onboarding_progress',
    'travel_expenses',
    'payment_batches',
    'members',
    'payments',
    'meetings',
    'case_items'
  )
GROUP BY t.tablename, t.rowsecurity
HAVING COUNT(p.policyname) = 0 OR t.rowsecurity = false
ORDER BY t.tablename;

-- Expected: This should return 0 rows (all tables have RLS enabled and policies)

-- =====================================================
-- 12. Verify Critical Core Tables
-- =====================================================

-- Check members table
SELECT 'members' as table_name, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'members'
UNION ALL
-- Check payment_transactions table
SELECT 'payment_transactions', COUNT(*)
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'payment_transactions'
UNION ALL
-- Check meetings table
SELECT 'meetings', COUNT(*)
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'meetings'
UNION ALL
-- Check case_items table
SELECT 'case_items', COUNT(*)
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'case_items';

-- Expected: All tables should have at least 2 policies
