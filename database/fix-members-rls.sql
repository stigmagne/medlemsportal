-- Fix members RLS
-- Users must be able to see their own member profile to access Min Side.
-- Matching is done via Email since members table doesn't always have user_id linked (yet).

alter table members enable row level security;

-- Drop existing policy if it conflicts or is too restrictve
-- Note: 'Public read access for members of org' might exist but relies on ALREADY being a member check.
-- We need a bootstrap policy: "You can see rows that match your auth email".

drop policy if exists "Users can see own member profile" on members;
create policy "Users can see own member profile"
  on members for select
  using (
    email = (select email from auth.users where id = auth.uid())
  );
