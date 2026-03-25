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
  sender_domain text,
  sender_display_name text default ''
)
returns table (client_id uuid, auto_created boolean)
language plpgsql
as $$
declare
  found_client_id uuid;
  new_client_id uuid;
  is_excluded boolean;
  is_freemail boolean;
  client_name text;
  client_slug text;
begin
  -- 1. Buscar per email exacte o domini a client_identifiers
  select ci.client_id into found_client_id
  from public.client_identifiers ci
  where ci.identifier_value = sender_email
     or (sender_domain <> '' and ci.identifier_value = sender_domain)
  limit 1;

  if found_client_id is not null then
    return query select found_client_id, false;
    return;
  end if;

  -- 2. Comprovar si el domini o email està exclòs
  select exists(
    select 1 from public.excluded_senders es
    where es.value = sender_email
       or (sender_domain <> '' and es.value = sender_domain)
  ) into is_excluded;

  if is_excluded then
    return query select null::uuid, false;
    return;
  end if;

  -- 3. Determinar si és freemail (domini buit = freemail filtrat pel workflow)
  is_freemail := (sender_domain = '' or sender_domain is null);

  -- 4. Nom i slug del client
  if is_freemail then
    -- Freemail: usar display name o email com a nom
    client_name := case
      when coalesce(sender_display_name, '') <> '' then sender_display_name
      else sender_email
    end;
    client_slug := lower(regexp_replace(
      regexp_replace(sender_email, '@.*$', ''),
      '[^a-z0-9]+', '-', 'g'
    ));
  else
    -- Domini corporatiu: usar domini com a nom
    client_name := sender_domain;
    client_slug := lower(replace(sender_domain, '.', '-'));
  end if;

  -- 5. Crear nou client
  insert into public.clients (name, slug, status, primary_domain)
  values (
    client_name,
    client_slug,
    'active',
    case when is_freemail then null else sender_domain end
  )
  on conflict do nothing
  returning id into new_client_id;

  -- Si ja existia (race condition), buscar-lo
  if new_client_id is null then
    if is_freemail then
      -- Per freemail, buscar per slug (basat en email)
      select c.id into new_client_id
      from public.clients c
      where c.slug = client_slug
      limit 1;
    else
      select c.id into new_client_id
      from public.clients c
      where c.primary_domain = sender_domain
      limit 1;
    end if;
  end if;

  -- 6. Crear identifier (email per freemail, domini per corporatiu)
  if new_client_id is not null then
    if is_freemail then
      insert into public.client_identifiers (client_id, identifier_type, identifier_value)
      values (new_client_id, 'email', sender_email)
      on conflict (identifier_type, identifier_value) do nothing;
    else
      insert into public.client_identifiers (client_id, identifier_type, identifier_value)
      values (new_client_id, 'domain', sender_domain)
      on conflict (identifier_type, identifier_value) do nothing;
    end if;
  end if;

  return query select new_client_id, true;
end;
$$;
