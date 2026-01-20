-- Fix RLS for families table
-- Policies were previously commented out, enabling them now.

-- 1. Drop existing policies to avoid conflicts (clean slate)
DROP POLICY IF EXISTS "Users can view families in their org" ON families;
DROP POLICY IF EXISTS "Admins can manage families in their org" ON families;

-- 2. Create policies
-- View: users can view families if they belong to the org
CREATE POLICY "Users can view families in their org"
  ON families FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = (select auth.uid())
  ));

-- Manage: Admins can do everything
CREATE POLICY "Admins can manage families in their org"
  ON families FOR ALL
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = (select auth.uid())
    AND role IN ('org_admin', 'org_owner')
  ));

-- 3. Force schema refresh
NOTIFY pgrst, 'reload schema';
