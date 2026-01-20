-- Add column to track unpaid years for members
ALTER TABLE members
ADD COLUMN IF NOT EXISTS unpaid_years INTEGER[] DEFAULT ARRAY[]::INTEGER[];

COMMENT ON COLUMN members.unpaid_years IS 
  'List of years where the member had an unpaid membership fee invoice that was cancelled/expired.';
