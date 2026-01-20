SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'campaign_recipients_status_check';
