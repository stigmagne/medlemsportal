-- Phase 3: Database Schema Improvements
-- Adds missing foreign keys, fixes RLS role names, and adds search_path to SECURITY DEFINER functions

-- =====================================================
-- 1. Add Missing Foreign Key Constraints
-- =====================================================

-- Foreign keys improve data integrity and enable cascading deletes
-- Note: Some may already exist, using IF NOT EXISTS pattern where possible

-- Payment transactions should reference members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_transactions_member_id_fkey'
  ) THEN
    ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_member_id_fkey
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Travel expenses should have proper foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'travel_expenses_member_id_fkey'
  ) THEN
    ALTER TABLE travel_expenses
    ADD CONSTRAINT travel_expenses_member_id_fkey
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Email campaigns should reference organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_campaigns_organization_id_fkey'
  ) THEN
    ALTER TABLE email_campaigns
    ADD CONSTRAINT email_campaigns_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Notification queue should reference case_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notification_queue_case_id_fkey'
  ) THEN
    ALTER TABLE notification_queue
    ADD CONSTRAINT notification_queue_case_id_fkey
    FOREIGN KEY (case_id) REFERENCES case_items(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Payment batches should reference organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_batches_org_id_fkey'
  ) THEN
    ALTER TABLE payment_batches
    ADD CONSTRAINT payment_batches_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 2. Add search_path to SECURITY DEFINER Functions
-- =====================================================

-- SECURITY DEFINER functions should explicitly set search_path to prevent
-- privilege escalation via search_path manipulation
-- See: https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY

-- Update log_audit_event function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_org_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- SECURITY: Prevent search_path attacks
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO audit_log (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    p_org_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    NOW()
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Update our atomic functions from fix-race-conditions.sql
ALTER FUNCTION record_payment_atomic SET search_path = public, pg_temp;
ALTER FUNCTION create_resource_booking_atomic SET search_path = public, pg_temp;
ALTER FUNCTION signup_for_volunteering_atomic SET search_path = public, pg_temp;
ALTER FUNCTION cancel_volunteering_signup_atomic SET search_path = public, pg_temp;

-- =====================================================
-- 3. Fix RLS Role Name Inconsistencies
-- =====================================================

-- Some policies use 'admin' instead of 'org_admin'
-- Let's standardize to 'org_admin' and 'superadmin'

-- Update volunteering_events policies
DROP POLICY IF EXISTS "Admin full access events" ON volunteering_events;
CREATE POLICY "Admin full access events"
  ON volunteering_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access 
      WHERE user_org_access.organization_id = volunteering_events.org_id 
      AND user_org_access.user_id = auth.uid()
      AND user_org_access.role IN ('org_admin', 'superadmin')
    )
  );

-- Update volunteering_roles policies
DROP POLICY IF EXISTS "Admin full access roles" ON volunteering_roles;
CREATE POLICY "Admin full access roles"
  ON volunteering_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM volunteering_events e
      JOIN user_org_access a ON a.organization_id = e.org_id
      WHERE e.id = volunteering_roles.event_id
      AND a.user_id = auth.uid()
      AND a.role IN ('org_admin', 'superadmin')
    )
  );

-- Update volunteering_assignments policies
DROP POLICY IF EXISTS "Admin full access assignments" ON volunteering_assignments;
CREATE POLICY "Admin full access assignments"
  ON volunteering_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM volunteering_roles r
      JOIN volunteering_events e ON e.id = r.event_id
      JOIN user_org_access a ON a.organization_id = e.org_id
      WHERE r.id = volunteering_assignments.role_id
      AND a.user_id = auth.uid()
      AND a.role IN ('org_admin', 'superadmin')
    )
  );

-- =====================================================
-- 4. Add Helpful Indexes for Performance
-- =====================================================

-- Note: Only creating indexes for tables that currently exist
-- audit_log and email_tracking tables don't exist yet in schema

-- Index on email_tracking_events for analytics queries
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_recipient
ON email_tracking_events(campaign_recipient_id, event_type);

-- Index on payment_transactions for org queries (uses org_id, not organization_id)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org_created
ON payment_transactions(org_id, created_at DESC);

-- =====================================================
-- Verification
-- =====================================================

-- Check foreign keys were added
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'payment_transactions',
    'travel_expenses',
    'email_campaigns',
    'notification_queue',
    'payment_batches'
  )
ORDER BY tc.table_name;

-- Check search_path on SECURITY DEFINER functions
SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as is_security_definer,
  p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND p.proname LIKE '%atomic%'
ORDER BY p.proname;
