-- Substitueix aquests emails pels usuaris reals que han d'entrar al panel.
-- Aquesta taula fa d'allowlist. Tot usuari ha de:
-- 1. existir a Supabase Auth
-- 2. existir a public.internal_access amb active = true

insert into public.internal_access (
  email,
  full_name,
  role,
  active
)
values
  ('tu@empresa.com', 'Nom Cognom', 'admin', true),
  ('company@empresa.com', 'Nom Cognom 2', 'member', true)
on conflict (email) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  active = excluded.active,
  updated_at = now();
