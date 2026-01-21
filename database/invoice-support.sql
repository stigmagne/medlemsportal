-- Add bank account number to organizations for invoicing
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Add fields for Invoice/KID support to payment_transactions
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS kid TEXT,
ADD COLUMN IF NOT EXISTS invoice_handle TEXT; -- Potential future use for PDF link or file reference

-- Create index for faster lookups on KID (important for OCR/bank integration later)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_kid ON payment_transactions(kid);
