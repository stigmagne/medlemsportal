-- Travel Expenses Module Schema

-- 1. Travel Expenses Table
CREATE TABLE IF NOT EXISTS travel_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id),
  event_id UUID REFERENCES events(id), -- Optional link to event
  
  description TEXT NOT NULL,
  travel_date DATE NOT NULL,
  
  -- Transport details
  transport_type TEXT NOT NULL, -- 'car', 'public', 'flight', 'other'
  start_location TEXT,
  end_location TEXT,
  distance_km DECIMAL, -- For car allowance
  toll_parking_cost DECIMAL DEFAULT 0,
  ticket_cost DECIMAL DEFAULT 0,
  
  -- Total claim
  total_amount DECIMAL NOT NULL,
  
  -- Evidence
  receipt_url TEXT, -- Path to uploaded file
  
  -- Payment Info
  bank_account TEXT NOT NULL,
  
  -- Workflow
  status TEXT DEFAULT 'submitted', -- 'submitted', 'approved', 'rejected', 'paid'
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_batch_id UUID, -- Link to batch export
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payment Batches (For bulk export)
CREATE TABLE IF NOT EXISTS payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'created', -- 'created', 'processing', 'completed'
  total_amount DECIMAL NOT NULL,
  expense_count INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_travel_expenses_org ON travel_expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_travel_expenses_member ON travel_expenses(member_id);
CREATE INDEX IF NOT EXISTS idx_travel_expenses_status ON travel_expenses(status);

-- RLS
ALTER TABLE travel_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_batches ENABLE ROW LEVEL SECURITY;

/* 
-- Policies (Commented out for safety)
CREATE POLICY "Members can view own expenses"
  ON travel_expenses FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "Members can create expenses"
  ON travel_expenses FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));
  
CREATE POLICY "Admins can manage all expenses"
  ON travel_expenses FOR ALL
  USING (org_id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid()));
*/
