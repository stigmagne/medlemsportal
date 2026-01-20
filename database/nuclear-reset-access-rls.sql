-- NUCLEAR RESET: Remove ALL policies on user_org_access

-- Drop all possible policies (both old and new names)
drop policy if exists "Users can read own access" on user_org_access;
drop policy if exists "Admins can read all access" on user_org_access;
drop policy if exists "Public read access" on user_org_access;
drop policy if exists "Allow all for debugging" on user_org_access;

-- Temporarily DISABLE RLS to clear everything
alter table user_org_access disable row level security;

-- Re-enable RLS
alter table user_org_access enable row level security;

-- Add ONLY the simple, safe policy
create policy "Users can read own access"
  on user_org_access for select
  using ( user_id = auth.uid() );
