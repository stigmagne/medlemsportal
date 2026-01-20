-- Secure members RLS policy
-- Users can only see their own member profile (matched by email)

drop policy if exists "Debug: Allow Read All Members" on members;
drop policy if exists "Users can see own member profile" on members;
drop policy if exists "Public read access" on members;
drop policy if exists "Org admins can see all members" on members;
drop policy if exists "Superadmins can see all members" on members;

-- Allow users to see their own member profile
create policy "Users can see own member profile"
  on members for select
  using (
    lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Allow org admins to see all members in their org
create policy "Org admins can see all members"
  on members for all
  using (
    exists (
      select 1 from user_org_access
      where user_org_access.organization_id = members.organization_id
      and user_org_access.user_id = auth.uid()
      and user_org_access.role in ('org_admin', 'superadmin')
    )
  );

-- Allow superadmins to see all members
create policy "Superadmins can see all members"
  on members for all
  using (
    exists (
      select 1 from user_org_access
      where user_org_access.organization_id is null
      and user_org_access.user_id = auth.uid()
      and user_org_access.role = 'superadmin'
    )
  );
