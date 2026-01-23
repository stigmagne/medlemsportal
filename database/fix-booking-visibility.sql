-- Fix Booking Visibility Issues
-- Replacing auth.users lookup with auth.jwt() and ensuring permissions

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users (just in case)
GRANT ALL ON resources TO authenticated;
GRANT ALL ON resource_bookings TO authenticated;

-- Admin Policy
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;
CREATE POLICY "Admins can manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access 
      WHERE user_org_access.organization_id = resources.org_id 
      AND user_org_access.user_id = auth.uid()
      AND user_org_access.role IN ('org_admin', 'superadmin')
    )
  );

-- Member Read Policy (Robust)
DROP POLICY IF EXISTS "Public read access for members of org" ON resources;
CREATE POLICY "Public read access for members of org"
  ON resources FOR SELECT
  USING (
    -- Access via Dashboard User
    EXISTS (
      SELECT 1 FROM user_org_access 
      WHERE user_org_access.organization_id = resources.org_id 
      AND user_org_access.user_id = auth.uid()
    )
    OR
    -- Access via Member Registry (Email Match)
    EXISTS (
        SELECT 1 FROM members
        WHERE members.organization_id = resources.org_id
        AND members.email = (auth.jwt() ->> 'email')
    )
  );

-- Ensure Bookings also have correct policies using JWT
DROP POLICY IF EXISTS "Members can view all bookings (to see availability)" ON resource_bookings;
CREATE POLICY "Members can view all bookings (to see availability)"
  ON resource_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access 
      WHERE user_org_access.organization_id = resource_bookings.org_id 
      AND user_org_access.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM members
        WHERE members.organization_id = resource_bookings.org_id
        AND members.email = (auth.jwt() ->> 'email')
    )
  );
