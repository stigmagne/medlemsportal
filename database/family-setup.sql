-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  family_name TEXT, -- Optional, auto-generated if empty
  payer_member_id UUID REFERENCES members(id), -- Who pays for the family
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link members to families
-- Note: 'members' table likely already exists, so we use ALTER
ALTER TABLE members ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_family_id ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_families_org_id ON families(org_id);
CREATE INDEX IF NOT EXISTS idx_families_payer ON families(payer_member_id);

-- Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Policies (Commented out to prevent errors if running multiple times or if dependent tables aren't visible in script context)
/*
CREATE POLICY "Users can view families in their org"
  ON families FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage families in their org"
  ON families FOR ALL
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = auth.uid() 
    AND role IN ('org_admin', 'org_owner')
  ));
*/
