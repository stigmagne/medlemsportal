-- Security Fix: Events RLS Policies
-- Implements proper organization-scoped access control for events.
-- Previously, RLS policies were commented out and security was only handled by application logic.

-- ====================
-- EVENTS POLICIES
-- ====================

-- Public can view events that are open to all or non-members only
DROP POLICY IF EXISTS "Public can view public events" ON events;
CREATE POLICY "Public can view public events" ON events
  FOR SELECT
  USING (open_for IN ('all', 'non_members_only'));

-- Members can view all events in their organization
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

-- Org admins can create events
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

-- Org admins can update events
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

-- Org admins can delete events
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

-- ====================
-- EVENT PRODUCTS POLICIES
-- ====================

-- Anyone who can see the event can see its products
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

-- Org admins can manage event products
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

-- ====================
-- EVENT REGISTRATIONS POLICIES
-- ====================

-- Org admins can view all registrations for their events
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

-- Members can view their own registrations
DROP POLICY IF EXISTS "Members can view own registrations" ON event_registrations;
CREATE POLICY "Members can view own registrations" ON event_registrations
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Anyone can register for public events (insert)
DROP POLICY IF EXISTS "Anyone can register for public events" ON event_registrations;
CREATE POLICY "Anyone can register for public events" ON event_registrations
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE open_for IN ('all', 'non_members_only')
    )
  );

-- Members can register for member events
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
        WHERE user_id = auth.uid()
      )
      OR member_id IS NULL -- Allow non-member registrations if event allows it
    )
  );

-- Users can update their own registrations
DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;
CREATE POLICY "Users can update own registrations" ON event_registrations
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Org admins can update registrations for their events
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

-- Org admins can delete registrations for their events
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
        WHERE user_id = auth.uid()
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
        WHERE user_id = auth.uid()
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
