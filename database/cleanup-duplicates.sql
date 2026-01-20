-- Cleanup Duplicate Invoices
-- Keeps the *oldest* invoice for each member for the year 2026 (or current) and deletes the newer duplicates.

DELETE FROM payment_transactions a USING payment_transactions b
WHERE a.id > b.id 
AND a.member_id = b.member_id 
AND a.type = 'membership_fee'
AND a.description LIKE 'Medlemskontingent 2026%' -- Target specific year
AND a.status = 'pending'; -- Only delete pending ones safety check

-- Verify result
SELECT count(*) as remaining_invoices FROM payment_transactions;
