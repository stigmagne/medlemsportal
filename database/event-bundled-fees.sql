-- Add columns to event_registrations to track bundled membership fees
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS includes_membership_fee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS membership_fee_amount DECIMAL DEFAULT 0;

COMMENT ON COLUMN event_registrations.includes_membership_fee IS 
  'Whether this registration includes payment for outstanding membership fees.';
