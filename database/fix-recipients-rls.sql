-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view recipients from their org campaigns" ON campaign_recipients;
DROP POLICY IF EXISTS "Users can insert recipients to their org campaigns" ON campaign_recipients;
DROP POLICY IF EXISTS "Users can update recipients in their org campaigns" ON campaign_recipients;

-- Policy: SELECT (view recipients)
CREATE POLICY "Users can view recipients from their org campaigns"
ON campaign_recipients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM email_campaigns ec
    JOIN user_org_access uoa ON uoa.organization_id = ec.organization_id
    WHERE ec.id = campaign_recipients.campaign_id
    AND uoa.user_id = auth.uid()
  )
);

-- Policy: INSERT (create recipients)
CREATE POLICY "Users can insert recipients to their org campaigns"
ON campaign_recipients FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM email_campaigns ec
    JOIN user_org_access uoa ON uoa.organization_id = ec.organization_id
    WHERE ec.id = campaign_recipients.campaign_id
    AND uoa.user_id = auth.uid()
    AND uoa.role IN ('superadmin', 'org_admin', 'org_secretary')
  )
);

-- Policy: UPDATE (update recipients)
CREATE POLICY "Users can update recipients in their org campaigns"
ON campaign_recipients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM email_campaigns ec
    JOIN user_org_access uoa ON uoa.organization_id = ec.organization_id
    WHERE ec.id = campaign_recipients.campaign_id
    AND uoa.user_id = auth.uid()
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'campaign_recipients';
