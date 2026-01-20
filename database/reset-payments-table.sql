-- DATA LOSS WARNING: This will delete all existing payment transactions
-- Use only for development debugging when schema is stuck

DROP TABLE IF EXISTS payment_transactions CASCADE;

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),
  
  -- Transaction Details
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'NOK',
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled', 'refunded'
  type TEXT NOT NULL, -- 'membership_fee', 'event', 'donation', 'other'
  description TEXT,
  
  -- Links
  event_id UUID REFERENCES events(id),
  
  -- Payment Provider Details (e.g. Stripe/Vipps)
  provider_transaction_id TEXT,
  payment_method TEXT,
  
  -- Dates
  due_date TIMESTAMPTZ, -- Changed to TIMESTAMPTZ to match likely Supabase types better, or keep DATE
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_org_member ON payment_transactions(org_id, member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Reload Cache
NOTIFY pgrst, 'reload schema';
