-- Create member_types table
CREATE TABLE IF NOT EXISTS member_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee DECIMAL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_type_id UUID REFERENCES member_types(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_types_org ON member_types(org_id);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type_id);

-- RLS
ALTER TABLE member_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view types in their org
CREATE POLICY "Users can view member types"
  ON member_types FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = (select auth.uid())
  ));

-- Admins can manage types
CREATE POLICY "Admins can manage member types"
  ON member_types FOR ALL
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('org_admin', 'org_owner')
  ));

-- Force schema reload
NOTIFY pgrst, 'reload schema';
