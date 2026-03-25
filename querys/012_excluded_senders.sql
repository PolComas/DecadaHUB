-- ============================================================
-- Taula de remitents exclosos
-- ============================================================
-- Quan descartes un client fals des del frontend, el seu domini
-- s'afegeix aquí perquè el workflow no el torni a crear.

create table if not exists public.excluded_senders (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,          -- domini o email
  reason text default 'dismissed',     -- 'dismissed', 'internal', 'spam', etc.
  created_at timestamptz not null default now()
);

-- Excloure dominis que mai seran clients (opcional, afegeix els teus)
--insert into public.excluded_senders (value, reason) values
--  ('gmail.com',       'freemail'),
--  ('hotmail.com',     'freemail'),
--  ('outlook.com',     'freemail'),
--  ('yahoo.com',       'freemail'),
--  ('icloud.com',      'freemail'),
--  ('live.com',        'freemail')
--on conflict (value) do nothing;

-- NOTA: Si vols que gmail.com es crei com a client per testejar,
-- COMENTA o ELIMINA les línies de sobre.

-- RLS
alter table public.excluded_senders enable row level security;

create policy "internal_read_excluded_senders"
  on public.excluded_senders
  for select
  to authenticated
  using (public.is_internal_user());

create policy "internal_insert_excluded_senders"
  on public.excluded_senders
  for insert
  to authenticated
  with check (public.is_internal_user());

-- Permisos
grant select, insert on public.excluded_senders to authenticated;


-- ============================================================
-- Actualitzar vista KPIs per filtrar clients inactius
-- ============================================================
-- Afegim WHERE c.status != 'inactive' perquè els clients descartats
-- no apareguin al dashboard.

-- Primer recreem la vista amb el filtre
-- (la vista depèn de v_thread_response_events, que no canvia)
