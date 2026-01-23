-- Security Fix: Payments RLS Policies
-- Implements proper organization-scoped access control for payment transactions.
-- Previously, RLS policies were commented out and security was only handled by application logic.

-- ====================
-- PAYMENT TRANSACTIONS POLICIES
-- ====================

-- Org admins can view all payments for their organization
DROP POLICY IF EXISTS "Org admins can view all payments" ON payment_transactions;
CREATE POLICY "Org admins can view all payments" ON payment_transactions
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Members can view their own payments
DROP POLICY IF EXISTS "Members can view own payments" ON payment_transactions;
CREATE POLICY "Members can view own payments" ON payment_transactions
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Org admins can create payments
DROP POLICY IF EXISTS "Org admins can create payments" ON payment_transactions;
CREATE POLICY "Org admins can create payments" ON payment_transactions
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Org admins can update payments (e.g., mark as paid)
DROP POLICY IF EXISTS "Org admins can update payments" ON payment_transactions;
CREATE POLICY "Org admins can update payments" ON payment_transactions
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );

-- Org admins can delete payments
DROP POLICY IF EXISTS "Org admins can delete payments" ON payment_transactions;
CREATE POLICY "Org admins can delete payments" ON payment_transactions
  FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_org_access
      WHERE user_id = auth.uid()
      AND role IN ('org_admin', 'org_owner')
    )
  );
