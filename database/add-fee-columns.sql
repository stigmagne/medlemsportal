-- Add Annual Fee tracking to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS annual_fee_paid numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS annual_fee_year int DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

COMMENT ON COLUMN organizations.annual_fee_paid IS 'Amount of the annual platform fee (990,-) paid by the org this year';
COMMENT ON COLUMN organizations.annual_fee_year IS 'The year the annual_fee_paid corresponds to';

-- Add Fee Breakdown to payment_transactions
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS transaction_fee numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS net_to_organization numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS fee_breakdown jsonb DEFAULT NULL;

COMMENT ON COLUMN payment_transactions.platform_fee IS 'Portion of amount that went to cover Annual Fee';
COMMENT ON COLUMN payment_transactions.transaction_fee IS 'Transaction fee (15,-), only applied if Annual Fee is fully paid';
COMMENT ON COLUMN payment_transactions.net_to_organization IS 'Net amount the organization receives';
COMMENT ON COLUMN payment_transactions.fee_breakdown IS 'JSON Details for transparency';

-- Verification (Select to confirm existence)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('organizations', 'payment_transactions') 
  AND column_name IN ('annual_fee_paid', 'annual_fee_year', 'platform_fee', 'transaction_fee', 'net_to_organization');
