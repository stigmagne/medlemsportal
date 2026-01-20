-- Meetings Management System

-- 1. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL, -- REFERENCES public.organizations(id) ON DELETE CASCADE, (FK commented out due to schema visibility issues)
    title text NOT NULL,
    description text,
    meeting_date timestamptz NOT NULL,
    estimated_duration integer, -- in minutes
    meeting_type text, -- 'board', 'general', 'annual', 'other'
    location text,
    digital_link text,
    agenda jsonb DEFAULT '[]'::jsonb, -- Array of agenda items
    status text DEFAULT 'planned', -- 'planned', 'completed', 'cancelled'
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Meeting Attendees
-- Tracks who is invited and their RSVP status
CREATE TABLE IF NOT EXISTS meeting_attendees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
    member_id uuid NOT NULL, -- REFERENCES public.members(id) ON DELETE CASCADE,
    role text, -- 'member', 'guest', 'admin'
    rsvp_status text DEFAULT 'pending', -- 'yes', 'no', 'maybe', 'pending'
    rsvp_date timestamptz,
    attended boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3. Meeting Minutes (Protokoll)
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
    content jsonb, -- Rich text content of the minutes
    attendees_list jsonb, -- Snapshot of who attended
    decisions jsonb DEFAULT '[]'::jsonb, -- Array of formal decisions
    action_items jsonb DEFAULT '[]'::jsonb, -- Array of tasks: { who, what, due_date }
    status text DEFAULT 'draft', -- 'draft', 'approved'
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(org_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_attendees_meeting ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendees_member ON meeting_attendees(member_id);

-- RLS Policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies often depend on 'members' table which might be invisible to this script context.
-- We are commenting them out for now to ensure table creation. 
-- Security is currently handled by application-level logic (checking org_id context).

/*
CREATE POLICY "Users can view meetings for their org" ON meetings
  FOR SELECT USING (true); -- Placeholder: Needs proper org check

CREATE POLICY "Admins can manage meetings" ON meetings
  FOR ALL USING (true); -- Placeholder
*/
