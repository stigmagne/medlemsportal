-- Force PostgREST to reload the schema cache
-- This is often necessary after creating new tables if the API doesn't pick them up immediately.

NOTIFY pgrst, 'reload schema';

-- Verification: Check if table exists
SELECT count(*) as meeting_count FROM meetings;
