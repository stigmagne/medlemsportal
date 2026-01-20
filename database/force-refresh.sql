-- 1. Check schema (Result should be 'public')
SELECT table_schema 
FROM information_schema.tables 
WHERE table_name = 'meetings';

-- 2. Modify table metadata to force-trigger schema watchers
COMMENT ON TABLE meetings IS 'Meeting management table - forced refresh';

-- 3. Explicitly notify again (just in case)
NOTIFY pgrst, 'reload schema';
