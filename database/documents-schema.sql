
-- 3. Dokumentarkiv System

-- Documents table to track file metadata and access control
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  uploader_id uuid references auth.users(id) on delete set null,
  name text not null, -- Display name
  file_path text not null, -- Path in storage bucket (org_id/document_id.ext)
  size_bytes bigint,
  mime_type text,
  access_level text check (access_level in ('public', 'board', 'admin')) default 'board',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_documents_org on documents(org_id);
create index if not exists idx_documents_access on documents(access_level);

-- Enable RLS
alter table documents enable row level security;

-- Policies

-- 1. READ: Who can see documents?
-- 'public': All members of the org.
-- 'board': 'org_admin' and potentially 'board_member' (if we add that role later). For now: Admins.
-- 'admin': 'org_admin' and 'superadmin'.

drop policy if exists "View documents based on access level" on documents;
create policy "View documents based on access level"
  on documents for select
  using (
    -- 1. Bases check: Must be in the org
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = documents.org_id 
      and user_org_access.user_id = auth.uid()
    )
    AND (
      -- 2A. Public documents: accessible to anyone with basic access
      documents.access_level = 'public'
      OR
      -- 2B. Board/Admin documents: require specific roles
      exists (
        select 1 from user_org_access 
        where user_org_access.organization_id = documents.org_id 
        and user_org_access.user_id = auth.uid()
        and user_org_access.role in ('org_admin', 'superadmin') -- 'board' role logic can be added here
      )
    )
  );

-- 2. WRITE: Who can upload?
-- Only admins (and maybe board members later)
drop policy if exists "Admins can upload documents" on documents;
create policy "Admins can upload documents"
  on documents for insert
  with check (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = documents.org_id 
      and user_org_access.user_id = auth.uid()
      and user_org_access.role in ('org_admin', 'superadmin')
    )
  );

-- 3. DELETE: Who can delete?
-- Only admins
drop policy if exists "Admins can delete documents" on documents;
create policy "Admins can delete documents"
  on documents for delete
  using (
    exists (
      select 1 from user_org_access 
      where user_org_access.organization_id = documents.org_id 
      and user_org_access.user_id = auth.uid()
      and user_org_access.role in ('org_admin', 'superadmin')
    )
  );

-- STORAGE POLICIES (Conceptual - applied in Supabase Dashboard or via API if possible, but we define logic here)
-- Bucket: 'org_documents'
-- Key pattern: {org_id}/{filename}

-- INSERT:
-- (bucket_id = 'org_documents' AND auth.role() = 'authenticated' AND (user has admin role in org_id extracted from path))

-- SELECT:
-- (bucket_id = 'org_documents' AND auth.role() = 'authenticated' AND (user in org) AND (document access level check... hard to do in storage policy without join))
-- SIMPLIFICATION for Storage:
-- Allow READ for all members of the org.
-- Rely on the Database (Application Layer) to not prevent the *link* to the file if they don't have access.
-- If someone guesses the UUID file path, they might download it if storage policy is too loose.
-- SECURE APPROACH: Use Signed URLs for everything except 'public' maybe?
-- OR: Strict RLS on storage.objects using a postgres function to check the 'documents' table?
-- Let's stick to Application-level signed URLs for private docs, or strict storage policies.

-- For this MVP: 
-- We will rely on Signed URLs or standard RLS if possible.
-- Storage RLS is complex to script. We will assume checking `user_org_access` for the folder `{org_id}` is "enough" for now, 
-- but ideally we want to respect the `documents.access_level`.
