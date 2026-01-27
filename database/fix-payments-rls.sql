/*
⚠️ ⚠️ ⚠️ CRITICAL SECURITY WARNING ⚠️ ⚠️ ⚠️

THIS FILE CONTAINS A DANGEROUS DEBUG POLICY THAT BYPASSES ALL RLS SECURITY.

The policy "Enable all access for authenticated users" with FOR ALL USING (true) WITH CHECK (true)
allows ANY authenticated user to:
- READ all payment_transactions from ALL organizations
- INSERT/UPDATE/DELETE payment records without any restrictions
- Manipulate financial transaction data across all organizations

THIS IS AN EXTREME SECURITY VULNERABILITY exposing sensitive financial information
and allowing financial fraud.

THIS FILE HAS BEEN PERMANENTLY DISABLED.

This file has been commented out to prevent accidental execution.
It is kept for historical reference only.

If you need to debug payment_transactions RLS policies, use proper org-scoped policies instead.

DO NOT UNCOMMENT THIS FILE.
DO NOT RUN THIS IN PRODUCTION.
DO NOT ENABLE THIS POLICY.

-- ORIGINAL DANGEROUS CODE BELOW (COMMENTED OUT FOR SAFETY):

-- Fix RLS for payment_transactions
-- Currently RLS is enabled but no policies exist, blocking all access by default.

-- 1. Drop existing policies to avoid conflicts
-- DROP POLICY IF EXISTS "Enable all access for authenticated users" ON payment_transactions;
-- DROP POLICY IF EXISTS "Admins can manage all payments" ON payment_transactions;
-- DROP POLICY IF EXISTS "Members can view own payments" ON payment_transactions;

-- 2. Create a permissive policy for authenticated users
-- This allows logged-in users (Admins) to INSERT rows and view them.
-- CREATE POLICY "Enable all access for authenticated users"
-- ON payment_transactions
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- 3. Force schema cache reload again just to be safe
-- NOTIFY pgrst, 'reload schema';

⚠️ END OF DANGEROUS CODE - FILE DISABLED ⚠️
*/
