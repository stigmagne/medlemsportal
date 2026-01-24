
-- Error Reporting System
-- Table to store user-reported errors from the frontend.

CREATE TABLE IF NOT EXISTS error_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text, -- Cached email for easy display
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  path text,
  error_message text,
  error_digest text,
  user_comment text,
  user_agent text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (authenticated) can insert a report
CREATE POLICY "Users can create error reports" ON error_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated'); -- Or public/anon if we want global reporting? stick to auth for now.

-- 2. Users can view their own reports
CREATE POLICY "Users can view own error reports" ON error_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Superadmins can view/manage ALL reports
-- (Assuming we have a way to identify superadmins, usually via user_org_access role='superadmin' with no org, or specific ID)

-- For now, let's allow "service_role" full access (dashboard usually runs as user, so we need superadmin policy)
CREATE POLICY "Superadmins can manage error reports" ON error_reports
  FOR ALL
  USING (
    EXISTS (
        SELECT 1 FROM user_org_access
        WHERE user_org_access.user_id = auth.uid()
        AND user_org_access.role = 'superadmin'
        AND user_org_access.organization_id IS NULL
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_created ON error_reports(created_at);
