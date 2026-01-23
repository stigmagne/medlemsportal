-- Add reply_to to email_campaigns
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_to text;
