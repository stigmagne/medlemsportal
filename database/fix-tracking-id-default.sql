-- Ensure pgcrypto is enabled (needed for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set default value for unique_tracking_id
ALTER TABLE campaign_recipients
ALTER COLUMN unique_tracking_id SET DEFAULT gen_random_uuid()::text;

-- Verify
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'campaign_recipients'
AND column_name = 'unique_tracking_id';
