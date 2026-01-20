-- Onboarding Progress Table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  skipped_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  onboarding_data JSONB DEFAULT '{}'::JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow org admins to view/update their own progress
-- Note: Simplified policy assuming user_org_access table exists and links users to orgs with roles
/*
CREATE POLICY "Admins can view own onboarding" ON onboarding_progress
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM user_org_access
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_owner')
    )
  );

CREATE POLICY "Admins can update own onboarding" ON onboarding_progress
  FOR ALL USING (
    org_id IN (
      SELECT organization_id FROM user_org_access
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_owner')
    )
  );
*/
