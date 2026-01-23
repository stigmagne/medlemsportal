-- Security Fix: Meetings RLS Policies
-- Implements proper organization-scoped access control for meetings.
-- Previously, RLS policies were commented out and security was only handled by application logic.

-- ====================
-- MEETINGS POLICIES
-- ====================

-- Users can view meetings for their organization
DROP POLICY IF EXISTS "Users can view meetings for their org" ON meetings;
CREATE POLICY "Users can view meetings for their org" ON meetings
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
    )
  );

-- Org admins can create meetings
DROP POLICY IF EXISTS "Org admins can create meetings" ON meetings;
CREATE POLICY "Org admins can create meetings" ON meetings
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Org admins can update meetings
DROP POLICY IF EXISTS "Org admins can update meetings" ON meetings;
CREATE POLICY "Org admins can update meetings" ON meetings
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Org admins can delete meetings
DROP POLICY IF EXISTS "Org admins can delete meetings" ON meetings;
CREATE POLICY "Org admins can delete meetings" ON meetings
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
-- MEETING ATTENDEES POLICIES
-- ====================

-- Users can view attendees for meetings in their organization
DROP POLICY IF EXISTS "Users can view attendees for their org meetings" ON meeting_attendees;
CREATE POLICY "Users can view attendees for their org meetings" ON meeting_attendees
  FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- Org admins can manage attendees
DROP POLICY IF EXISTS "Org admins can manage attendees" ON meeting_attendees;
CREATE POLICY "Org admins can manage attendees" ON meeting_attendees
  FOR ALL
  USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

-- Members can update their own RSVP
DROP POLICY IF EXISTS "Members can update own RSVP" ON meeting_attendees;
CREATE POLICY "Members can update own RSVP" ON meeting_attendees
  FOR UPDATE
  USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
    AND member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- ====================
-- MEETING MINUTES POLICIES
-- ====================

-- Users can view minutes for meetings in their organization
DROP POLICY IF EXISTS "Users can view minutes for their org meetings" ON meeting_minutes;
CREATE POLICY "Users can view minutes for their org meetings" ON meeting_minutes
  FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- Org admins can create minutes
DROP POLICY IF EXISTS "Org admins can create minutes" ON meeting_minutes;
CREATE POLICY "Org admins can create minutes" ON meeting_minutes
  FOR INSERT
  WITH CHECK (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

-- Org admins can update minutes
DROP POLICY IF EXISTS "Org admins can update minutes" ON meeting_minutes;
CREATE POLICY "Org admins can update minutes" ON meeting_minutes
  FOR UPDATE
  USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

-- Org admins can delete minutes
DROP POLICY IF EXISTS "Org admins can delete minutes" ON meeting_minutes;
CREATE POLICY "Org admins can delete minutes" ON meeting_minutes
  FOR DELETE
  USING (
    meeting_id IN (
      SELECT id FROM meetings
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );
