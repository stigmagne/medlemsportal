-- Cleanup Duplicate RLS Policies - Phase 2
-- This file removes old/duplicate policies that existed before Phase 2 implementation
-- Run this AFTER missing-rls-policies.sql

-- =====================================================
-- Email Campaigns - Remove old duplicate policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view campaigns for their orgs" ON email_campaigns;
DROP POLICY IF EXISTS "Users can manage campaigns for their orgs" ON email_campaigns;

-- =====================================================
-- Notification Queue - Remove over-permissive policy
-- =====================================================

-- This policy allowed ALL authenticated users to do EVERYTHING - very dangerous!
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON notification_queue;

-- =====================================================
-- Verification
-- =====================================================

-- After cleanup, these tables should have the following policy counts:
-- email_campaigns: 2 policies (view + manage)
-- notification_queue: 2 policies (view + manage)
-- onboarding_progress: 2 policies (view + update)
-- payment_batches: 2 policies (view + manage)
-- travel_expenses: 4 policies (select + insert + update + delete)

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'email_campaigns',
  'notification_queue',
  'onboarding_progress',
  'travel_expenses',
  'payment_batches'
)
GROUP BY tablename
ORDER BY tablename;
