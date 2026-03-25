-- Substitueix els emails i noms abans d'executar.
-- Aquesta query nomes dona d'alta els mailboxes a la BD.
-- L'autenticacio real de Gmail/Calendar anira des d'n8n quan muntis els fluxos.

insert into public.team_members (
  full_name,
  email,
  role
)
values
  ('Nom Responsable Mailbox 1', 'mailbox1-owner@empresa.com', 'Account Manager'),
  ('Nom Responsable Mailbox 2', 'mailbox2-owner@empresa.com', 'Account Manager')
on conflict (email) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  active = true,
  updated_at = now();

insert into public.mailboxes (
  team_member_id,
  label,
  email,
  provider,
  is_active
)
select
  tm.id,
  'Shared Gmail 1',
  'shared-mailbox-1@empresa.com',
  'gmail',
  true
from public.team_members tm
where tm.email = 'mailbox1-owner@empresa.com'
on conflict (email) do update
set
  team_member_id = excluded.team_member_id,
  label = excluded.label,
  provider = excluded.provider,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.mailboxes (
  team_member_id,
  label,
  email,
  provider,
  is_active
)
select
  tm.id,
  'Shared Gmail 2',
  'shared-mailbox-2@empresa.com',
  'gmail',
  true
from public.team_members tm
where tm.email = 'mailbox2-owner@empresa.com'
on conflict (email) do update
set
  team_member_id = excluded.team_member_id,
  label = excluded.label,
  provider = excluded.provider,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.contacts (
  client_id,
  full_name,
  email,
  company_name,
  title,
  contact_type,
  metadata
)
values
  (null, 'Shared Gmail 1', 'shared-mailbox-1@empresa.com', 'DecadaHUB', 'Shared Inbox', 'team', '{"source":"mailbox-setup"}'::jsonb),
  (null, 'Shared Gmail 2', 'shared-mailbox-2@empresa.com', 'DecadaHUB', 'Shared Inbox', 'team', '{"source":"mailbox-setup"}'::jsonb)
on conflict (email) do update
set
  full_name = excluded.full_name,
  company_name = excluded.company_name,
  title = excluded.title,
  contact_type = excluded.contact_type,
  metadata = excluded.metadata,
  updated_at = now();
