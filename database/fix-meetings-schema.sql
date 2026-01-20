-- Re-runnable script to fix meetings schema
-- This uses plain uuid generation if pgcrypto is missing, or assumes gen_random_uuid exists (v13+)

-- 1. Ensure tables exist
CREATE TABLE IF NOT EXISTS meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    meeting_date timestamptz NOT NULL,
    estimated_duration integer,
    meeting_type text,
    location text,
    digital_link text,
    agenda jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'planned',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
    member_id uuid NOT NULL,
    role text,
    rsvp_status text DEFAULT 'pending',
    rsvp_date timestamptz,
    attended boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(meeting_id, member_id)
);

CREATE TABLE IF NOT EXISTS meeting_minutes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
    content jsonb,
    attendees_list jsonb,
    decisions jsonb DEFAULT '[]'::jsonb,
    action_items jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft',
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- 3. Create Permissive Policies (Fixes "Runtime Error" if due to RLS blocking)
-- We use a simple "users can see everything" approach for MVP debugging.
-- In production, we'd check org_id membership.

DROP POLICY IF EXISTS "Enable read access for all users" ON meetings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON meetings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON meetings;

CREATE POLICY "Enable read access for all users" ON meetings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON meetings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON meetings FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar for attendees
DROP POLICY IF EXISTS "Enable read access for all users" ON meeting_attendees;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON meeting_attendees;

CREATE POLICY "Enable read access for all users" ON meeting_attendees FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON meeting_attendees FOR ALL USING (auth.role() = 'authenticated');

-- Similar for minutes
DROP POLICY IF EXISTS "Enable read access for all users" ON meeting_minutes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON meeting_minutes;

CREATE POLICY "Enable read access for all users" ON meeting_minutes FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON meeting_minutes FOR ALL USING (auth.role() = 'authenticated');
