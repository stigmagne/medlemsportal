-- Phase 21: Subscription Model Tracking
-- Adapts schema to track 990kr subscription coverage per year

-- 1. Organizations: Add tracking columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_balance DECIMAL DEFAULT 990,
ADD COLUMN IF NOT EXISTS subscription_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS subscription_paid_at TIMESTAMP;

COMMENT ON COLUMN organizations.subscription_balance IS 
  'Gjenstående beløp av årsabonnement (990 kr). Når 0, er abonnement dekket.';

COMMENT ON COLUMN organizations.subscription_year IS 
  'Hvilket år subscription_balance gjelder for. Resettes hvert år.';

COMMENT ON COLUMN organizations.subscription_paid_at IS 
  'Tidspunkt når årsabonnement ble fullt dekket (balance = 0).';

-- 2. Payments (payment_transactions): Add fee columns
-- Note: Assuming 'payment_transactions' is the table based on previous analysis.
-- If 'payments' exists, we would use that. But let's check if we should create 'payments'.
-- The user prompt explicitly asked for 'payments'. 
-- IF 'payment_transactions' exists, we'll try to use it but we might want to check the user intent.
-- For now, I'll add columns to 'payment_transactions' to be safe with existing data, 
-- OR create 'payments' view/table if needed. 
-- Let's stick to 'payment_transactions' but alias columns if needed or just add them.

ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS subscription_deduction DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_to_org DECIMAL;

COMMENT ON COLUMN payment_transactions.subscription_deduction IS 
  'Beløp fra denne betalingen som gikk til årsabonnement.';

COMMENT ON COLUMN payment_transactions.service_fee IS 
  'Gebyr tatt av leverandør (5 kr + 2,5%) etter abonnement er dekket.';

COMMENT ON COLUMN payment_transactions.payout_to_org IS 
  'Netto-beløp som skal utbetales til organisasjonen.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_balance, subscription_year);
CREATE INDEX IF NOT EXISTS idx_payments_org_date ON payment_transactions(org_id, created_at DESC);
