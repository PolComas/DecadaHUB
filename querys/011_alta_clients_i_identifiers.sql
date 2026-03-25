-- ============================================================
-- Auto-creació de clients des del workflow n8n
-- ============================================================
-- Aquesta query s'utilitza dins del node "Resolve client" del
-- workflow de backfill/incremental per auto-crear clients.
--
-- LÒGICA:
--   1. Busca si el domini/email ja existeix a client_identifiers → retorna client_id
--   2. Si no, busca si el domini/email està exclòs → retorna NULL
--   3. Si no està exclòs, crea un nou client + identifier → retorna client_id
--
-- Utilitza-la com a referència per al Code node d'n8n.
-- ============================================================

-- Funció que encapsula tota la lògica de resolució + auto-creació.
-- S'invoca des del workflow amb: SELECT * FROM resolve_or_create_client($email, $domain)

create or replace function public.resolve_or_create_client(
  sender_email text,
  sender_domain text
)
returns table (client_id uuid, auto_created boolean)
language plpgsql
as $$
declare
  found_client_id uuid;
  new_client_id uuid;
  is_excluded boolean;
begin
  -- 1. Buscar per email exacte o domini a client_identifiers
  select ci.client_id into found_client_id
  from public.client_identifiers ci
  where ci.identifier_value = sender_email
     or ci.identifier_value = sender_domain
  limit 1;

  if found_client_id is not null then
    return query select found_client_id, false;
    return;
  end if;

  -- 2. Comprovar si el domini o email està exclòs
  select exists(
    select 1 from public.excluded_senders es
    where es.value = sender_email
       or es.value = sender_domain
  ) into is_excluded;

  if is_excluded then
    return query select null::uuid, false;
    return;
  end if;

  -- 3. Crear nou client amb nom = domini (o email si és freemail)
  insert into public.clients (name, slug, status, primary_domain)
  values (
    sender_domain,
    lower(replace(sender_domain, '.', '-')),
    'active',
    sender_domain
  )
  on conflict do nothing
  returning id into new_client_id;

  -- Si ja existia un client amb el mateix slug (race condition), buscar-lo
  if new_client_id is null then
    select c.id into new_client_id
    from public.clients c
    where c.primary_domain = sender_domain
    limit 1;
  end if;

  -- 4. Crear identifier per vincular el domini al client
  if new_client_id is not null then
    insert into public.client_identifiers (client_id, identifier_type, identifier_value)
    values (new_client_id, 'domain', sender_domain)
    on conflict (identifier_type, identifier_value) do nothing;
  end if;

  return query select new_client_id, true;
end;
$$;
