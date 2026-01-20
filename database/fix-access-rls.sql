-- Fix user_org_access RLS
-- This ensures users can read their own access rows, which is critical for other RLS policies to work (via subqueries).

alter table user_org_access enable row level security;

drop policy if exists "Users can read own access" on user_org_access;
create policy "Users can read own access"
  on user_org_access for select
  using ( user_id = auth.uid() );

drop policy if exists "Admins can read all access" on user_org_access;
create policy "Admins can read all access"
  on user_org_access for select
  using (
    exists (
      select 1 from user_org_access as ua
      where ua.organization_id = user_org_access.organization_id 
      and ua.user_id = auth.uid()
      and ua.role in ('org_admin', 'superadmin')
    )
    or 
    exists (
      select 1 from user_org_access as ua
      where ua.organization_id is null
      and ua.user_id = auth.uid()
      and ua.role = 'superadmin'
    )
  );
