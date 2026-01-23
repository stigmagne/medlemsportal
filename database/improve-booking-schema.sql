-- Improve Booking Schema for Pricing and Flexibility

-- 1. Add new columns to resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'hourly' CHECK (price_type IN ('hourly', 'daily', 'fixed')),
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_time boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_due_days integer DEFAULT 14;

-- 2. Migrate existing hourly_rate to price
UPDATE resources SET price = hourly_rate WHERE price = 0 AND hourly_rate > 0;

-- 3. Ensure RLS is enabled and correct
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Re-create Admin policy to ensure it catches org_admin correctly
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

-- Re-create Member read policy
DROP POLICY IF EXISTS "Public read access for members of org" ON resources;
CREATE POLICY "Public read access for members of org"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access 
      WHERE user_org_access.organization_id = resources.org_id 
      AND user_org_access.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM members
        WHERE members.organization_id = resources.org_id
        AND members.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
