alter table public.waitlist_leads
add column if not exists offer_id text,
add column if not exists offer_type text,
add column if not exists price_cents integer,
add column if not exists currency text not null default 'AUD',
add column if not exists fbclid text,
add column if not exists path text,
add column if not exists referrer text,
add column if not exists device_type text;

create index if not exists waitlist_leads_offer_type_idx on public.waitlist_leads (offer_type);
create index if not exists waitlist_leads_source_slug_idx on public.waitlist_leads (source_slug);
