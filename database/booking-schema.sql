-- 2. Ressursbooking System

-- Resources (e.g. Club house, equipment)
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text,
  requires_approval boolean default false,
  hourly_rate numeric default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bookings
create table if not exists resource_bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  org_id uuid references organizations(id) on delete cascade not null, -- Denormalized for easy RLS
  start_time timestamptz not null,
  end_time timestamptz not null,
  description text, -- Purpose of booking
  status text check (status in ('pending', 'confirmed', 'rejected', 'cancelled')) default 'confirmed',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- Indexes
create index if not exists idx_resources_org on resources(org_id);
create index if not exists idx_bookings_resource on resource_bookings(resource_id);
create index if not exists idx_bookings_org on resource_bookings(org_id);
create index if not exists idx_bookings_time on resource_bookings(start_time, end_time);

-- Resources
alter table resources enable row level security;

drop policy if exists "Public read access for members of org" on resources;
create policy "Public read access for members of org"
  on resources for select
  using (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = resources.org_id 
      and user_org_access.user_id = auth.uid()
    )
    or
    exists (
        -- Also allow simple members check if user_org_access is only for admins? 
        -- Assuming members table is source of truth for membership.
        select 1 from members
        where members.organization_id = resources.org_id
        and members.email = (select email from auth.users where id = auth.uid())
    )
  );

drop policy if exists "Admins can manage resources" on resources;
create policy "Admins can manage resources"
  on resources for all
  using (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = resources.org_id 
      and user_org_access.user_id = auth.uid()
      and user_org_access.role in ('org_admin', 'superadmin')
    )
  );

-- Bookings
alter table resource_bookings enable row level security;

drop policy if exists "Members can view all bookings (to see availability)" on resource_bookings;
create policy "Members can view all bookings (to see availability)"
  on resource_bookings for select
  using (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = resource_bookings.org_id 
      and user_org_access.user_id = auth.uid()
    )
    or
    exists (
        select 1 from members
        where members.organization_id = resource_bookings.org_id
        and members.email = (select email from auth.users where id = auth.uid())
    )
  );

drop policy if exists "Members can create bookings" on resource_bookings;
create policy "Members can create bookings"
  on resource_bookings for insert
  with check (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = resource_bookings.org_id 
      and user_org_access.user_id = auth.uid()
    )
    or
    exists (
        select 1 from members
        where members.organization_id = resource_bookings.org_id
        and members.email = (select email from auth.users where id = auth.uid())
    )
  );

drop policy if exists "Members can update own bookings (e.g. cancel)" on resource_bookings;
create policy "Members can update own bookings (e.g. cancel)"
  on resource_bookings for update
  using ( user_id = auth.uid() );

drop policy if exists "Admins can manage all bookings" on resource_bookings;
create policy "Admins can manage all bookings"
  on resource_bookings for all
  using (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = resource_bookings.org_id 
      and user_org_access.user_id = auth.uid()
      and user_org_access.role in ('org_admin', 'superadmin')
    )
  );
