create table if not exists public.business_rules (
  id integer primary key default 1 check (id = 1),
  timezone text not null default 'Europe/Madrid',
  workday_start time not null default '09:00',
  workday_end time not null default '19:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.business_rules (
  id,
  timezone,
  workday_start,
  workday_end
)
values (
  1,
  'Europe/Madrid',
  '09:00',
  '19:00'
)
on conflict (id) do update
set
  timezone = excluded.timezone,
  workday_start = excluded.workday_start,
  workday_end = excluded.workday_end,
  updated_at = now();

create table if not exists public.business_holidays (
  holiday_date date primary key,
  name text not null,
  region text not null default 'default',
  created_at timestamptz not null default now()
);

drop trigger if exists set_updated_at_business_rules on public.business_rules;
create trigger set_updated_at_business_rules
before update on public.business_rules
for each row execute function public.set_updated_at();

create or replace function public.business_hours_between(
  start_ts timestamptz,
  end_ts timestamptz
)
returns numeric
language plpgsql
stable
as $$
declare
  cfg record;
  local_start timestamp;
  local_end timestamp;
  current_day date;
  final_day date;
  day_start timestamp;
  day_end timestamp;
  total_interval interval := interval '0';
begin
  if start_ts is null or end_ts is null or end_ts <= start_ts then
    return 0;
  end if;

  select
    br.timezone,
    br.workday_start,
    br.workday_end
  into cfg
  from public.business_rules br
  where br.id = 1;

  if cfg is null then
    cfg.timezone := 'Europe/Madrid';
    cfg.workday_start := '09:00'::time;
    cfg.workday_end := '19:00'::time;
  end if;

  local_start := start_ts at time zone cfg.timezone;
  local_end := end_ts at time zone cfg.timezone;
  current_day := local_start::date;
  final_day := local_end::date;

  while current_day <= final_day loop
    if extract(isodow from current_day) between 1 and 5
      and not exists (
        select 1
        from public.business_holidays bh
        where bh.holiday_date = current_day
      ) then
      day_start := current_day + cfg.workday_start;
      day_end := current_day + cfg.workday_end;

      total_interval := total_interval + greatest(
        least(local_end, day_end) - greatest(local_start, day_start),
        interval '0'
      );
    end if;

    current_day := current_day + 1;
  end loop;

  return round((extract(epoch from total_interval) / 3600.0)::numeric, 2);
end;
$$;
