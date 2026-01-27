-- Events Module Schema

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  digital_link TEXT, -- For digital events
  registration_deadline TIMESTAMPTZ,
  max_participants INTEGER,
  open_for TEXT NOT NULL DEFAULT 'all', -- 'members_only', 'all', 'non_members_only'
  base_price DECIMAL NOT NULL DEFAULT 0,
  member_price DECIMAL, -- NULL if same as base_price
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Event Products (Add-ons)
CREATE TABLE IF NOT EXISTS event_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Dinner", "T-shirt", etc.
  description TEXT,
  price DECIMAL NOT NULL,
  max_quantity INTEGER, -- NULL if unlimited
  available_quantity INTEGER, -- Updated on registration
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id), -- NULL if non-member
  
  -- For non-members
  non_member_name TEXT,
  non_member_email TEXT,
  non_member_phone TEXT,
  
  -- Financials
  total_amount DECIMAL NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled', 'refunded'
  stripe_payment_intent_id TEXT,
  
  -- Metadata
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Marketing
  interested_in_membership BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT check_member_or_guest CHECK (
    member_id IS NOT NULL OR 
    (non_member_name IS NOT NULL AND non_member_email IS NOT NULL)
  )
);

-- 4. Selected Products for Registration
CREATE TABLE IF NOT EXISTS event_registration_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES event_registrations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES event_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL NOT NULL, -- Store price at time of purchase
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_org_id ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_member ON event_registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(non_member_email);

-- Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_products ENABLE ROW LEVEL SECURITY;

-- Policies (Commented out to prevent errors if dependencies are missing in script context)
/*
CREATE POLICY "Public can view public events"
  ON events FOR SELECT
  USING (open_for IN ('all', 'non_members_only') OR org_id IN (
    SELECT org_id FROM members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_admins WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT
  USING (
    member_id = auth.uid() 
    OR 
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT org_id FROM org_admins WHERE user_id = auth.uid()
      )
    )
  );
*/
