-- Missing RLS Policies - Phase 2
-- Adds proper org-scoped RLS policies to tables that are missing them

-- =====================================================
-- 1. Email Campaigns
-- =====================================================

-- Campaigns are already tracked in email_tracking_events, but missing on the main table
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Org admins can manage campaigns" ON email_campaigns;

-- View: Members can view campaigns from their organization
CREATE POLICY "Org members can view campaigns"
ON email_campaigns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = email_campaigns.organization_id
  )
);

-- Manage: Org admins can create/update/delete campaigns
CREATE POLICY "Org admins can manage campaigns"
ON email_campaigns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = email_campaigns.organization_id
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- 2. Notification Queue
-- =====================================================

-- Check current policy status and fix overly permissive policies
DROP POLICY IF EXISTS "Anyone can do everything" ON notification_queue;
DROP POLICY IF EXISTS "All authenticated users" ON notification_queue;

-- View: Members can view notifications for their organization
CREATE POLICY "Org members can view notifications"
ON notification_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_items ci
    JOIN user_org_access uoa ON uoa.organization_id = ci.org_id
    WHERE ci.id = notification_queue.case_id
    AND uoa.user_id = auth.uid()
  )
);

-- Admins can manage notifications
CREATE POLICY "Org admins can manage notifications"
ON notification_queue FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM case_items ci
    JOIN user_org_access uoa ON uoa.organization_id = ci.org_id
    WHERE ci.id = notification_queue.case_id
    AND uoa.user_id = auth.uid()
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- 3. Onboarding Progress
-- =====================================================

-- Enable RLS (already enabled, but uncomment and activate policies)
DROP POLICY IF EXISTS "Admins can view own onboarding" ON onboarding_progress;
DROP POLICY IF EXISTS "Admins can update own onboarding" ON onboarding_progress;

-- View: Org admins can view their own organization's onboarding progress
CREATE POLICY "Admins can view own onboarding"
ON onboarding_progress FOR SELECT
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'superadmin')
  )
);

-- Update: Org admins can update their own organization's onboarding
CREATE POLICY "Admins can update own onboarding"
ON onboarding_progress FOR ALL
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- 4. Travel Expenses
-- =====================================================

-- Uncomment and activate proper policies
DROP POLICY IF EXISTS "Members can view own expenses" ON travel_expenses;
DROP POLICY IF EXISTS "Members can create expenses" ON travel_expenses;
DROP POLICY IF EXISTS "Admins can manage all expenses" ON travel_expenses;

-- View: Members can view expenses within their organization
-- Note: members table doesn't have user_id linkage, so we use org-level access
CREATE POLICY "Members can view expenses in own org"
ON travel_expenses FOR SELECT
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid()
  )
);

-- Insert: Members can create expenses in their organization
CREATE POLICY "Members can create expenses in own org"
ON travel_expenses FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid()
  )
);

-- Update/Delete: Only admins can update/delete
CREATE POLICY "Admins can manage expenses"
ON travel_expenses FOR UPDATE
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'superadmin')
  )
);

CREATE POLICY "Admins can delete expenses"
ON travel_expenses FOR DELETE
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- 5. Payment Batches
-- =====================================================

DROP POLICY IF EXISTS "Admins can view batches" ON payment_batches;
DROP POLICY IF EXISTS "Admins can manage batches" ON payment_batches;

-- View: Org admins can view payment batches
CREATE POLICY "Admins can view batches"
ON payment_batches FOR SELECT
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'superadmin')
  )
);

-- Manage: Org admins can create/update batches
CREATE POLICY "Admins can manage batches"
ON payment_batches FOR ALL
USING (
  org_id IN (
    SELECT organization_id FROM user_org_access
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'superadmin')
  )
);

-- =====================================================
-- Verification
-- =====================================================

-- Check that RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'email_campaigns',
  'notification_queue',
  'onboarding_progress',
  'travel_expenses',
  'payment_batches'
)
AND schemaname = 'public';

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN (
  'email_campaigns',
  'notification_queue',
  'onboarding_progress',
  'travel_expenses',
  'payment_batches'
)
ORDER BY tablename, policyname;
