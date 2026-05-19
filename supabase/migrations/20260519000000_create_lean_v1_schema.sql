create table public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  email_normalized text not null,
  display_name text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.promo_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft',
  name text not null,
  short_name text,
  prize_title text not null,
  prize_description text,
  prize_value_cents integer,
  currency text not null default 'AUD',
  entry_limit integer,
  starts_at timestamptz,
  closes_at timestamptz,
  entries_close_at timestamptz,
  draw_lock_at timestamptz,
  draw_at timestamptz,
  rules_url text,
  terms_version text,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_campaigns_status_check check (status in ('draft', 'live', 'paused', 'closed', 'locked', 'drawn', 'archived')),
  constraint promo_campaigns_prize_value_cents_check check (prize_value_cents is null or prize_value_cents >= 0),
  constraint promo_campaigns_entry_limit_check check (entry_limit is null or entry_limit > 0)
);

create table public.commerce_offers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'active',
  name text not null,
  offer_type text not null,
  stripe_price_id text,
  unit_price_cents integer not null,
  currency text not null default 'AUD',
  access_duration_hours integer,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_offers_status_check check (status in ('draft', 'active', 'paused', 'archived')),
  constraint commerce_offers_unit_price_cents_check check (unit_price_cents >= 0),
  constraint commerce_offers_access_duration_hours_check check (access_duration_hours is null or access_duration_hours > 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid references public.member_profiles(id),
  purchaser_email text,
  purchaser_email_normalized text,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending',
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'AUD',
  source_landing_page_id uuid references public.landing_page_tests(id),
  source_slug text,
  anonymous_id text,
  session_id text,
  attribution_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  constraint orders_status_check check (status in ('pending', 'paid', 'fulfilled', 'payment_failed', 'cancelled', 'refunded')),
  constraint orders_subtotal_cents_check check (subtotal_cents >= 0),
  constraint orders_total_cents_check check (total_cents >= 0)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  offer_id uuid references public.commerce_offers(id),
  campaign_id uuid references public.promo_campaigns(id),
  item_type text not null,
  quantity integer not null,
  unit_price_cents integer not null,
  total_price_cents integer not null,
  currency text not null default 'AUD',
  created_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_unit_price_cents_check check (unit_price_cents >= 0),
  constraint order_items_total_price_cents_check check (total_price_cents >= 0)
);

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  member_profile_id uuid references public.member_profiles(id),
  order_id uuid references public.orders(id),
  order_item_id uuid references public.order_items(id),
  daypass_code_id uuid,
  access_type text not null,
  status text not null default 'pending_activation',
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint access_grants_access_type_check check (access_type in ('daypass', 'ultra', 'admin_comp', 'manual_comp')),
  constraint access_grants_status_check check (status in ('pending_activation', 'active', 'expired', 'revoked')),
  constraint access_grants_activation_check check (
    status <> 'active'
    or (starts_at is not null and expires_at is not null and expires_at > starts_at)
  )
);

create table public.daypass_codes (
  id uuid primary key default gen_random_uuid(),
  purchaser_member_profile_id uuid references public.member_profiles(id),
  purchaser_email_normalized text not null,
  order_id uuid references public.orders(id),
  order_item_id uuid references public.order_items(id),
  campaign_id uuid references public.promo_campaigns(id),
  code_hash text unique not null,
  code_last4 text not null,
  encrypted_code text,
  encryption_key_version text,
  status text not null default 'available',
  redeemed_by_member_profile_id uuid references public.member_profiles(id),
  redeemed_at timestamptz,
  access_grant_id uuid references public.access_grants(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint daypass_codes_status_check check (status in ('available', 'redeemed', 'expired', 'revoked')),
  constraint daypass_codes_last4_check check (char_length(code_last4) = 4)
);

alter table public.access_grants
add constraint access_grants_daypass_code_id_fkey
foreign key (daypass_code_id) references public.daypass_codes(id);

create table public.promo_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns(id),
  order_id uuid references public.orders(id),
  order_item_id uuid references public.order_items(id),
  daypass_code_id uuid references public.daypass_codes(id),
  entry_number integer not null,
  owner_member_profile_id uuid references public.member_profiles(id),
  owner_email_normalized text not null,
  current_holder_member_profile_id uuid references public.member_profiles(id),
  referrer_member_profile_id uuid references public.member_profiles(id),
  display_alias text not null,
  status text not null default 'active',
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint promo_entries_status_check check (status in ('active', 'cancelled', 'refunded', 'void', 'winner', 'disqualified')),
  constraint promo_entries_entry_number_check check (entry_number > 0),
  unique (campaign_id, entry_number)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft',
  title text not null,
  brand text,
  deck_year integer,
  era text,
  condition_label text,
  price_cents integer,
  currency text not null default 'AUD',
  location_region text,
  is_featured boolean not null default false,
  is_member_only boolean not null default true,
  primary_image_url text,
  facts_json jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_status_check check (status in ('draft', 'live', 'paused', 'archived')),
  constraint listings_deck_year_check check (deck_year is null or deck_year > 0),
  constraint listings_price_cents_check check (price_cents is null or price_cents >= 0)
);

create table public.draw_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns(id),
  entry_count integer not null,
  csv_sha256 text not null,
  created_by uuid references public.admin_profiles(id),
  created_at timestamptz not null default now(),
  notes text,
  constraint draw_snapshots_entry_count_check check (entry_count >= 0)
);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promo_campaigns(id),
  draw_snapshot_id uuid references public.draw_snapshots(id),
  winning_entry_id uuid references public.promo_entries(id),
  winning_entry_number integer not null,
  draw_method text not null,
  public_notes text,
  internal_notes text,
  created_by uuid references public.admin_profiles(id),
  created_at timestamptz not null default now(),
  constraint draw_results_winning_entry_number_check check (winning_entry_number > 0)
);

create table public.outbound_emails (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_message_id text,
  recipient_email text not null,
  template_key text not null,
  idempotency_key text unique not null,
  related_order_id uuid references public.orders(id),
  related_campaign_id uuid references public.promo_campaigns(id),
  status text not null default 'queued',
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint outbound_emails_status_check check (status in ('queued', 'sent', 'failed', 'skipped'))
);

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  stripe_checkout_session_id text,
  processing_status text not null default 'received',
  related_order_id uuid references public.orders(id),
  payload_json jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint stripe_webhook_events_processing_status_check check (
    processing_status in ('received', 'processing', 'processed', 'ignored', 'failed')
  )
);

create table public.promo_campaign_entry_counters (
  campaign_id uuid primary key references public.promo_campaigns(id) on delete cascade,
  last_entry_number integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint promo_campaign_entry_counters_last_entry_number_check check (last_entry_number >= 0)
);

create index if not exists member_profiles_email_normalized_idx on public.member_profiles (email_normalized);

create index if not exists promo_campaigns_status_idx on public.promo_campaigns (status);
create index if not exists promo_campaigns_entries_close_at_idx on public.promo_campaigns (entries_close_at);
create index if not exists promo_campaigns_draw_lock_at_idx on public.promo_campaigns (draw_lock_at);
create index if not exists promo_campaigns_draw_at_idx on public.promo_campaigns (draw_at);

create index if not exists commerce_offers_status_idx on public.commerce_offers (status);

create index if not exists orders_purchaser_email_normalized_idx on public.orders (purchaser_email_normalized);
create index if not exists orders_member_profile_id_idx on public.orders (member_profile_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_offer_id_idx on public.order_items (offer_id);
create index if not exists order_items_campaign_id_idx on public.order_items (campaign_id);

create index if not exists access_grants_member_profile_id_idx on public.access_grants (member_profile_id);
create index if not exists access_grants_order_id_idx on public.access_grants (order_id);
create index if not exists access_grants_daypass_code_id_idx on public.access_grants (daypass_code_id);
create index if not exists access_grants_status_idx on public.access_grants (status);
create index if not exists access_grants_expires_at_idx on public.access_grants (expires_at);

create index if not exists daypass_codes_status_idx on public.daypass_codes (status);
create index if not exists daypass_codes_order_id_idx on public.daypass_codes (order_id);
create index if not exists daypass_codes_campaign_id_idx on public.daypass_codes (campaign_id);
create index if not exists daypass_codes_purchaser_member_profile_id_idx on public.daypass_codes (purchaser_member_profile_id);
create index if not exists daypass_codes_redeemed_by_member_profile_id_idx on public.daypass_codes (redeemed_by_member_profile_id);

create index if not exists promo_entries_campaign_id_idx on public.promo_entries (campaign_id);
create index if not exists promo_entries_entry_number_idx on public.promo_entries (entry_number);
create index if not exists promo_entries_owner_member_profile_id_idx on public.promo_entries (owner_member_profile_id);
create index if not exists promo_entries_current_holder_member_profile_id_idx on public.promo_entries (current_holder_member_profile_id);
create index if not exists promo_entries_status_idx on public.promo_entries (status);
create index if not exists promo_entries_locked_at_idx on public.promo_entries (locked_at);
create index if not exists promo_entries_daypass_code_id_idx on public.promo_entries (daypass_code_id);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_brand_idx on public.listings (brand);
create index if not exists listings_era_idx on public.listings (era);
create index if not exists listings_sort_order_idx on public.listings (sort_order);
create index if not exists listings_status_sort_order_idx on public.listings (status, sort_order);

create index if not exists draw_snapshots_campaign_id_idx on public.draw_snapshots (campaign_id);
create index if not exists draw_results_campaign_id_idx on public.draw_results (campaign_id);
create index if not exists draw_results_winning_entry_id_idx on public.draw_results (winning_entry_id);

create index if not exists outbound_emails_related_order_id_idx on public.outbound_emails (related_order_id);
create index if not exists outbound_emails_status_idx on public.outbound_emails (status);

create index if not exists stripe_webhook_events_stripe_checkout_session_id_idx
on public.stripe_webhook_events (stripe_checkout_session_id);
create index if not exists stripe_webhook_events_processing_status_idx on public.stripe_webhook_events (processing_status);

create trigger member_profiles_set_updated_at
before update on public.member_profiles
for each row
execute function public.set_updated_at();

create trigger promo_campaigns_set_updated_at
before update on public.promo_campaigns
for each row
execute function public.set_updated_at();

create trigger commerce_offers_set_updated_at
before update on public.commerce_offers
for each row
execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create trigger listings_set_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

create trigger promo_campaign_entry_counters_set_updated_at
before update on public.promo_campaign_entry_counters
for each row
execute function public.set_updated_at();

alter table public.member_profiles enable row level security;
alter table public.promo_campaigns enable row level security;
alter table public.commerce_offers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.access_grants enable row level security;
alter table public.daypass_codes enable row level security;
alter table public.promo_entries enable row level security;
alter table public.listings enable row level security;
alter table public.draw_snapshots enable row level security;
alter table public.draw_results enable row level security;
alter table public.outbound_emails enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.promo_campaign_entry_counters enable row level security;

revoke all on public.member_profiles from anon, authenticated;
revoke all on public.promo_campaigns from anon, authenticated;
revoke all on public.commerce_offers from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on public.access_grants from anon, authenticated;
revoke all on public.daypass_codes from anon, authenticated;
revoke all on public.promo_entries from anon, authenticated;
revoke all on public.listings from anon, authenticated;
revoke all on public.draw_snapshots from anon, authenticated;
revoke all on public.draw_results from anon, authenticated;
revoke all on public.outbound_emails from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;
revoke all on public.promo_campaign_entry_counters from anon, authenticated;

grant select on public.member_profiles to authenticated;
grant select on public.promo_campaigns to authenticated;
grant select on public.commerce_offers to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.access_grants to authenticated;
grant select (
  id,
  purchaser_member_profile_id,
  purchaser_email_normalized,
  order_id,
  order_item_id,
  campaign_id,
  code_last4,
  status,
  redeemed_by_member_profile_id,
  redeemed_at,
  access_grant_id,
  created_at,
  expires_at
) on public.daypass_codes to authenticated;
grant select (
  id,
  campaign_id,
  entry_number,
  owner_member_profile_id,
  current_holder_member_profile_id,
  referrer_member_profile_id,
  display_alias,
  status,
  locked_at,
  created_at
) on public.promo_entries to authenticated;
grant select on public.listings to authenticated;
grant select on public.draw_snapshots to authenticated;
grant select on public.draw_results to authenticated;
grant select on public.outbound_emails to authenticated;
grant select on public.stripe_webhook_events to authenticated;
grant select on public.promo_campaign_entry_counters to authenticated;

grant all on public.member_profiles to service_role;
grant all on public.promo_campaigns to service_role;
grant all on public.commerce_offers to service_role;
grant all on public.orders to service_role;
grant all on public.order_items to service_role;
grant all on public.access_grants to service_role;
grant all on public.daypass_codes to service_role;
grant all on public.promo_entries to service_role;
grant all on public.listings to service_role;
grant all on public.draw_snapshots to service_role;
grant all on public.draw_results to service_role;
grant all on public.outbound_emails to service_role;
grant all on public.stripe_webhook_events to service_role;
grant all on public.promo_campaign_entry_counters to service_role;

create policy "Admins can read member profiles"
on public.member_profiles
for select
to authenticated
using (public.is_admin());

create policy "Members can read own profile"
on public.member_profiles
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "Admins can read promo campaigns"
on public.promo_campaigns
for select
to authenticated
using (public.is_admin());

create policy "Admins can read commerce offers"
on public.commerce_offers
for select
to authenticated
using (public.is_admin());

create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_admin());

create policy "Members can read own orders"
on public.orders
for select
to authenticated
using (
  (select auth.uid()) is not null
  and member_profile_id in (
    select member_profiles.id
    from public.member_profiles
    where member_profiles.user_id = (select auth.uid())
  )
);

create policy "Admins can read order items"
on public.order_items
for select
to authenticated
using (public.is_admin());

create policy "Members can read own order items"
on public.order_items
for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.orders
    join public.member_profiles on member_profiles.id = orders.member_profile_id
    where orders.id = order_items.order_id
      and member_profiles.user_id = (select auth.uid())
  )
);

create policy "Admins can read access grants"
on public.access_grants
for select
to authenticated
using (public.is_admin());

create policy "Members can read own access grants"
on public.access_grants
for select
to authenticated
using (
  (select auth.uid()) is not null
  and member_profile_id in (
    select member_profiles.id
    from public.member_profiles
    where member_profiles.user_id = (select auth.uid())
  )
);

create policy "Admins can read daypass codes"
on public.daypass_codes
for select
to authenticated
using (public.is_admin());

create policy "Admins can read promo entries"
on public.promo_entries
for select
to authenticated
using (public.is_admin());

create policy "Members can read own promo entries"
on public.promo_entries
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_member_profile_id in (
      select member_profiles.id
      from public.member_profiles
      where member_profiles.user_id = (select auth.uid())
    )
    or current_holder_member_profile_id in (
      select member_profiles.id
      from public.member_profiles
      where member_profiles.user_id = (select auth.uid())
    )
  )
);

create policy "Admins can read listings"
on public.listings
for select
to authenticated
using (public.is_admin());

create policy "Admins can read draw snapshots"
on public.draw_snapshots
for select
to authenticated
using (public.is_admin());

create policy "Admins can read draw results"
on public.draw_results
for select
to authenticated
using (public.is_admin());

create policy "Admins can read outbound emails"
on public.outbound_emails
for select
to authenticated
using (public.is_admin());

create policy "Admins can read stripe webhook events"
on public.stripe_webhook_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can read promo campaign entry counters"
on public.promo_campaign_entry_counters
for select
to authenticated
using (public.is_admin());

comment on table public.orders is
  'Lean V1 orders. Pending orders may exist before Stripe Checkout provides purchaser_email and purchaser_email_normalized.';

comment on table public.access_grants is
  'Daypass grants default to pending_activation with null starts_at/expires_at so the access clock starts on activation, not purchase.';

comment on table public.daypass_codes is
  'Stores code_hash for redemption lookup, code_last4 for safe display, and encrypted_code for server-side recovery only. Never store or expose raw daypass codes.';

comment on column public.daypass_codes.encrypted_code is
  'Authenticated-encryption payload for server-side purchaser resend/support recovery. Must not be exposed to client components or exports.';

comment on column public.daypass_codes.code_hash is
  'One-way lookup hash for code redemption. Must not be exposed to client components, analytics, logs, or exports.';

comment on table public.promo_campaign_entry_counters is
  'Concurrency-safe entry numbering support. Fulfilment must reserve numbers by updating this campaign row inside one transaction and must not read max(promo_entries.entry_number).';

comment on table public.listings is
  'Member-only listing rows are not broadly readable by authenticated users. Fetch server-side after active access is confirmed, or via a later secure RPC.';

comment on table public.stripe_webhook_events is
  'Stripe webhook idempotency and diagnostics log. payload_json should store sanitized minimal diagnostics only, not raw Stripe payloads or sensitive payment/customer details.';

comment on table public.outbound_emails is
  'Transactional email log with idempotency_key uniqueness for safe retries.';
