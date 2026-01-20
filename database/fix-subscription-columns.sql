-- Phase 21: Complete Subscription Schema Fix
-- Adds ALL necessary columns for subscription tracking if they don't exist.

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_balance DECIMAL DEFAULT 990,
ADD COLUMN IF NOT EXISTS subscription_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS subscription_paid_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'standard_yearly',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN organizations.subscription_balance IS 'Gjenstående beløp av årsabonnement (990 kr). Når 0, er abonnement dekket.';
COMMENT ON COLUMN organizations.subscription_year IS 'Hvilket år subscription_balance gjelder for. Resettes hvert år.';
COMMENT ON COLUMN organizations.subscription_plan IS 'Navnet på abonnementsplanen (f.eks. standard_yearly, free, custom)';
COMMENT ON COLUMN organizations.subscription_status IS 'Status på abonnementet (active, pending, expired)';
