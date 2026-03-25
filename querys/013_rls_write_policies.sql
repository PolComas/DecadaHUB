-- ============================================================
-- 013: Afegir polítiques RLS d'escriptura per usuaris interns
-- ============================================================
-- Les polítiques existents només permeten SELECT.
-- Afegim INSERT, UPDATE i DELETE per a les taules que
-- el frontend necessita modificar.

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients',
    'client_identifiers',
    'excluded_senders'
  ]
  loop
    -- UPDATE
    execute format('drop policy if exists internal_update on public.%I', t);
    execute format(
      'create policy internal_update on public.%I for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())',
      t
    );

    -- INSERT
    execute format('drop policy if exists internal_insert on public.%I', t);
    execute format(
      'create policy internal_insert on public.%I for insert to authenticated with check (public.is_internal_user())',
      t
    );

    -- DELETE
    execute format('drop policy if exists internal_delete on public.%I', t);
    execute format(
      'create policy internal_delete on public.%I for delete to authenticated using (public.is_internal_user())',
      t
    );
  end loop;
end $$;

-- Taules de dades que el merge necessita actualitzar (només UPDATE)
do $$
declare
  t text;
begin
  foreach t in array array[
    'email_messages',
    'email_threads',
    'meetings',
    'transcripts',
    'ai_insights',
    'action_items'
  ]
  loop
    execute format('drop policy if exists internal_update on public.%I', t);
    execute format(
      'create policy internal_update on public.%I for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())',
      t
    );
  end loop;
end $$;

-- Grant UPDATE/INSERT/DELETE a authenticated (els grants actuals només donen SELECT)
grant insert, update, delete on public.clients to authenticated;
grant insert, update, delete on public.client_identifiers to authenticated;
grant insert, update, delete on public.excluded_senders to authenticated;
grant update on public.email_messages to authenticated;
grant update on public.email_threads to authenticated;
grant update on public.meetings to authenticated;
grant update on public.transcripts to authenticated;
grant update on public.ai_insights to authenticated;
grant update on public.action_items to authenticated;
