create extension if not exists pgcrypto;

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.landing_page_tests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft',
  internal_name text not null,
  headline text not null,
  subheadline text,
  offer_type text,
  price_cents integer,
  currency text not null default 'AUD',
  price_display text,
  category_focus text,
  cta_primary text,
  cta_secondary text,
  modal_headline text,
  modal_body text,
  waitlist_cta text,
  hero_image_url text,
  config_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  first_name text,
  source_landing_page_id uuid references public.landing_page_tests(id),
  source_slug text,
  anonymous_id text,
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  budget_range text,
  buyer_seller_intent text,
  likelihood_to_buy text,
  consent_marketing boolean not null default false,
  consent_marketing_at timestamptz,
  privacy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_preferences (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.waitlist_leads(id) on delete cascade,
  preference_type text not null,
  preference_value text not null,
  created_at timestamptz not null default now()
);

create table public.event_logs (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  anonymous_id text,
  session_id text,
  lead_id uuid references public.waitlist_leads(id),
  landing_page_id uuid references public.landing_page_tests(id),
  landing_slug text,
  offer_id text,
  offer_type text,
  price_cents integer,
  currency text default 'AUD',
  path text,
  url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  device_type text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  anonymous_id text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  entry_path text,
  landing_page_id uuid references public.landing_page_tests(id),
  landing_slug text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  device_type text,
  created_at timestamptz not null default now()
);

create table public.export_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_profiles(id),
  export_type text not null,
  filters_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists landing_page_tests_slug_idx on public.landing_page_tests (slug);
create index if not exists landing_page_tests_status_idx on public.landing_page_tests (status);

create index if not exists waitlist_leads_email_idx on public.waitlist_leads (email);
create unique index if not exists waitlist_leads_email_normalized_unique on public.waitlist_leads (email_normalized);
create index if not exists waitlist_leads_source_landing_page_id_idx on public.waitlist_leads (source_landing_page_id);
create index if not exists waitlist_leads_created_at_idx on public.waitlist_leads (created_at);

create index if not exists event_logs_event_name_idx on public.event_logs (event_name);
create index if not exists event_logs_landing_page_id_idx on public.event_logs (landing_page_id);
create index if not exists event_logs_landing_slug_idx on public.event_logs (landing_slug);
create index if not exists event_logs_session_id_idx on public.event_logs (session_id);
create index if not exists event_logs_anonymous_id_idx on public.event_logs (anonymous_id);
create index if not exists event_logs_created_at_idx on public.event_logs (created_at);
create index if not exists event_logs_utm_source_idx on public.event_logs (utm_source);
create index if not exists event_logs_utm_campaign_idx on public.event_logs (utm_campaign);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger landing_page_tests_set_updated_at
before update on public.landing_page_tests
for each row
execute function public.set_updated_at();

create trigger waitlist_leads_set_updated_at
before update on public.waitlist_leads
for each row
execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.landing_page_tests enable row level security;
alter table public.waitlist_leads enable row level security;
alter table public.lead_preferences enable row level security;
alter table public.event_logs enable row level security;
alter table public.visitor_sessions enable row level security;
alter table public.export_logs enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

grant usage on schema public to authenticated;
grant select on public.admin_profiles to authenticated;
grant select on public.landing_page_tests to authenticated;
grant select on public.waitlist_leads to authenticated;
grant select on public.lead_preferences to authenticated;
grant select on public.event_logs to authenticated;
grant select on public.visitor_sessions to authenticated;
grant select on public.export_logs to authenticated;

grant all on public.admin_profiles to service_role;
grant all on public.landing_page_tests to service_role;
grant all on public.waitlist_leads to service_role;
grant all on public.lead_preferences to service_role;
grant all on public.event_logs to service_role;
grant all on public.visitor_sessions to service_role;
grant all on public.export_logs to service_role;

create policy "Admins can read admin profiles"
on public.admin_profiles
for select
to authenticated
using (public.is_admin());

create policy "Admins can read landing page tests"
on public.landing_page_tests
for select
to authenticated
using (public.is_admin());

create policy "Admins can read waitlist leads"
on public.waitlist_leads
for select
to authenticated
using (public.is_admin());

create policy "Admins can read lead preferences"
on public.lead_preferences
for select
to authenticated
using (public.is_admin());

create policy "Admins can read event logs"
on public.event_logs
for select
to authenticated
using (public.is_admin());

create policy "Admins can read visitor sessions"
on public.visitor_sessions
for select
to authenticated
using (public.is_admin());

create policy "Admins can read export logs"
on public.export_logs
for select
to authenticated
using (public.is_admin());

comment on table public.waitlist_leads is
  'Waitlist lead writes are intentionally server-only. No anon or authenticated insert policy exists.';

comment on table public.event_logs is
  'Raw event writes are intentionally server-only. No anon or authenticated insert policy exists.';
