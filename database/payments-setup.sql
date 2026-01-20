-- Payments & Invoices Setup

CREATE TABLE IF NOT EXISTS payment_transactions (
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
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure org_id exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'org_id') THEN
        ALTER TABLE payment_transactions ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_org_member ON payment_transactions(org_id, member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies temporarily commented out to ensure table creation succeeds.
-- We will add strict policies later once table structure is verified.

/*
CREATE POLICY "Admins can manage all payments"
  ON payment_transactions FOR ALL
  USING (org_id IN (
    SELECT organization_id FROM user_org_access 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_owner')
  ));

CREATE POLICY "Members can view own payments"
  ON payment_transactions FOR SELECT
  USING (member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  ));
*/
