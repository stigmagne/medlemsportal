-- Diagnostic script to check 'meetings' table status

-- 1. Check if table exists in information_schema
SELECT 
    table_schema, 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name = 'meetings';

-- 2. Check column definitions
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meetings';

-- 3. Check Grants/Permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'meetings';

-- 4. Explicitly GRAFT permissions (Just in case)
GRANT ALL ON TABLE meetings TO authenticated;
GRANT ALL ON TABLE meetings TO service_role;
GRANT ALL ON TABLE meeting_attendees TO authenticated;
GRANT ALL ON TABLE meeting_attendees TO service_role;
GRANT ALL ON TABLE meeting_minutes TO authenticated;
GRANT ALL ON TABLE meeting_minutes TO service_role;

-- 5. Force another reload
NOTIFY pgrst, 'reload schema';
