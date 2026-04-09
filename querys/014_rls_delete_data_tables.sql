-- ============================================================
-- 014: Afegir permisos d'esborrat a taules operatives del hub
-- ============================================================
-- El frontend permet eliminar correus, anàlisis, accions, fils,
-- reunions i transcripcions. Cal habilitar DELETE per a usuaris
-- interns autenticats en aquestes taules.

do $$
declare
  t text;
begin
  foreach t in array array[
    'email_message_participants',
    'email_messages',
    'email_threads',
    'meetings',
    'transcripts',
    'ai_insights',
    'action_items'
  ]
  loop
    execute format('drop policy if exists internal_delete on public.%I', t);
    execute format(
      'create policy internal_delete on public.%I for delete to authenticated using (public.is_internal_user())',
      t
    );
  end loop;
end $$;

grant delete on public.email_message_participants to authenticated;
grant delete on public.email_messages to authenticated;
grant delete on public.email_threads to authenticated;
grant delete on public.meetings to authenticated;
grant delete on public.transcripts to authenticated;
grant delete on public.ai_insights to authenticated;
grant delete on public.action_items to authenticated;
