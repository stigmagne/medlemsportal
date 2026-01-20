-- Digital Voting & Discussion System

-- 1. Enable/configure voting columns on case_items
-- (Already added in previous step logic or ensures they exist)
ALTER TABLE case_items 
ADD COLUMN IF NOT EXISTS voting_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS voting_deadline timestamptz,
ADD COLUMN IF NOT EXISTS required_votes integer;

-- 2. Case Votes
CREATE TABLE IF NOT EXISTS case_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid REFERENCES case_items(id) ON DELETE CASCADE,
    member_id uuid NOT NULL, -- references members(id), handling loose constraint if needed app-side
    vote text NOT NULL CHECK (vote IN ('support', 'oppose', 'abstain')),
    voted_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(case_id, member_id)
);

-- 3. Case Comments
CREATE TABLE IF NOT EXISTS case_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid REFERENCES case_items(id) ON DELETE CASCADE,
    member_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Notification Queue (For digests)
CREATE TABLE IF NOT EXISTS notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid REFERENCES case_items(id) ON DELETE CASCADE,
    member_id uuid, -- Recipient (optional if broadcast) or Actor? Usually recipient.
    notification_type text, -- 'new_comment', 'vote_reminder', 'result'
    metadata jsonb DEFAULT '{}'::jsonb, -- Store extra info like commenter name
    sent boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_votes_case ON case_votes(case_id);
CREATE INDEX IF NOT EXISTS idx_comments_case ON case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_queue_sent ON notification_queue(sent);

-- RLS
ALTER TABLE case_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Permissive policies for MVP
-- In production: Limit votes to board members, comment updates to author etc.
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_votes;
CREATE POLICY "Enable all access for authenticated users" ON case_votes FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON case_comments;
CREATE POLICY "Enable all access for authenticated users" ON case_comments FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON notification_queue;
CREATE POLICY "Enable all access for authenticated users" ON notification_queue FOR ALL USING (auth.role() = 'authenticated');
