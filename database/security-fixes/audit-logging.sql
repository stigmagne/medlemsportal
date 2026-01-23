-- Audit Logging System
-- Tracks access to sensitive data and administrative actions.
-- This is crucial for security, compliance, and trust.

-- ====================
-- AUDIT LOG TABLE
-- ====================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT, -- Cached for easier querying
  user_role TEXT, -- 'superadmin', 'org_admin', 'org_owner', 'member'

  -- What was accessed/changed
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'export'
  resource_type TEXT NOT NULL, -- 'member', 'document', 'case', 'meeting', 'payment', etc.
  resource_id UUID, -- ID of the specific resource
  organization_id UUID REFERENCES organizations(id), -- Which org the resource belongs to

  -- Context
  description TEXT, -- Human-readable description
  metadata JSONB, -- Additional context (IP, user agent, changed fields, etc.)

  -- When
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ====================
-- AUDIT LOG POLICIES
-- ====================

-- Superadmins can view all audit logs
DROP POLICY IF EXISTS "Superadmins can view all audit logs" ON audit_log;
CREATE POLICY "Superadmins can view all audit logs" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE user_org_access.organization_id IS NULL
      AND user_org_access.user_id = auth.uid()
      AND user_org_access.role = 'superadmin'
    )
  );

-- Org admins can view audit logs for their organization
DROP POLICY IF EXISTS "Org admins can view org audit logs" ON audit_log;
CREATE POLICY "Org admins can view org audit logs" ON audit_log
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT
  USING (user_id = auth.uid());

-- Only the system (service role) can insert audit logs
-- This prevents users from manipulating audit logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_log;
CREATE POLICY "Service role can insert audit logs" ON audit_log
  FOR INSERT
  WITH CHECK (true); -- Will be enforced by using service role key

-- Nobody can update or delete audit logs (immutable for integrity)
-- This ensures audit trails cannot be tampered with

-- ====================
-- HELPER FUNCTION FOR LOGGING
-- ====================

-- Function to log audit events
-- Usage: SELECT log_audit_event('view', 'member', member_id, org_id, 'Viewed member profile');
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_organization_id UUID,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_email TEXT;
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get user email from JWT
  v_user_email := auth.jwt() ->> 'email';

  -- Get user role from user_org_access
  SELECT role INTO v_user_role
  FROM user_org_access
  WHERE user_id = auth.uid()
  AND (organization_id = p_organization_id OR organization_id IS NULL)
  ORDER BY CASE
    WHEN organization_id IS NULL AND role = 'superadmin' THEN 1
    ELSE 2
  END
  LIMIT 1;

  -- Insert audit log
  INSERT INTO audit_log (
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    resource_id,
    organization_id,
    description,
    metadata
  ) VALUES (
    auth.uid(),
    v_user_email,
    COALESCE(v_user_role, 'unknown'),
    p_action,
    p_resource_type,
    p_resource_id,
    p_organization_id,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================
-- CRITICAL ACCESS ALERTS
-- ====================

-- Table for alerts when sensitive data is accessed
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'cross_org_access', 'superadmin_access', 'bulk_export', 'sensitive_document'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  organization_id UUID REFERENCES organizations(id),
  description TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_org ON security_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Superadmins can view all alerts
DROP POLICY IF EXISTS "Superadmins can view all alerts" ON security_alerts;
CREATE POLICY "Superadmins can view all alerts" ON security_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_org_access
      WHERE user_org_access.organization_id IS NULL
      AND user_org_access.user_id = auth.uid()
      AND user_org_access.role = 'superadmin'
    )
  );

-- Org admins can view alerts for their organization
DROP POLICY IF EXISTS "Org admins can view org alerts" ON security_alerts;
CREATE POLICY "Org admins can view org alerts" ON security_alerts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- ====================
-- USAGE EXAMPLES
-- ====================

-- Example 1: Log when someone views sensitive member data
-- SELECT log_audit_event('view', 'member', '123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43f7-9c4d-8e2a1b3c4d5e', 'Viewed member profile from dashboard');

-- Example 2: Log when document is exported
-- SELECT log_audit_event('export', 'document', document_id, org_id, 'Exported member list to CSV', '{"row_count": 150, "ip": "192.168.1.1"}'::jsonb);

-- Example 3: Log superadmin access to organization data
-- SELECT log_audit_event('view', 'organization', org_id, org_id, 'Superadmin accessed organization dashboard for support ticket #123');

-- ====================
-- RECOMMENDATIONS
-- ====================

-- To implement audit logging in application code:
--
-- 1. In server actions that access sensitive data (members, documents, cases):
--    - Call log_audit_event() after successful operation
--    - Include relevant context in metadata (IP, user agent, etc.)
--
-- 2. Create middleware or helper functions for common operations:
--    - logMemberAccess(memberId, orgId, action)
--    - logDocumentAccess(documentId, orgId, action)
--    - logSensitiveDataExport(resourceType, count, orgId)
--
-- 3. Set up periodic reviews of audit logs:
--    - Alert org admins of unusual access patterns
--    - Alert superadmins of cross-org access
--    - Generate compliance reports
--
-- 4. Add audit log viewer in admin dashboard:
--    - /org/[slug]/settings/security/audit-log
--    - Filter by action, resource type, date range
--    - Export capability for compliance
