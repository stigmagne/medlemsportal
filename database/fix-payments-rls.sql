-- Fix RLS for payment_transactions
-- Currently RLS is enabled but no policies exist, blocking all access by default.

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payment_transactions;
DROP POLICY IF EXISTS "Members can view own payments" ON payment_transactions;

-- 2. Create a permissive policy for authenticated users
-- This allows logged-in users (Admins) to INSERT rows and view them.
CREATE POLICY "Enable all access for authenticated users"
ON payment_transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Force schema cache reload again just to be safe
NOTIFY pgrst, 'reload schema';
