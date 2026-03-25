create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.client_status as enum ('active', 'paused', 'churn_risk', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contact_type as enum ('team', 'client', 'external');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.identifier_type as enum ('domain', 'email', 'calendar_guest', 'doc_keyword', 'manual');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.client_match_status as enum ('pending', 'matched', 'manual_review');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_direction as enum ('team_to_client', 'client_to_team', 'internal');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.email_participant_role as enum ('from', 'to', 'cc', 'bcc');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.thread_status as enum ('open', 'waiting_client', 'waiting_team', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.meeting_status as enum ('confirmed', 'tentative', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendee_response_status as enum ('needs_action', 'accepted', 'tentative', 'declined');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transcript_source as enum ('google_doc', 'drive_docx', 'manual_upload');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.analyzable_entity as enum ('email_message', 'email_thread', 'meeting', 'transcript', 'client');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sentiment_label as enum ('positive', 'neutral', 'negative', 'mixed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.action_status as enum ('open', 'in_progress', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.action_priority as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email citext not null unique,
  role text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status public.client_status not null default 'active',
  owner_team_member_id uuid references public.team_members(id) on delete set null,
  primary_domain citext,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_identifiers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  identifier_type public.identifier_type not null,
  identifier_value text not null,
  confidence numeric(5,2) not null default 1.00,
  created_at timestamptz not null default now(),
  unique (identifier_type, identifier_value)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  full_name text,
  email citext not null unique,
  company_name text,
  title text,
  contact_type public.contact_type not null default 'client',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mailboxes (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid references public.team_members(id) on delete set null,
  label text not null,
  email citext not null unique,
  provider text not null default 'gmail',
  is_active boolean not null default true,
  last_watch_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_threads (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  match_status public.client_match_status not null default 'pending',
  provider_thread_id text not null,
  subject text,
  first_message_at timestamptz,
  last_message_at timestamptz,
  last_client_message_at timestamptz,
  last_team_message_at timestamptz,
  last_direction public.message_direction,
  message_count integer not null default 0,
  status public.thread_status not null default 'open',
  raw_labels text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox_id, provider_thread_id)
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes(id) on delete cascade,
  thread_id uuid not null references public.email_threads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  provider_message_id text not null,
  internet_message_id text,
  sent_at timestamptz not null,
  direction public.message_direction not null,
  sender_contact_id uuid references public.contacts(id) on delete set null,
  subject text,
  snippet text,
  body_text text,
  body_html text,
  has_attachments boolean not null default false,
  labels text[] not null default '{}'::text[],
  in_reply_to text,
  references_list text[] not null default '{}'::text[],
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (mailbox_id, provider_message_id)
);

create table if not exists public.email_message_participants (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.email_messages(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  participant_role public.email_participant_role not null,
  email citext not null,
  full_name text,
  created_at timestamptz not null default now(),
  unique (message_id, participant_role, email)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid references public.mailboxes(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  provider_event_id text not null,
  calendar_id text not null default 'primary',
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text,
  meeting_url text,
  location text,
  status public.meeting_status not null default 'confirmed',
  attendee_count integer not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox_id, calendar_id, provider_event_id)
);

create table if not exists public.meeting_attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  email citext not null,
  full_name text,
  response_status public.attendee_response_status not null default 'needs_action',
  is_organizer boolean not null default false,
  created_at timestamptz not null default now(),
  unique (meeting_id, email)
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  source_type public.transcript_source not null,
  drive_file_id text,
  external_document_id text,
  file_name text,
  document_url text,
  transcript_at timestamptz,
  language_code text,
  content_text text not null,
  content_hash text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  entity_type public.analyzable_entity not null,
  entity_id uuid not null,
  client_id uuid references public.clients(id) on delete set null,
  model_name text not null,
  prompt_version text,
  sentiment_label public.sentiment_label,
  sentiment_score numeric(5,2),
  urgency_score numeric(5,2),
  complaint_flag boolean not null default false,
  satisfaction_flag boolean not null default false,
  needs_follow_up boolean not null default false,
  summary text,
  topics jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  action_suggestions jsonb not null default '[]'::jsonb,
  raw_output jsonb not null default '{}'::jsonb,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  source_entity_type public.analyzable_entity not null,
  source_entity_id uuid not null,
  meeting_id uuid references public.meetings(id) on delete set null,
  owner_team_member_id uuid references public.team_members(id) on delete set null,
  title text not null,
  details text,
  due_at timestamptz,
  status public.action_status not null default 'open',
  priority public.action_priority not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_cursors (
  id uuid primary key default gen_random_uuid(),
  integration_key text not null unique,
  cursor_value text not null,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transcripts_drive_file_unique_idx
  on public.transcripts (source_type, drive_file_id);

create unique index if not exists transcripts_external_doc_unique_idx
  on public.transcripts (source_type, external_document_id);

create index if not exists clients_owner_idx on public.clients (owner_team_member_id);
create index if not exists client_identifiers_client_idx on public.client_identifiers (client_id);
create index if not exists contacts_client_idx on public.contacts (client_id);
create index if not exists contacts_type_idx on public.contacts (contact_type);
create index if not exists email_threads_client_idx on public.email_threads (client_id);
create index if not exists email_threads_last_message_idx on public.email_threads (last_message_at desc);
create index if not exists email_messages_thread_idx on public.email_messages (thread_id, sent_at);
create index if not exists email_messages_client_idx on public.email_messages (client_id, sent_at desc);
create index if not exists email_messages_direction_idx on public.email_messages (direction);
create index if not exists email_message_participants_contact_idx on public.email_message_participants (contact_id);
create index if not exists meetings_client_idx on public.meetings (client_id, start_at desc);
create index if not exists transcripts_client_idx on public.transcripts (client_id, transcript_at desc);
create index if not exists ai_insights_entity_idx on public.ai_insights (entity_type, entity_id);
create index if not exists ai_insights_client_idx on public.ai_insights (client_id, analyzed_at desc);
create index if not exists action_items_client_idx on public.action_items (client_id, status);

drop trigger if exists set_updated_at_team_members on public.team_members;
create trigger set_updated_at_team_members
before update on public.team_members
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_contacts on public.contacts;
create trigger set_updated_at_contacts
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_mailboxes on public.mailboxes;
create trigger set_updated_at_mailboxes
before update on public.mailboxes
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_email_threads on public.email_threads;
create trigger set_updated_at_email_threads
before update on public.email_threads
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_meetings on public.meetings;
create trigger set_updated_at_meetings
before update on public.meetings
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_transcripts on public.transcripts;
create trigger set_updated_at_transcripts
before update on public.transcripts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_action_items on public.action_items;
create trigger set_updated_at_action_items
before update on public.action_items
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_sync_cursors on public.sync_cursors;
create trigger set_updated_at_sync_cursors
before update on public.sync_cursors
for each row execute function public.set_updated_at();
