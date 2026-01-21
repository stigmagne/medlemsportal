-- Add contact email to organizations for styling outgoing emails
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS contact_email TEXT;
