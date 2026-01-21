
-- 5. SMS-modul Schema

-- Tabell for å logge utsendte SMS (for fakturering og historikk)
create table if not exists sms_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  sender_user_id uuid references auth.users(id), -- Hvem sendte den?
  recipient_phone text not null,
  message_content text not null,
  status text check (status in ('sent', 'failed', 'delivered', 'pending')) default 'pending',
  gateway_response jsonb, -- Lagre rårespons fra provider for debugging
  cost numeric default 0, -- Kostnad i NOK (hvis tilgjengelig)
  created_at timestamptz default now()
);

-- RLS: Org admins kan se loggen
alter table sms_logs enable row level security;

create policy "Admins can view sms logs"
  on sms_logs for select
  using (
    exists (
      select 1 from user_org_access
      where user_id = auth.uid()
      and organization_id = sms_logs.organization_id
      and role in ('org_admin', 'superadmin')
    )
  );

-- Indexes
create index idx_sms_logs_org on sms_logs(organization_id);
create index idx_sms_logs_created on sms_logs(created_at);
