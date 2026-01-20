-- Add price_type column to events table to support "Pris" vs "Egenandel"
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'price' CHECK (price_type IN ('price', 'deductible'));

-- Comment on column
COMMENT ON COLUMN events.price_type IS 'Determines if the cost is labeled as a Price or a Deductible (Egenandel)';
