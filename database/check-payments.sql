-- Check if payments exist
SELECT count(*) as total_payments FROM payment_transactions;

-- Check details of first 5
SELECT id, org_id, amount, status, created_at FROM payment_transactions LIMIT 5;
