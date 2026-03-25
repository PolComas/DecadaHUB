create table if not exists public.internal_access (
  email citext primary key,
  full_name text,
  role text not null default 'member',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at_internal_access on public.internal_access;
create trigger set_updated_at_internal_access
before update on public.internal_access
for each row execute function public.set_updated_at();

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.internal_access ia
      where ia.active = true
        and ia.email = nullif(auth.jwt() ->> 'email', '')::citext
    ),
    false
  );
$$;

grant execute on function public.is_internal_user() to authenticated;
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'team_members',
    'clients',
    'client_identifiers',
    'contacts',
    'mailboxes',
    'email_threads',
    'email_messages',
    'email_message_participants',
    'meetings',
    'meeting_attendees',
    'transcripts',
    'ai_insights',
    'action_items',
    'sync_cursors',
    'business_rules',
    'business_holidays',
    'internal_access'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists internal_read on public.%I', table_name);
    execute format(
      'create policy internal_read on public.%I for select to authenticated using (public.is_internal_user())',
      table_name
    );
  end loop;
end $$;
