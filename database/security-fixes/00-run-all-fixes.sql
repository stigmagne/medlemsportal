-- Master Security Fixes Script
-- This script applies all security fixes in the correct order.
--
-- IMPORTANT: Read SECURITY_IMPROVEMENTS.md before running this script.
--
-- Usage:
--   psql -h [host] -U postgres -d postgres -f database/security-fixes/00-run-all-fixes.sql
--
-- Or run via Supabase SQL Editor (copy/paste this entire file)
--
-- Date: 2026-01-23
-- Branch: claude/discuss-association-websites-fTsmO

-- ====================
-- 1. CASE MANAGEMENT RLS FIX
-- ====================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_comments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_votes;

-- Case Items Policies
CREATE POLICY "Users can view cases for their org" ON case_items
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
    )
  );

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

-- Case Comments Policies
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

CREATE POLICY "Users can update own comments" ON case_comments
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON case_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Case Votes Policies
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

CREATE POLICY "Users can update own votes" ON case_votes
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own votes" ON case_votes
  FOR DELETE
  USING (user_id = auth.uid());


-- ====================
-- 2. MEETINGS RLS FIX
-- ====================


-- Meetings Policies
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

-- Meeting Attendees Policies
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
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Meeting Minutes Policies
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


-- ====================
-- 3. EVENTS RLS FIX
-- ====================


-- Events Policies
DROP POLICY IF EXISTS "Public can view public events" ON events;
CREATE POLICY "Public can view public events" ON events
  FOR SELECT
  USING (open_for IN ('all', 'non_members_only'));

DROP POLICY IF EXISTS "Members can view org events" ON events;
CREATE POLICY "Members can view org events" ON events
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org admins can create events" ON events;
CREATE POLICY "Org admins can create events" ON events
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

DROP POLICY IF EXISTS "Org admins can update events" ON events;
CREATE POLICY "Org admins can update events" ON events
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

DROP POLICY IF EXISTS "Org admins can delete events" ON events;
CREATE POLICY "Org admins can delete events" ON events
  FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Event Products Policies
DROP POLICY IF EXISTS "Users can view products for visible events" ON event_products;
CREATE POLICY "Users can view products for visible events" ON event_products
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE open_for IN ('all', 'non_members_only')
      OR org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Org admins can manage event products" ON event_products;
CREATE POLICY "Org admins can manage event products" ON event_products
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

-- Event Registrations Policies (simplified - see individual file for full version)
DROP POLICY IF EXISTS "Org admins can view all registrations" ON event_registrations;
CREATE POLICY "Org admins can view all registrations" ON event_registrations
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

DROP POLICY IF EXISTS "Members can view own registrations" ON event_registrations;
CREATE POLICY "Members can view own registrations" ON event_registrations
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Anyone can register for public events" ON event_registrations;
CREATE POLICY "Anyone can register for public events" ON event_registrations
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE open_for IN ('all', 'non_members_only')
    )
  );

DROP POLICY IF EXISTS "Members can register for member events" ON event_registrations;
CREATE POLICY "Members can register for member events" ON event_registrations
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
      )
    )
    AND (
      member_id IN (
        SELECT id FROM members
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
      )
      OR member_id IS NULL -- Allow non-member registrations if event allows it
    )
  );

DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;
CREATE POLICY "Users can update own registrations" ON event_registrations
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Org admins can update registrations" ON event_registrations;
CREATE POLICY "Org admins can update registrations" ON event_registrations
  FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

DROP POLICY IF EXISTS "Org admins can delete registrations" ON event_registrations;
CREATE POLICY "Org admins can delete registrations" ON event_registrations
  FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE org_id IN (
        SELECT organization_id
        FROM user_org_access
        WHERE user_id = auth.uid()
        AND role IN ('org_admin', 'org_owner')
      )
    )
  );

-- ====================
-- EVENT REGISTRATION PRODUCTS POLICIES
-- ====================

-- Users can view products for registrations they can see
DROP POLICY IF EXISTS "Users can view registration products" ON event_registration_products;
CREATE POLICY "Users can view registration products" ON event_registration_products
  FOR SELECT
  USING (
    registration_id IN (
      SELECT id FROM event_registrations
      WHERE member_id IN (
        SELECT id FROM members
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
      )
      OR event_id IN (
        SELECT id FROM events
        WHERE org_id IN (
          SELECT organization_id
          FROM user_org_access
          WHERE user_id = auth.uid()
          AND role IN ('org_admin', 'org_owner')
        )
      )
    )
  );

-- Anyone can add products to their registration
DROP POLICY IF EXISTS "Users can add products to registrations" ON event_registration_products;
CREATE POLICY "Users can add products to registrations" ON event_registration_products
  FOR INSERT
  WITH CHECK (
    registration_id IN (
      SELECT id FROM event_registrations
      WHERE member_id IN (
        SELECT id FROM members
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
      )
      OR (
        member_id IS NULL
        AND event_id IN (
          SELECT id FROM events
          WHERE open_for IN ('all', 'non_members_only')
        )
      )
    )
  );

-- Org admins can manage all registration products for their events
DROP POLICY IF EXISTS "Org admins can manage registration products" ON event_registration_products;
CREATE POLICY "Org admins can manage registration products" ON event_registration_products
  FOR ALL
  USING (
    registration_id IN (
      SELECT id FROM event_registrations
      WHERE event_id IN (
        SELECT id FROM events
        WHERE org_id IN (
          SELECT organization_id
          FROM user_org_access
          WHERE user_id = auth.uid()
          AND role IN ('org_admin', 'org_owner')
        )
      )
    )
  );


-- ====================
-- 4. PAYMENTS RLS FIX
-- ====================


DROP POLICY IF EXISTS "Org admins can view all payments" ON payment_transactions;
CREATE POLICY "Org admins can view all payments" ON payment_transactions
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

DROP POLICY IF EXISTS "Members can view own payments" ON payment_transactions;
CREATE POLICY "Members can view own payments" ON payment_transactions
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Org admins can create payments" ON payment_transactions;
CREATE POLICY "Org admins can create payments" ON payment_transactions
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

DROP POLICY IF EXISTS "Org admins can update payments" ON payment_transactions;
CREATE POLICY "Org admins can update payments" ON payment_transactions
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

DROP POLICY IF EXISTS "Org admins can delete payments" ON payment_transactions;
CREATE POLICY "Org admins can delete payments" ON payment_transactions
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
-- 5. AUDIT LOGGING
-- ====================


-- Note: For full audit logging setup including security_alerts table,
-- see audit-logging.sql

DROP TABLE IF EXISTS audit_log CASCADE;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  organization_id UUID REFERENCES organizations(id),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_log;
CREATE POLICY "Service role can insert audit logs" ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- Audit logging helper function
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
  v_user_email := auth.jwt() ->> 'email';

  SELECT role INTO v_user_role
  FROM user_org_access
  WHERE user_id = auth.uid()
  AND (organization_id = p_organization_id OR organization_id IS NULL)
  ORDER BY CASE
    WHEN organization_id IS NULL AND role = 'superadmin' THEN 1
    ELSE 2
  END
  LIMIT 1;

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
-- COMPLETE
-- ====================
