-- Phase 20: Case Management (Saksbehandling)

-- 1. Add settings to organizations
-- format: 'year_seq' (24/001) or 'seq' (1001)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS case_number_format text DEFAULT 'year_seq',
ADD COLUMN IF NOT EXISTS last_case_year integer,
ADD COLUMN IF NOT EXISTS last_case_number integer DEFAULT 0;

-- 2. Case Items (Saker)
-- Replaces/Augments the simple 'agenda' jsonb in meetings
CREATE TABLE IF NOT EXISTS case_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL, -- references organizations(id) via app logic if FK fails
    
    -- Numbering
    case_year integer, -- 2024
    case_number integer, -- 1
    formatted_id text, -- "24/001" - Cached for display
    
    -- Content
    title text NOT NULL,
    description text, -- Background info
    suggestion text, -- Innstilling / Forslag til vedtak
    
    -- Attachments (simplified as array of URLs/Objects for now)
    attachments jsonb DEFAULT '[]'::jsonb, 
    
    -- Status & Workflow
    status text DEFAULT 'draft', -- 'draft', 'ready', 'processing', 'decided', 'dismissed'
    origin text DEFAULT 'meeting', -- 'meeting', 'email' (styrebehandling på epost), 'workflow' (digital)
    
    -- Relation to Meeting (Optional, a case can belong to a meeting)
    meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
    order_in_meeting integer, -- sorting order in agenda
    
    -- Decision (Vedtak)
    decision text,
    decision_type text, -- 'unanimous' (enstemmig), 'majority' (flertall), 'closenup' (mot få stemmer)
    decided_at timestamptz,
    
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Case Comments (For digital discussion)
CREATE TABLE IF NOT EXISTS case_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid REFERENCES case_items(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id), -- The board member commenting
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. Case Votes (For digital voting)
CREATE TABLE IF NOT EXISTS case_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid REFERENCES case_items(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    vote text NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(case_id, user_id) -- Only one vote per user per case
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cases_org ON case_items(org_id);
CREATE INDEX IF NOT EXISTS idx_cases_meeting ON case_items(meeting_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_numbering ON case_items(org_id, case_year, case_number);

-- RLS
ALTER TABLE case_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_votes ENABLE ROW LEVEL SECURITY;

-- Permissive policies for MVP (Authenticated users can access)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_items;
CREATE POLICY "Enable all access for authenticated users" ON case_items FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_comments;
CREATE POLICY "Enable all access for authenticated users" ON case_comments FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_votes;
CREATE POLICY "Enable all access for authenticated users" ON case_votes FOR ALL USING (auth.role() = 'authenticated');
