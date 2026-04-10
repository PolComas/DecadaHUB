-- ══════════════════════════════════════════════════════════════════════
-- 016 · REPLICA IDENTITY FULL per a Supabase Realtime
-- ══════════════════════════════════════════════════════════════════════
-- Per defecte PostgreSQL usa REPLICA IDENTITY DEFAULT, que en events
-- DELETE només inclou la PRIMARY KEY. Sense FULL:
--   · Els filtres per columnes (ex: client_id=eq.xxx) no funcionen en DELETEs
--   · Supabase Realtime descarta l'event silenciosament
-- Cal executar-ho una sola vegada per projecte.
-- ══════════════════════════════════════════════════════════════════════

alter table public.clients         replica identity full;
alter table public.email_threads   replica identity full;
alter table public.email_messages  replica identity full;
alter table public.action_items    replica identity full;
alter table public.transcripts     replica identity full;
alter table public.ai_insights     replica identity full;
alter table public.meetings        replica identity full;
