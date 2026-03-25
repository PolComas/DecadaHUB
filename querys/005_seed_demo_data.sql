insert into public.team_members (
  full_name,
  email,
  role
)
values
  ('Anna Serra', 'anna.serra@demo.local', 'Account Manager'),
  ('Marc Puig', 'marc.puig@demo.local', 'Account Manager')
on conflict (email) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  active = true,
  updated_at = now();

insert into public.mailboxes (
  team_member_id,
  label,
  email,
  provider,
  is_active
)
select
  tm.id,
  'Shared Gmail 1',
  'shared-amazon-1@demo.local',
  'gmail',
  true
from public.team_members tm
where tm.email = 'anna.serra@demo.local'
on conflict (email) do update
set
  team_member_id = excluded.team_member_id,
  label = excluded.label,
  provider = excluded.provider,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.mailboxes (
  team_member_id,
  label,
  email,
  provider,
  is_active
)
select
  tm.id,
  'Shared Gmail 2',
  'shared-amazon-2@demo.local',
  'gmail',
  true
from public.team_members tm
where tm.email = 'marc.puig@demo.local'
on conflict (email) do update
set
  team_member_id = excluded.team_member_id,
  label = excluded.label,
  provider = excluded.provider,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.clients (
  name,
  slug,
  status,
  owner_team_member_id,
  notes,
  metadata
)
select
  'Luna Cosmetics',
  'luna-cosmetics',
  'active',
  tm.id,
  'Client demo amb incidencies de ROAS i seguiment pendent.',
  '{"source":"demo-seed","account_type":"amazon-marketing"}'::jsonb
from public.team_members tm
where tm.email = 'anna.serra@demo.local'
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  owner_team_member_id = excluded.owner_team_member_id,
  notes = excluded.notes,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.clients (
  name,
  slug,
  status,
  owner_team_member_id,
  notes,
  metadata
)
select
  'Nord Pet',
  'nord-pet',
  'active',
  tm.id,
  'Client demo estable amb bona resposta.',
  '{"source":"demo-seed","account_type":"amazon-marketing"}'::jsonb
from public.team_members tm
where tm.email = 'marc.puig@demo.local'
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  owner_team_member_id = excluded.owner_team_member_id,
  notes = excluded.notes,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.clients (
  name,
  slug,
  status,
  owner_team_member_id,
  notes,
  metadata
)
select
  'Green Kitchen',
  'green-kitchen',
  'active',
  tm.id,
  'Client demo amb fil pendent de resposta de l''equip.',
  '{"source":"demo-seed","account_type":"amazon-marketing"}'::jsonb
from public.team_members tm
where tm.email = 'anna.serra@demo.local'
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  owner_team_member_id = excluded.owner_team_member_id,
  notes = excluded.notes,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.client_identifiers (
  client_id,
  identifier_type,
  identifier_value,
  confidence
)
values
  ((select id from public.clients where slug = 'luna-cosmetics'), 'email', 'lucia.luna@gmail.com', 1.00),
  ((select id from public.clients where slug = 'luna-cosmetics'), 'manual', 'Luna Cosmetics', 0.80),
  ((select id from public.clients where slug = 'nord-pet'), 'email', 'nordpet.consulting@gmail.com', 1.00),
  ((select id from public.clients where slug = 'nord-pet'), 'manual', 'Nord Pet', 0.80),
  ((select id from public.clients where slug = 'green-kitchen'), 'email', 'hello.greenkitchen@gmail.com', 1.00),
  ((select id from public.clients where slug = 'green-kitchen'), 'manual', 'Green Kitchen', 0.80)
on conflict (identifier_type, identifier_value) do update
set
  client_id = excluded.client_id,
  confidence = excluded.confidence;

insert into public.contacts (
  client_id,
  full_name,
  email,
  company_name,
  title,
  contact_type,
  metadata
)
values
  (null, 'Shared Gmail 1', 'shared-amazon-1@demo.local', 'DecadaHUB', 'Shared Inbox', 'team', '{"source":"demo-seed"}'::jsonb),
  (null, 'Shared Gmail 2', 'shared-amazon-2@demo.local', 'DecadaHUB', 'Shared Inbox', 'team', '{"source":"demo-seed"}'::jsonb),
  ((select id from public.clients where slug = 'luna-cosmetics'), 'Lucia Gomez', 'lucia.luna@gmail.com', 'Luna Cosmetics', 'Founder', 'client', '{"source":"demo-seed"}'::jsonb),
  ((select id from public.clients where slug = 'nord-pet'), 'Pablo Nord', 'nordpet.consulting@gmail.com', 'Nord Pet', 'Owner', 'client', '{"source":"demo-seed"}'::jsonb),
  ((select id from public.clients where slug = 'green-kitchen'), 'Sara Green', 'hello.greenkitchen@gmail.com', 'Green Kitchen', 'CEO', 'client', '{"source":"demo-seed"}'::jsonb)
on conflict (email) do update
set
  client_id = excluded.client_id,
  full_name = excluded.full_name,
  company_name = excluded.company_name,
  title = excluded.title,
  contact_type = excluded.contact_type,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.email_threads (
  mailbox_id,
  client_id,
  match_status,
  provider_thread_id,
  subject,
  status,
  raw_labels,
  metadata
)
values
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'matched',
    'demo-thread-luna-001',
    'Urgent: ROAS drop in US campaigns',
    'open',
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-2@demo.local'),
    (select id from public.clients where slug = 'nord-pet'),
    'matched',
    'demo-thread-nord-001',
    'Monthly update and next steps',
    'open',
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.clients where slug = 'green-kitchen'),
    'matched',
    'demo-thread-green-001',
    'Need revised ACOS target for April',
    'open',
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  )
on conflict (mailbox_id, provider_thread_id) do update
set
  client_id = excluded.client_id,
  match_status = excluded.match_status,
  subject = excluded.subject,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.email_messages (
  mailbox_id,
  thread_id,
  client_id,
  provider_message_id,
  internet_message_id,
  sent_at,
  direction,
  sender_contact_id,
  subject,
  snippet,
  body_text,
  has_attachments,
  labels,
  raw_payload
)
values
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-luna-001'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'demo-msg-luna-001',
    '<demo-msg-luna-001@demo.local>',
    date_trunc('day', now()) - interval '12 day' + interval '10 hour',
    'team_to_client',
    (select id from public.contacts where email = 'shared-amazon-1@demo.local'),
    'Urgent: ROAS drop in US campaigns',
    'We reviewed the account and propose a call.',
    'Hi Lucia, we have reviewed the account and would like to discuss the ROAS drop. Can we review this today?',
    false,
    array['INBOX', 'SENT'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-luna-001'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'demo-msg-luna-002',
    '<demo-msg-luna-002@demo.local>',
    date_trunc('day', now()) - interval '12 day' + interval '15 hour 30 minute',
    'client_to_team',
    (select id from public.contacts where email = 'lucia.luna@gmail.com'),
    'Re: Urgent: ROAS drop in US campaigns',
    'This is worrying. Sales are clearly down.',
    'This is worrying. Sales are clearly down and I need visibility on what changed.',
    false,
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-luna-001'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'demo-msg-luna-003',
    '<demo-msg-luna-003@demo.local>',
    date_trunc('day', now()) - interval '11 day' + interval '11 hour',
    'team_to_client',
    (select id from public.contacts where email = 'shared-amazon-1@demo.local'),
    'Re: Urgent: ROAS drop in US campaigns',
    'We have a hypothesis and action plan.',
    'We have identified two likely causes and prepared a recovery plan. I am attaching the summary before the call.',
    true,
    array['INBOX', 'SENT'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-luna-001'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'demo-msg-luna-004',
    '<demo-msg-luna-004@demo.local>',
    date_trunc('day', now()) - interval '8 day' + interval '10 hour 30 minute',
    'client_to_team',
    (select id from public.contacts where email = 'lucia.luna@gmail.com'),
    'Re: Urgent: ROAS drop in US campaigns',
    'Please move faster, this is already affecting us.',
    'Please move faster, this is already affecting us and I need a recovery estimate before Friday.',
    false,
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-2@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-nord-001'),
    (select id from public.clients where slug = 'nord-pet'),
    'demo-msg-nord-001',
    '<demo-msg-nord-001@demo.local>',
    date_trunc('day', now()) - interval '6 day' + interval '9 hour 20 minute',
    'client_to_team',
    (select id from public.contacts where email = 'nordpet.consulting@gmail.com'),
    'Monthly update and next steps',
    'Great numbers this month.',
    'Great numbers this month. We would like to keep the current approach and test one new variation.',
    false,
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-2@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-nord-001'),
    (select id from public.clients where slug = 'nord-pet'),
    'demo-msg-nord-002',
    '<demo-msg-nord-002@demo.local>',
    date_trunc('day', now()) - interval '6 day' + interval '12 hour',
    'team_to_client',
    (select id from public.contacts where email = 'shared-amazon-2@demo.local'),
    'Re: Monthly update and next steps',
    'Thanks, we will keep momentum.',
    'Thanks Pablo. We will keep the current structure and prepare a proposal for the new variation.',
    false,
    array['INBOX', 'SENT'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-2@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-nord-001'),
    (select id from public.clients where slug = 'nord-pet'),
    'demo-msg-nord-003',
    '<demo-msg-nord-003@demo.local>',
    date_trunc('day', now()) - interval '5 day' + interval '10 hour 15 minute',
    'client_to_team',
    (select id from public.contacts where email = 'nordpet.consulting@gmail.com'),
    'Re: Monthly update and next steps',
    'Perfect, thanks team.',
    'Perfect, thanks team. Happy with the direction and the communication speed.',
    false,
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-2@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-nord-001'),
    (select id from public.clients where slug = 'nord-pet'),
    'demo-msg-nord-004',
    '<demo-msg-nord-004@demo.local>',
    date_trunc('day', now()) - interval '5 day' + interval '11 hour',
    'team_to_client',
    (select id from public.contacts where email = 'shared-amazon-2@demo.local'),
    'Re: Monthly update and next steps',
    'We will send the proposal tomorrow.',
    'We will send the proposal tomorrow and set up next month''s review.',
    false,
    array['INBOX', 'SENT'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-green-001'),
    (select id from public.clients where slug = 'green-kitchen'),
    'demo-msg-green-001',
    '<demo-msg-green-001@demo.local>',
    date_trunc('day', now()) - interval '7 day' + interval '16 hour',
    'team_to_client',
    (select id from public.contacts where email = 'shared-amazon-1@demo.local'),
    'Need revised ACOS target for April',
    'Can you confirm the new target?',
    'Hi Sara, can you confirm the new ACOS target for April before we lock next week''s plan?',
    false,
    array['INBOX', 'SENT'],
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.email_threads where provider_thread_id = 'demo-thread-green-001'),
    (select id from public.clients where slug = 'green-kitchen'),
    'demo-msg-green-002',
    '<demo-msg-green-002@demo.local>',
    date_trunc('day', now()) - interval '5 day' + interval '10 hour',
    'client_to_team',
    (select id from public.contacts where email = 'hello.greenkitchen@gmail.com'),
    'Re: Need revised ACOS target for April',
    'We need a lower target and more aggressive clean-up.',
    'We need a lower target and a more aggressive clean-up of low intent traffic. Let me know the revised plan.',
    false,
    array['INBOX'],
    '{"source":"demo-seed"}'::jsonb
  )
on conflict (mailbox_id, provider_message_id) do update
set
  thread_id = excluded.thread_id,
  client_id = excluded.client_id,
  sent_at = excluded.sent_at,
  direction = excluded.direction,
  sender_contact_id = excluded.sender_contact_id,
  subject = excluded.subject,
  snippet = excluded.snippet,
  body_text = excluded.body_text,
  has_attachments = excluded.has_attachments,
  labels = excluded.labels,
  raw_payload = excluded.raw_payload;

insert into public.email_message_participants (
  message_id,
  contact_id,
  participant_role,
  email,
  full_name
)
values
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-001'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'from', 'shared-amazon-1@demo.local', 'Shared Gmail 1'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-001'), (select id from public.contacts where email = 'lucia.luna@gmail.com'), 'to', 'lucia.luna@gmail.com', 'Lucia Gomez'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-002'), (select id from public.contacts where email = 'lucia.luna@gmail.com'), 'from', 'lucia.luna@gmail.com', 'Lucia Gomez'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-002'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'to', 'shared-amazon-1@demo.local', 'Shared Gmail 1'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-003'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'from', 'shared-amazon-1@demo.local', 'Shared Gmail 1'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-003'), (select id from public.contacts where email = 'lucia.luna@gmail.com'), 'to', 'lucia.luna@gmail.com', 'Lucia Gomez'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-004'), (select id from public.contacts where email = 'lucia.luna@gmail.com'), 'from', 'lucia.luna@gmail.com', 'Lucia Gomez'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-luna-004'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'to', 'shared-amazon-1@demo.local', 'Shared Gmail 1'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-001'), (select id from public.contacts where email = 'nordpet.consulting@gmail.com'), 'from', 'nordpet.consulting@gmail.com', 'Pablo Nord'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-001'), (select id from public.contacts where email = 'shared-amazon-2@demo.local'), 'to', 'shared-amazon-2@demo.local', 'Shared Gmail 2'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-002'), (select id from public.contacts where email = 'shared-amazon-2@demo.local'), 'from', 'shared-amazon-2@demo.local', 'Shared Gmail 2'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-002'), (select id from public.contacts where email = 'nordpet.consulting@gmail.com'), 'to', 'nordpet.consulting@gmail.com', 'Pablo Nord'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-003'), (select id from public.contacts where email = 'nordpet.consulting@gmail.com'), 'from', 'nordpet.consulting@gmail.com', 'Pablo Nord'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-003'), (select id from public.contacts where email = 'shared-amazon-2@demo.local'), 'to', 'shared-amazon-2@demo.local', 'Shared Gmail 2'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-004'), (select id from public.contacts where email = 'shared-amazon-2@demo.local'), 'from', 'shared-amazon-2@demo.local', 'Shared Gmail 2'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-nord-004'), (select id from public.contacts where email = 'nordpet.consulting@gmail.com'), 'to', 'nordpet.consulting@gmail.com', 'Pablo Nord'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-green-001'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'from', 'shared-amazon-1@demo.local', 'Shared Gmail 1'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-green-001'), (select id from public.contacts where email = 'hello.greenkitchen@gmail.com'), 'to', 'hello.greenkitchen@gmail.com', 'Sara Green'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-green-002'), (select id from public.contacts where email = 'hello.greenkitchen@gmail.com'), 'from', 'hello.greenkitchen@gmail.com', 'Sara Green'),
  ((select id from public.email_messages where provider_message_id = 'demo-msg-green-002'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'to', 'shared-amazon-1@demo.local', 'Shared Gmail 1')
on conflict (message_id, participant_role, email) do update
set
  contact_id = excluded.contact_id,
  full_name = excluded.full_name;

update public.email_threads t
set
  first_message_at = agg.first_message_at,
  last_message_at = agg.last_message_at,
  last_client_message_at = agg.last_client_message_at,
  last_team_message_at = agg.last_team_message_at,
  last_direction = agg.last_direction,
  message_count = agg.message_count,
  status = (
    case
      when agg.last_direction = 'client_to_team' then 'waiting_team'
      when agg.last_direction = 'team_to_client' then 'waiting_client'
      else 'open'
    end
  )::public.thread_status,
  updated_at = now()
from (
  select
    m.thread_id,
    min(m.sent_at) as first_message_at,
    max(m.sent_at) as last_message_at,
    max(m.sent_at) filter (where m.direction = 'client_to_team') as last_client_message_at,
    max(m.sent_at) filter (where m.direction = 'team_to_client') as last_team_message_at,
    (array_agg(m.direction order by m.sent_at desc))[1] as last_direction,
    count(*) as message_count
  from public.email_messages m
  where m.provider_message_id like 'demo-msg-%'
  group by m.thread_id
) agg
where t.id = agg.thread_id;

insert into public.meetings (
  mailbox_id,
  client_id,
  provider_event_id,
  calendar_id,
  title,
  description,
  start_at,
  end_at,
  timezone,
  meeting_url,
  status,
  attendee_count,
  raw_payload
)
values
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'demo-meeting-luna-001',
    'primary',
    'Luna Cosmetics weekly performance call',
    'Review ROAS drop, main blockers and recovery plan.',
    date_trunc('day', now()) - interval '7 day' + interval '11 hour',
    date_trunc('day', now()) - interval '7 day' + interval '12 hour',
    'Europe/Madrid',
    'https://meet.google.com/demo-luna',
    'confirmed',
    2,
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-2@demo.local'),
    (select id from public.clients where slug = 'nord-pet'),
    'demo-meeting-nord-001',
    'primary',
    'Nord Pet monthly review',
    'Monthly review and upcoming test plan.',
    date_trunc('day', now()) - interval '14 day' + interval '10 hour',
    date_trunc('day', now()) - interval '14 day' + interval '11 hour',
    'Europe/Madrid',
    'https://meet.google.com/demo-nord',
    'confirmed',
    2,
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.mailboxes where email = 'shared-amazon-1@demo.local'),
    (select id from public.clients where slug = 'green-kitchen'),
    'demo-meeting-green-001',
    'primary',
    'Green Kitchen April planning',
    'Discuss ACOS target and channel clean-up.',
    date_trunc('day', now()) - interval '4 day' + interval '17 hour',
    date_trunc('day', now()) - interval '4 day' + interval '18 hour',
    'Europe/Madrid',
    'https://meet.google.com/demo-green',
    'confirmed',
    2,
    '{"source":"demo-seed"}'::jsonb
  )
on conflict (mailbox_id, calendar_id, provider_event_id) do update
set
  client_id = excluded.client_id,
  title = excluded.title,
  description = excluded.description,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  timezone = excluded.timezone,
  meeting_url = excluded.meeting_url,
  status = excluded.status,
  attendee_count = excluded.attendee_count,
  raw_payload = excluded.raw_payload,
  updated_at = now();

insert into public.meeting_attendees (
  meeting_id,
  contact_id,
  email,
  full_name,
  response_status,
  is_organizer
)
values
  ((select id from public.meetings where provider_event_id = 'demo-meeting-luna-001'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'shared-amazon-1@demo.local', 'Shared Gmail 1', 'accepted', true),
  ((select id from public.meetings where provider_event_id = 'demo-meeting-luna-001'), (select id from public.contacts where email = 'lucia.luna@gmail.com'), 'lucia.luna@gmail.com', 'Lucia Gomez', 'accepted', false),
  ((select id from public.meetings where provider_event_id = 'demo-meeting-nord-001'), (select id from public.contacts where email = 'shared-amazon-2@demo.local'), 'shared-amazon-2@demo.local', 'Shared Gmail 2', 'accepted', true),
  ((select id from public.meetings where provider_event_id = 'demo-meeting-nord-001'), (select id from public.contacts where email = 'nordpet.consulting@gmail.com'), 'nordpet.consulting@gmail.com', 'Pablo Nord', 'accepted', false),
  ((select id from public.meetings where provider_event_id = 'demo-meeting-green-001'), (select id from public.contacts where email = 'shared-amazon-1@demo.local'), 'shared-amazon-1@demo.local', 'Shared Gmail 1', 'accepted', true),
  ((select id from public.meetings where provider_event_id = 'demo-meeting-green-001'), (select id from public.contacts where email = 'hello.greenkitchen@gmail.com'), 'hello.greenkitchen@gmail.com', 'Sara Green', 'accepted', false)
on conflict (meeting_id, email) do update
set
  contact_id = excluded.contact_id,
  full_name = excluded.full_name,
  response_status = excluded.response_status,
  is_organizer = excluded.is_organizer;

insert into public.transcripts (
  meeting_id,
  client_id,
  source_type,
  drive_file_id,
  file_name,
  document_url,
  transcript_at,
  language_code,
  content_text,
  content_hash,
  raw_payload
)
values
  (
    (select id from public.meetings where provider_event_id = 'demo-meeting-luna-001'),
    (select id from public.clients where slug = 'luna-cosmetics'),
    'google_doc',
    'demo-drive-luna-001',
    '2026-03-17__LunaCosmetics__WeeklyPerformanceCall',
    'https://docs.google.com/document/d/demo-drive-luna-001/edit',
    date_trunc('day', now()) - interval '7 day' + interval '12 hour 15 minute',
    'ca',
    'Resum: el client mostra preocupacio per la caiguda de ROAS. Decisions: reduir pressupost a keyword no rendibles, revisar estructura Sponsored Brands i enviar previsio de recuperacio abans de divendres. Risc: si no millora la propera setmana, el client podria reduir inversio.',
    'demo-hash-luna-001',
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.meetings where provider_event_id = 'demo-meeting-nord-001'),
    (select id from public.clients where slug = 'nord-pet'),
    'google_doc',
    'demo-drive-nord-001',
    '2026-03-10__NordPet__MonthlyReview',
    'https://docs.google.com/document/d/demo-drive-nord-001/edit',
    date_trunc('day', now()) - interval '14 day' + interval '11 hour 10 minute',
    'ca',
    'Resum: el client esta satisfet amb el rendiment. Decisions: mantenir estructura actual i provar una nova creativitat. Accio: enviar proposta de test abans de dijous.',
    'demo-hash-nord-001',
    '{"source":"demo-seed"}'::jsonb
  ),
  (
    (select id from public.meetings where provider_event_id = 'demo-meeting-green-001'),
    (select id from public.clients where slug = 'green-kitchen'),
    'google_doc',
    'demo-drive-green-001',
    '2026-03-20__GreenKitchen__AprilPlanning',
    'https://docs.google.com/document/d/demo-drive-green-001/edit',
    date_trunc('day', now()) - interval '4 day' + interval '18 hour 10 minute',
    'ca',
    'Resum: el client demana baixar ACOS i fer una neteja agressiva de trafic poc qualificat. Accions: redefinir objectius i compartir pla revisat. Punt obert: validacio final del nou target.',
    'demo-hash-green-001',
    '{"source":"demo-seed"}'::jsonb
  )
on conflict (source_type, drive_file_id) do update
set
  meeting_id = excluded.meeting_id,
  client_id = excluded.client_id,
  file_name = excluded.file_name,
  document_url = excluded.document_url,
  transcript_at = excluded.transcript_at,
  language_code = excluded.language_code,
  content_text = excluded.content_text,
  content_hash = excluded.content_hash,
  raw_payload = excluded.raw_payload,
  updated_at = now();

insert into public.ai_insights (
  entity_type,
  entity_id,
  client_id,
  model_name,
  prompt_version,
  sentiment_label,
  sentiment_score,
  urgency_score,
  complaint_flag,
  satisfaction_flag,
  needs_follow_up,
  summary,
  topics,
  risks,
  action_suggestions,
  raw_output
)
select
  'email_message',
  m.id,
  c.id,
  'demo-seed-v1',
  'seed-v1',
  'negative',
  -0.72,
  0.84,
  true,
  false,
  true,
  'Client preocupat per la caiguda de rendiment i exigint pla de recuperacio.',
  '["roas_drop","urgency"]'::jsonb,
  '["budget_reduction_risk"]'::jsonb,
  '["send_recovery_plan","confirm_eta"]'::jsonb,
  '{"source":"demo-seed"}'::jsonb
from public.email_messages m
join public.clients c on c.slug = 'luna-cosmetics'
where m.provider_message_id = 'demo-msg-luna-004'
  and not exists (
    select 1
    from public.ai_insights ai
    where ai.entity_type = 'email_message'
      and ai.entity_id = m.id
      and ai.model_name = 'demo-seed-v1'
  );

insert into public.ai_insights (
  entity_type,
  entity_id,
  client_id,
  model_name,
  prompt_version,
  sentiment_label,
  sentiment_score,
  urgency_score,
  complaint_flag,
  satisfaction_flag,
  needs_follow_up,
  summary,
  topics,
  risks,
  action_suggestions,
  raw_output
)
select
  'transcript',
  t.id,
  c.id,
  'demo-seed-v1',
  'seed-v1',
  'negative',
  -0.61,
  0.76,
  true,
  false,
  true,
  'La reunió confirma preocupació pel rendiment i risc de reducció d''inversió.',
  '["meeting_summary","performance_issue"]'::jsonb,
  '["client_churn_risk"]'::jsonb,
  '["share_projection","review_low_intent_keywords"]'::jsonb,
  '{"source":"demo-seed"}'::jsonb
from public.transcripts t
join public.clients c on c.slug = 'luna-cosmetics'
where t.drive_file_id = 'demo-drive-luna-001'
  and not exists (
    select 1
    from public.ai_insights ai
    where ai.entity_type = 'transcript'
      and ai.entity_id = t.id
      and ai.model_name = 'demo-seed-v1'
  );

insert into public.ai_insights (
  entity_type,
  entity_id,
  client_id,
  model_name,
  prompt_version,
  sentiment_label,
  sentiment_score,
  urgency_score,
  complaint_flag,
  satisfaction_flag,
  needs_follow_up,
  summary,
  topics,
  risks,
  action_suggestions,
  raw_output
)
select
  'email_message',
  m.id,
  c.id,
  'demo-seed-v1',
  'seed-v1',
  'positive',
  0.81,
  0.25,
  false,
  true,
  false,
  'Client satisfet amb els resultats i amb la velocitat de comunicació.',
  '["good_results","client_happiness"]'::jsonb,
  '[]'::jsonb,
  '["prepare_test_proposal"]'::jsonb,
  '{"source":"demo-seed"}'::jsonb
from public.email_messages m
join public.clients c on c.slug = 'nord-pet'
where m.provider_message_id = 'demo-msg-nord-003'
  and not exists (
    select 1
    from public.ai_insights ai
    where ai.entity_type = 'email_message'
      and ai.entity_id = m.id
      and ai.model_name = 'demo-seed-v1'
  );

insert into public.action_items (
  client_id,
  source_entity_type,
  source_entity_id,
  meeting_id,
  owner_team_member_id,
  title,
  details,
  due_at,
  status,
  priority
)
select
  c.id,
  'transcript',
  t.id,
  t.meeting_id,
  tm.id,
  'Enviar previsio de recuperacio a Luna Cosmetics',
  'Compartir pla de recuperacio i ETA abans de divendres.',
  date_trunc('day', now()) - interval '3 day' + interval '17 hour',
  'open',
  'high'
from public.clients c
join public.transcripts t on t.client_id = c.id and t.drive_file_id = 'demo-drive-luna-001'
join public.team_members tm on tm.email = 'anna.serra@demo.local'
where c.slug = 'luna-cosmetics'
  and not exists (
    select 1
    from public.action_items ai
    where ai.source_entity_type = 'transcript'
      and ai.source_entity_id = t.id
      and ai.title = 'Enviar previsio de recuperacio a Luna Cosmetics'
  );

insert into public.action_items (
  client_id,
  source_entity_type,
  source_entity_id,
  meeting_id,
  owner_team_member_id,
  title,
  details,
  due_at,
  status,
  priority
)
select
  c.id,
  'transcript',
  t.id,
  t.meeting_id,
  tm.id,
  'Enviar proposta de test a Nord Pet',
  'Enviar proposta de nova creativitat i següent review.',
  date_trunc('day', now()) - interval '12 day' + interval '17 hour',
  'done',
  'medium'
from public.clients c
join public.transcripts t on t.client_id = c.id and t.drive_file_id = 'demo-drive-nord-001'
join public.team_members tm on tm.email = 'marc.puig@demo.local'
where c.slug = 'nord-pet'
  and not exists (
    select 1
    from public.action_items ai
    where ai.source_entity_type = 'transcript'
      and ai.source_entity_id = t.id
      and ai.title = 'Enviar proposta de test a Nord Pet'
  );
