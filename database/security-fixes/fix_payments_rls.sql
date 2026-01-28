-- =====================================================
-- Critical Security Fix: Payment Transactions RLS
-- Purpose: Enable RLS and add policies for the payment_transactions table
-- Found missing during K5 verification (incorrectly identified as 'payments' table initially)
-- =====================================================

-- 1. Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (cleanup)
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Org admins can view all org transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can initiate transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON payment_transactions;

-- 3. View Policies

-- A. Users can view their own payment transactions
-- Matches by member_id -> members.email -> auth.email
CREATE POLICY "Users can view own transactions"
ON payment_transactions FOR SELECT
USING (
  member_id IN (
    SELECT id FROM members 
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
);

-- B. Org Admins can view all transactions in their organization
CREATE POLICY "Org admins can view all org transactions"
ON payment_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = payment_transactions.org_id
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);

-- 4. Insert Policies
-- Users need to be able to create payment records (initialization)
CREATE POLICY "Users can initiate transactions"
ON payment_transactions FOR INSERT
WITH CHECK (
  member_id IN (
    SELECT id FROM members 
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
  AND 
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = payment_transactions.org_id
  )
);

-- 5. Update Policies
-- Admins might need to manually update status
CREATE POLICY "Admins can manage transactions"
ON payment_transactions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_org_access uoa
    WHERE uoa.user_id = auth.uid()
    AND uoa.organization_id = payment_transactions.org_id
    AND uoa.role IN ('org_admin', 'superadmin')
  )
);
