-- Bank Account Security Solution for Travel Expenses
-- 
-- REQUIREMENT: Bank accounts must be stored temporarily for PDF generation,
-- but should NOT be visible to approvers (only to kasserer who processes payment).
--
-- SOLUTION: 
-- 1. Encrypt bank_account in database (AES-256-GCM)
-- 2. Admin approval UI does NOT display bank_account
-- 3. PDF generation decrypts for kasserer
-- 4. Optional: Auto-delete after payment processed (data minimization)

-- =====================================================
-- 1. Ensure bank_account column exists (encrypted storage)
-- =====================================================

-- The column should exist, but ensure it's there
-- Data will be encrypted by application before INSERT/UPDATE
ALTER TABLE travel_expenses 
ADD COLUMN IF NOT EXISTS bank_account text;

COMMENT ON COLUMN travel_expenses.bank_account IS 
'Encrypted bank account number. Only decrypted when generating PDF for kasserer. NOT shown to approvers.';

-- =====================================================
-- 2. Add cleanup trigger (optional - data minimization)
-- =====================================================

-- Automatically NULL out bank_account after payment is processed
-- This implements GDPR data minimization - we only keep it as long as needed

CREATE OR REPLACE FUNCTION cleanup_bank_account_after_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- When status changes to 'paid', remove bank account
  -- PDF has already been generated and sent to kasserer
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.bank_account = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS cleanup_bank_account ON travel_expenses;
CREATE TRIGGER cleanup_bank_account
  BEFORE UPDATE ON travel_expenses
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_bank_account_after_payment();

-- =====================================================
-- 3. Audit: Add processed_at timestamp
-- =====================================================

ALTER TABLE travel_expenses 
ADD COLUMN IF NOT EXISTS processed_at timestamptz;

COMMENT ON COLUMN travel_expenses.processed_at IS 
'Timestamp when expense was marked as paid. Used for GDPR audit trail.';

-- Update trigger to set processed_at
CREATE OR REPLACE FUNCTION set_expense_processed_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.processed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_processed_timestamp ON travel_expenses;
CREATE TRIGGER set_processed_timestamp
  BEFORE UPDATE ON travel_expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_expense_processed_timestamp();

-- =====================================================
-- Verification
-- =====================================================

-- Check columns exist
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'travel_expenses'
  AND column_name IN ('bank_account', 'processed_at')
ORDER BY column_name;

-- Check triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'travel_expenses'
ORDER BY trigger_name;
