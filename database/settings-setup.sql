-- Settings & Membership Renewal Setup

-- 1. Add membership_fee to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS membership_fee DECIMAL DEFAULT 500;

COMMENT ON COLUMN organizations.membership_fee IS 
  'Default annual membership fee (Kontingent) for the organization.';

-- 2. Ensure members have a status column (if not already)
-- This is a safety check standardizing member status
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'status') THEN
        ALTER TABLE members ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;
