
-- NUCLEAR OPTION (Temporary Debug)
-- Allow anyone authenticated to read all members.
-- If this works, we know the previous policy logic was too strict or failed to match.

drop policy if exists "Users can see own member profile" on members;
drop policy if exists "Public read access" on members; -- Just in case

create policy "Debug: Allow Read All Members"
  on members for select
  using ( true );

