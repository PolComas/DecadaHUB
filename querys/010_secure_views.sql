alter view public.v_thread_response_events set (security_invoker = true);
alter view public.v_client_kpis_30d set (security_invoker = true);
alter view public.v_client_activity_timeline set (security_invoker = true);

grant select on public.v_thread_response_events to authenticated;
grant select on public.v_client_kpis_30d to authenticated;
grant select on public.v_client_activity_timeline to authenticated;
