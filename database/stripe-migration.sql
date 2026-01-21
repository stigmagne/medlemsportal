-- Add Stripe Connect fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_annual_fee INTEGER DEFAULT NULL; -- Overrides default 990 if set

-- Create index for faster lookups on stripe account id
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_account ON organizations(stripe_account_id);
