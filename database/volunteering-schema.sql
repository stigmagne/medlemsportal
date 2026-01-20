-- Create tables for Volunteering (Dugnad)

-- 1. Volunteering Events (The main container for a dugnad)
create table if not exists volunteering_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  contact_person_id uuid references auth.users(id),
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Volunteering Roles (Specific shifts/roles within an event, e.g. "Kioskvakt 18:00-20:00")
create table if not exists volunteering_roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references volunteering_events(id) on delete cascade not null,
  title text not null, -- e.g. "Kioskvakt"
  description text,
  start_time timestamptz, -- Optional override if role has specific time within event
  end_time timestamptz,
  capacity integer default 1, -- How many people needed
  filled_count integer default 0, -- Cache for number of approved assignments
  created_at timestamptz default now()
);

-- 3. Volunteering Assignments (Who is doing what)
create table if not exists volunteering_assignments (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references volunteering_roles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null, -- User might be deleted, but we want to keep record? Or cascade?
  user_name text, -- Cache name in case user is deleted or for non-members (future proofing)
  status text not null check (status in ('pending', 'approved', 'rejected', 'completed', 'no_show')) default 'pending',
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_volunteering_events_org on volunteering_events(org_id);
create index idx_volunteering_roles_event on volunteering_roles(event_id);
create index idx_volunteering_assignments_role on volunteering_assignments(role_id);
create index idx_volunteering_assignments_user on volunteering_assignments(user_id);

-- RLS Policies

-- Enable RLS
alter table volunteering_events enable row level security;
alter table volunteering_roles enable row level security;
alter table volunteering_assignments enable row level security;

-- Policies for volunteering_events
create policy "Public read access for published events"
  on volunteering_events for select
  using ( is_published = true or 
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = volunteering_events.org_id 
      and user_org_access.user_id = auth.uid()
    )
  );

create policy "Admin full access events"
  on volunteering_events for all
  using (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = volunteering_events.org_id 
      and user_org_access.user_id = auth.uid()
      and user_org_access.role in ('admin', 'superadmin')
    )
  );

-- Policies for volunteering_roles
create policy "Read access roles"
  on volunteering_roles for select
  using (
    exists (
      select 1 from volunteering_events
      where volunteering_events.id = volunteering_roles.event_id
      and (volunteering_events.is_published = true or exists (
        select 1 from user_org_access 
        where user_org_access.organization_id = volunteering_events.org_id 
        and user_org_access.user_id = auth.uid()
      ))
    )
  );

create policy "Admin full access roles"
  on volunteering_roles for all
  using (
    exists (
      select 1 from volunteering_events e
      join user_org_access a on a.organization_id = e.org_id
      where e.id = volunteering_roles.event_id
      and a.user_id = auth.uid()
      and a.role in ('admin', 'superadmin')
    )
  );

-- Policies for volunteering_assignments
create policy "Read access assignments"
  on volunteering_assignments for select
  using (
    -- Admins can see all
    exists (
      select 1 from volunteering_roles r
      join volunteering_events e on e.id = r.event_id
      join user_org_access a on a.organization_id = e.org_id
      where r.id = volunteering_assignments.role_id
      and a.user_id = auth.uid()
      and a.role in ('admin', 'superadmin')
    )
    OR
    -- Users can see their own
    user_id = auth.uid()
  );

create policy "Users can create pending assignments (SignUp)"
  on volunteering_assignments for insert
  with check (
    -- Must be authenticated
    auth.uid() is not null
    -- Optional: Must be member of org? 
    -- For now, let's assume they might be public if event is public, 
    -- but usually they should be members. 
    -- Let's restrict to authenticated users for now.
  );

create policy "Users can update their own pending assignments (Cancel)"
  on volunteering_assignments for update
  using ( user_id = auth.uid() );

create policy "Admin full access assignments"
  on volunteering_assignments for all
  using (
    exists (
      select 1 from volunteering_roles r
      join volunteering_events e on e.id = r.event_id
      join user_org_access a on a.organization_id = e.org_id
      where r.id = volunteering_assignments.role_id
      and a.user_id = auth.uid()
      and a.role in ('admin', 'superadmin')
    )
  );
