/*
⚠️ ⚠️ ⚠️ CRITICAL SECURITY WARNING ⚠️ ⚠️ ⚠️

THIS FILE CONTAINS A DANGEROUS DEBUG POLICY THAT BYPASSES ALL RLS SECURITY.

The policy "Debug: Allow Read All Members" with USING (true) allows ANY authenticated
user to read ALL members from ALL organizations, completely bypassing Row Level Security.

THIS IS A MASSIVE SECURITY VULNERABILITY AND MUST NEVER BE RUN IN PRODUCTION.

This file has been commented out to prevent accidental execution.
It is kept for historical reference only.

If you need to debug RLS policies, use proper org-scoped policies instead.

DO NOT UNCOMMENT THIS FILE.
DO NOT RUN THIS IN PRODUCTION.
DO NOT ENABLE THIS POLICY.

-- ORIGINAL DANGEROUS CODE BELOW (COMMENTED OUT FOR SAFETY):

-- NUCLEAR OPTION (Temporary Debug)
-- Allow anyone authenticated to read all members.
-- If this works, we know the previous policy logic was too strict or failed to match.

-- drop policy if exists "Users can see own member profile" on members;
-- drop policy if exists "Public read access" on members; -- Just in case

-- create policy "Debug: Allow Read All Members"
--   on members for select
--   using ( true );

⚠️ END OF DANGEROUS CODE - FILE DISABLED ⚠️
*/
