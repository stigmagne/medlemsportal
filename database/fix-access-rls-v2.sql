-- Fix user_org_access RLS (No recursion)
-- Users need to read their own access rows for other RLS policies to work.

alter table user_org_access enable row level security;

-- Simple rule: Users can read their own access entries
drop policy if exists "Users can read own access" on user_org_access;
create policy "Users can read own access"
  on user_org_access for select
  using ( user_id = auth.uid() );
