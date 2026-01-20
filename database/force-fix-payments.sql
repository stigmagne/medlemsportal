-- Force Fix Payments Table

-- 1. Explicitly add the missing columns (just in case they were missed)
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Force Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- 3. Simple select to verify it works (this will show in results panel)
SELECT id, description, amount FROM payment_transactions LIMIT 1;
