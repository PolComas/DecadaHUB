-- ══════════════════════════════════════════════════════════════════════
-- 015 · GRANTS per a vistes + gestió d'accés d'usuaris
-- ══════════════════════════════════════════════════════════════════════
-- Context: Les taules usen RLS amb la funció is_internal_user() que
-- comprova la taula public.internal_access. Les vistes NO suporten
-- CREATE POLICY — cal usar GRANT SELECT.
-- ══════════════════════════════════════════════════════════════════════


-- ── 1. GRANTS per a vistes (no suporten CREATE POLICY) ───────────────
-- Executar si s'afegeix una vista nova o si apareix error de permisos.

grant select on public.v_client_kpis_30d         to authenticated;
grant select on public.v_client_activity_timeline to authenticated;
grant select on public.v_thread_response_events   to authenticated;


-- ── 2. Afegir nous usuaris a la allowlist ─────────────────────────────
-- Qualsevol usuari que hagi de veure el HUB ha de:
--   a) Existir a Supabase Auth (convidat des del dashboard o via invitació)
--   b) Existir a aquesta taula amb active = true
--
-- Si un usuari pot autenticar-se però no veu cap dada (llista buida,
-- mètriques a —), és que no està en aquesta taula.

insert into public.internal_access (email, full_name, role, active)
values
  -- Afegeix aquí els nous usuaris:
  -- ('nou@empresa.com', 'Nom Cognom', 'member', true),
  ('pol@blumb.ai',    'Pol',    'admin',  true),
  ('camila@blumb.ai', 'Camila', 'member', true)
on conflict (email) do update
set
  full_name  = excluded.full_name,
  role       = excluded.role,
  active     = excluded.active,
  updated_at = now();


-- ── 3. Verificació — llista d'usuaris actius ─────────────────────────
-- Executar per comprovar qui té accés:
--
--   select email, full_name, role, active
--   from public.internal_access
--   order by email;


-- ── 4. Desactivar accés d'un usuari ──────────────────────────────────
-- No cal eliminar el registre, només desactivar-lo:
--
--   update public.internal_access
--   set active = false, updated_at = now()
--   where email = 'usuari@empresa.com';


-- ── 5. Notes sobre el model de seguretat ─────────────────────────────
-- • Les taules tenen RLS enable amb la policy "internal_read" que crida
--   is_internal_user(). Veure 008_auth_rls.sql.
-- • Les vistes hereten els permisos de les taules subjacents (security
--   invoker per defecte). El GRANT de la vista només permet que
--   PostgREST la serveixi; les policies RLS de les taules segueixen
--   aplicant-se internament.
-- • Si una vista usa una altra vista (ex: v_client_kpis_30d usa
--   v_thread_response_events), totes dues necessiten GRANT SELECT.
