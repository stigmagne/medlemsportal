-- Ensure email_campaigns exists (it should, but good practice)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id),
    name text,
    subject text,
    content text,
    status text,
    created_at timestamptz DEFAULT now(),
    sent_at timestamptz
);

-- Ensure campaign_recipients exists and has tracking columns
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
    member_id uuid REFERENCES members(id),
    email text,
    status text,
    sent_at timestamptz DEFAULT now(),
    -- Tracking columns
    unique_tracking_id text UNIQUE DEFAULT gen_random_uuid()::text,
    opened_at timestamptz,
    first_clicked_at timestamptz,
    clicked_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Add columns if table existed but columns missed (idempotency)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE campaign_recipients ADD COLUMN unique_tracking_id text UNIQUE DEFAULT gen_random_uuid()::text;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE campaign_recipients ADD COLUMN opened_at timestamptz;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE campaign_recipients ADD COLUMN first_clicked_at timestamptz;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE campaign_recipients ADD COLUMN clicked_count integer DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Comments for documentation
COMMENT ON COLUMN campaign_recipients.unique_tracking_id IS 'Unique ID for tracking opens and clicks';
COMMENT ON COLUMN campaign_recipients.opened_at IS 'First time recipient opened the email';
COMMENT ON COLUMN campaign_recipients.first_clicked_at IS 'First time recipient clicked a link';
COMMENT ON COLUMN campaign_recipients.clicked_count IS 'Total number of clicks by this recipient';

-- Create Tracking Events table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_recipient_id uuid REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('open', 'click')),
  clicked_url text, -- Only for clicks
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_recipient ON email_tracking_events(campaign_recipient_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON email_tracking_events(created_at);

COMMENT ON TABLE email_tracking_events IS 'Logs all email opens and clicks for analytics';

-- Enable Row Level Security
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view tracking events for their org's campaigns
DROP POLICY IF EXISTS "Users see tracking events from their org campaigns" ON email_tracking_events;

CREATE POLICY "Users see tracking events from their org campaigns"
ON email_tracking_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_recipients cr
    JOIN email_campaigns ec ON ec.id = cr.campaign_id
    JOIN user_org_access uoa ON uoa.organization_id = ec.organization_id
    WHERE cr.id = email_tracking_events.campaign_recipient_id
    AND uoa.user_id = auth.uid()
  )
);

-- Verification Query
SELECT 
    t.table_name, 
    c.column_name, 
    c.data_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_name IN ('email_campaigns', 'campaign_recipients', 'email_tracking_events')
AND t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;
