alter table public.event_logs
add column if not exists fbclid text;

create index if not exists event_logs_fbclid_idx on public.event_logs (fbclid);
