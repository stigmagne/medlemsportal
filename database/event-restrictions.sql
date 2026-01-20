-- Add restriction columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS requires_active_membership BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_prev_year_payment BOOLEAN DEFAULT false;

COMMENT ON COLUMN events.requires_active_membership IS 
  'If true, participant must be a member with PAID current year membership.';

COMMENT ON COLUMN events.requires_prev_year_payment IS 
  'If true, participant must not have unpaid fees from the previous year.';
