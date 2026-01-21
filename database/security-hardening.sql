
-- Security Hardening & Linter Fixes

-- 1. Fix Security Definer Views (Make them invoker-safe)
-- PostgreSQL 15+ supports 'security_invoker = true'
-- This ensures RLS is checked against the user queries, not the view owner.
ALTER VIEW view_member_stats_by_age SET (security_invoker = true);
ALTER VIEW view_member_growth_monthly SET (security_invoker = true);

-- 2. Enable RLS on public tables
ALTER TABLE IF EXISTS email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS membership_fees ENABLE ROW LEVEL SECURITY;

-- Add basic policies if they don't exist
-- Email Logs: Admins read all, System writes (assuming backend service role for writes, but maybe admins send emails too?)
CREATE POLICY "Admins can view email_logs" ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE user_id = auth.uid()
      AND organization_id = email_logs.organization_id
      AND role IN ('org_admin', 'superadmin')
    )
  );

-- Membership Fees: Admins manage, Members read own? 
-- Assuming this table defines fee types/rules, usually read-only for members, write for admins.
CREATE POLICY "Admins manage membership_fees" ON membership_fees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE user_id = auth.uid()
      AND organization_id = membership_fees.organization_id
      AND role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Everyone can read membership_fees" ON membership_fees
  FOR SELECT
  USING (true); -- Public/Members need to see prices? Or restrict to 'authenticated'?

-- 3. Fix Function Search Paths
ALTER FUNCTION user_organizations SET search_path = public, pg_temp;
ALTER FUNCTION is_org_admin SET search_path = public, pg_temp;
ALTER FUNCTION get_next_case_number SET search_path = public, pg_temp;
ALTER FUNCTION is_superadmin SET search_path = public, pg_temp;

-- 4. Move Extension (Optional / Tricky if already in use)
-- Better to leave this manual or skip if not critical. 
-- "ALTER EXTENSION btree_gist SET SCHEMA extensions;" 
-- If 'extensions' schema is not in search_path, this might break things. Keeping it skipped for now to be safe.

-- 5. Fix Permissive RLS on payment_transactions
-- The warning says "Enable all access for authenticated users" is too permissive.
-- We should restrict it.
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;

-- New strict policies for payment_transactions
CREATE POLICY "Admins manage payment_transactions" ON payment_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE user_id = auth.uid()
      AND organization_id = payment_transactions.org_id -- Corrected from organization_id
      AND role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Members view own transactions" ON payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = payment_transactions.member_id
      AND members.email = (select email from auth.users where id = auth.uid())
    )
  );
