-- Security Fix: Case Management RLS Policies
-- This replaces the overly permissive "authenticated users can access all" policies
-- with proper organization-scoped access control.

-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_comments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_votes;

-- ====================
-- CASE ITEMS POLICIES
-- ====================

-- Users can view cases for their organization
CREATE POLICY "Users can view cases for their org" ON case_items
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
    )
  );

-- Org admins can insert cases
CREATE POLICY "Org admins can create cases" ON case_items
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Org admins can update cases
CREATE POLICY "Org admins can update cases" ON case_items
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Org admins can delete cases
CREATE POLICY "Org admins can delete cases" ON case_items
  FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- ====================
-- CASE COMMENTS POLICIES
-- ====================

-- Users can view comments on cases from their organization
CREATE POLICY "Users can view comments for their org cases" ON case_comments
  FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM case_items
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can add comments to cases in their organization
CREATE POLICY "Users can add comments to org cases" ON case_comments
  FOR INSERT
  WITH CHECK (
    case_id IN (
      SELECT id FROM case_items
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON case_comments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON case_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- ====================
-- CASE VOTES POLICIES
-- ====================

-- Users can view votes on cases from their organization
CREATE POLICY "Users can view votes for their org cases" ON case_votes
  FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM case_items
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can add votes to cases in their organization
CREATE POLICY "Users can add votes to org cases" ON case_votes
  FOR INSERT
  WITH CHECK (
    case_id IN (
      SELECT id FROM case_items
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON case_votes
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own votes (to change vote)
CREATE POLICY "Users can delete own votes" ON case_votes
  FOR DELETE
  USING (user_id = auth.uid());
