create or replace view public.v_thread_response_events as
with ordered_messages as (
  select
    m.id,
    m.thread_id,
    m.client_id,
    m.sent_at,
    m.direction
  from public.email_messages m
  where m.direction in ('team_to_client', 'client_to_team')
)
select
  origin.id as origin_message_id,
  origin.thread_id,
  origin.client_id,
  origin.direction as origin_direction,
  case
    when origin.direction = 'team_to_client' then 'client_response'
    when origin.direction = 'client_to_team' then 'team_response'
  end as response_type,
  origin.sent_at as origin_sent_at,
  reply.id as reply_message_id,
  reply.sent_at as reply_sent_at,
  case
    when reply.sent_at is null then null
    else round((extract(epoch from (reply.sent_at - origin.sent_at)) / 3600.0)::numeric, 2)
  end as response_hours
from ordered_messages origin
left join lateral (
  select
    m2.id,
    m2.sent_at
  from ordered_messages m2
  where m2.thread_id = origin.thread_id
    and m2.sent_at > origin.sent_at
    and (
      (origin.direction = 'team_to_client' and m2.direction = 'client_to_team')
      or
      (origin.direction = 'client_to_team' and m2.direction = 'team_to_client')
    )
  order by m2.sent_at
  limit 1
) reply on true;

create or replace view public.v_client_kpis_30d as
with date_window as (
  select now() - interval '30 day' as start_at
),
email_volume as (
  select
    m.client_id,
    count(*) filter (where m.direction = 'team_to_client') as emails_sent_30d,
    count(*) filter (where m.direction = 'client_to_team') as emails_received_30d
  from public.email_messages m
  join date_window dw on m.sent_at >= dw.start_at
  where m.client_id is not null
  group by m.client_id
),
response_stats as (
  select
    r.client_id,
    avg(r.response_hours) filter (
      where r.response_type = 'client_response'
        and r.reply_message_id is not null
    ) as avg_client_response_hours_30d,
    avg(r.response_hours) filter (
      where r.response_type = 'team_response'
        and r.reply_message_id is not null
    ) as avg_team_response_hours_30d
  from public.v_thread_response_events r
  join date_window dw on r.origin_sent_at >= dw.start_at
  where r.client_id is not null
  group by r.client_id
),
stalled_threads as (
  select
    t.client_id,
    count(*) as stalled_threads_gt_72h
  from public.email_threads t
  where t.client_id is not null
    and t.status <> 'closed'
    and t.last_message_at < now() - interval '72 hour'
  group by t.client_id
),
meeting_stats as (
  select
    m.client_id,
    count(*) as meetings_30d,
    avg(extract(epoch from (m.end_at - m.start_at)) / 60.0) as avg_meeting_minutes_30d
  from public.meetings m
  join date_window dw on m.start_at >= dw.start_at
  where m.client_id is not null
  group by m.client_id
),
signal_stats as (
  select
    ai.client_id,
    count(*) filter (
      where ai.complaint_flag
         or ai.sentiment_label = 'negative'
    ) as negative_signals_30d,
    count(*) filter (
      where ai.satisfaction_flag
         or ai.sentiment_label = 'positive'
    ) as positive_signals_30d
  from public.ai_insights ai
  join date_window dw on ai.analyzed_at >= dw.start_at
  where ai.client_id is not null
  group by ai.client_id
),
action_stats as (
  select
    a.client_id,
    count(*) filter (where a.status in ('open', 'in_progress')) as open_actions,
    count(*) filter (
      where a.due_at is not null
        and a.due_at < now()
        and a.status <> 'done'
    ) as overdue_actions
  from public.action_items a
  where a.client_id is not null
  group by a.client_id
)
select
  c.id as client_id,
  c.name as client_name,
  c.status as client_status,
  coalesce(ev.emails_sent_30d, 0) as emails_sent_30d,
  coalesce(ev.emails_received_30d, 0) as emails_received_30d,
  round(coalesce(rs.avg_client_response_hours_30d, 0)::numeric, 2) as avg_client_response_hours_30d,
  round(coalesce(rs.avg_team_response_hours_30d, 0)::numeric, 2) as avg_team_response_hours_30d,
  coalesce(st.stalled_threads_gt_72h, 0) as stalled_threads_gt_72h,
  coalesce(ms.meetings_30d, 0) as meetings_30d,
  round(coalesce(ms.avg_meeting_minutes_30d, 0)::numeric, 2) as avg_meeting_minutes_30d,
  coalesce(ss.negative_signals_30d, 0) as negative_signals_30d,
  coalesce(ss.positive_signals_30d, 0) as positive_signals_30d,
  coalesce(ac.open_actions, 0) as open_actions,
  coalesce(ac.overdue_actions, 0) as overdue_actions,
  (
    coalesce(ss.negative_signals_30d, 0) * 3
    + coalesce(ac.overdue_actions, 0) * 2
    + coalesce(st.stalled_threads_gt_72h, 0)
  ) as risk_score_heuristic
from public.clients c
left join email_volume ev on ev.client_id = c.id
left join response_stats rs on rs.client_id = c.id
left join stalled_threads st on st.client_id = c.id
left join meeting_stats ms on ms.client_id = c.id
left join signal_stats ss on ss.client_id = c.id
left join action_stats ac on ac.client_id = c.id
where c.status != 'inactive';

create or replace view public.v_client_activity_timeline as
select
  m.client_id,
  m.sent_at as event_at,
  'email'::text as event_type,
  m.id as source_id,
  coalesce(m.subject, '(sense assumpte)') as title,
  coalesce(m.snippet, left(m.body_text, 200), '') as preview,
  jsonb_build_object(
    'direction', m.direction,
    'thread_id', m.thread_id
  ) as metadata
from public.email_messages m
where m.client_id is not null

union all

select
  mt.client_id,
  mt.start_at as event_at,
  'meeting'::text as event_type,
  mt.id as source_id,
  mt.title,
  coalesce(left(mt.description, 200), '') as preview,
  jsonb_build_object(
    'meeting_url', mt.meeting_url,
    'status', mt.status
  ) as metadata
from public.meetings mt
where mt.client_id is not null

union all

select
  t.client_id,
  coalesce(t.transcript_at, t.created_at) as event_at,
  'transcript'::text as event_type,
  t.id as source_id,
  coalesce(t.file_name, 'Transcript') as title,
  left(t.content_text, 200) as preview,
  jsonb_build_object(
    'meeting_id', t.meeting_id,
    'source_type', t.source_type
  ) as metadata
from public.transcripts t
where t.client_id is not null

union all

select
  a.client_id,
  a.created_at as event_at,
  'action_item'::text as event_type,
  a.id as source_id,
  a.title,
  coalesce(a.details, '') as preview,
  jsonb_build_object(
    'status', a.status,
    'priority', a.priority,
    'due_at', a.due_at
  ) as metadata
from public.action_items a
where a.client_id is not null;
