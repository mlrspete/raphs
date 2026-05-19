create or replace function public.fulfill_daypass_order(
  p_stripe_event_id text,
  p_order_id uuid,
  p_stripe_checkout_session_id text,
  p_stripe_customer_id text,
  p_stripe_payment_intent_id text,
  p_purchaser_email text,
  p_purchaser_email_normalized text,
  p_campaign_id uuid,
  p_offer_id uuid,
  p_quantity integer,
  p_friend_codes jsonb,
  p_webhook_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_access_grant_id uuid;
  v_campaign public.promo_campaigns%rowtype;
  v_code_count integer := 0;
  v_code_ids uuid[] := array[]::uuid[];
  v_counter_end integer;
  v_counter_start integer;
  v_expected_code_count integer;
  v_fulfilled_at timestamptz;
  v_inserted_code_id uuid;
  v_member_profile_id uuid;
  v_now timestamptz := now();
  v_order public.orders%rowtype;
  v_order_item public.order_items%rowtype;
  v_offer public.commerce_offers%rowtype;
  v_payload jsonb := coalesce(p_webhook_payload, '{}'::jsonb);
  v_existing_entry_count integer;
  v_existing_code_count integer;
  v_entry_numbers integer[] := array[]::integer[];
  v_friend_code jsonb;
  v_index integer;
begin
  if p_stripe_event_id is null or length(trim(p_stripe_event_id)) = 0 then
    raise exception 'Missing Stripe event id';
  end if;

  if p_stripe_checkout_session_id is null or length(trim(p_stripe_checkout_session_id)) = 0 then
    raise exception 'Missing Stripe Checkout Session id';
  end if;

  if p_purchaser_email is null or length(trim(p_purchaser_email)) = 0 then
    raise exception 'Missing purchaser email';
  end if;

  if p_purchaser_email_normalized is null or length(trim(p_purchaser_email_normalized)) = 0 then
    raise exception 'Missing normalized purchaser email';
  end if;

  if p_quantity < 1 or p_quantity > 10 then
    raise exception 'Invalid Daypass quantity';
  end if;

  select *
  into v_campaign
  from public.promo_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    raise exception 'Campaign not found';
  end if;

  if v_campaign.entries_close_at is not null and v_now > v_campaign.entries_close_at then
    raise exception 'Campaign entries are closed; manual review required';
  end if;

  select *
  into v_offer
  from public.commerce_offers
  where id = p_offer_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Active Daypass offer not found';
  end if;

  if v_offer.offer_type <> 'daypass' then
    raise exception 'Offer is not a Daypass offer';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
     or stripe_checkout_session_id = p_stripe_checkout_session_id
  for update;

  if not found then
    raise exception 'Order not found for Stripe Checkout Session';
  end if;

  if v_order.fulfilled_at is not null then
    update public.stripe_webhook_events
    set
      processing_status = 'processed',
      related_order_id = v_order.id,
      processed_at = coalesce(processed_at, v_now),
      payload_json = v_payload || jsonb_build_object(
        'order_id', v_order.id,
        'already_fulfilled', true,
        'processing_status', 'processed'
      )
    where stripe_event_id = p_stripe_event_id;

    select count(*)
    into v_existing_entry_count
    from public.promo_entries
    where order_id = v_order.id;

    select count(*)
    into v_existing_code_count
    from public.daypass_codes
    where order_id = v_order.id;

    return jsonb_build_object(
      'already_fulfilled', true,
      'order_id', v_order.id,
      'member_profile_id', v_order.member_profile_id,
      'access_grant_id', null,
      'daypass_code_count', v_existing_code_count,
      'promo_entry_count', v_existing_entry_count,
      'entry_numbers', '[]'::jsonb,
      'fulfilled_at', v_order.fulfilled_at
    );
  end if;

  v_expected_code_count := greatest(p_quantity - 1, 0);

  if jsonb_typeof(coalesce(p_friend_codes, '[]'::jsonb)) <> 'array' then
    raise exception 'Friend code payload must be an array';
  end if;

  if jsonb_array_length(coalesce(p_friend_codes, '[]'::jsonb)) <> v_expected_code_count then
    raise exception 'Friend code count does not match Daypass quantity';
  end if;

  insert into public.member_profiles (
    email,
    email_normalized,
    stripe_customer_id
  )
  values (
    p_purchaser_email,
    p_purchaser_email_normalized,
    p_stripe_customer_id
  )
  on conflict (email_normalized)
  do update
  set
    email = excluded.email,
    stripe_customer_id = coalesce(public.member_profiles.stripe_customer_id, excluded.stripe_customer_id),
    updated_at = v_now
  returning id
  into v_member_profile_id;

  select *
  into v_order_item
  from public.order_items
  where order_id = v_order.id
    and offer_id = v_offer.id
    and campaign_id = v_campaign.id
    and item_type = 'daypass'
  order by created_at asc
  limit 1
  for update;

  if found then
    update public.order_items
    set
      quantity = p_quantity,
      unit_price_cents = v_offer.unit_price_cents,
      total_price_cents = p_quantity * v_offer.unit_price_cents,
      currency = v_offer.currency
    where id = v_order_item.id
    returning *
    into v_order_item;
  else
    insert into public.order_items (
      order_id,
      offer_id,
      campaign_id,
      item_type,
      quantity,
      unit_price_cents,
      total_price_cents,
      currency
    )
    values (
      v_order.id,
      v_offer.id,
      v_campaign.id,
      'daypass',
      p_quantity,
      v_offer.unit_price_cents,
      p_quantity * v_offer.unit_price_cents,
      v_offer.currency
    )
    returning *
    into v_order_item;
  end if;

  select count(*)
  into v_existing_code_count
  from public.daypass_codes
  where order_id = v_order.id
    and order_item_id = v_order_item.id;

  if v_existing_code_count > 0 then
    raise exception 'Daypass codes already exist for an unfulfilled order; manual review required';
  end if;

  select count(*)
  into v_existing_entry_count
  from public.promo_entries
  where order_id = v_order.id
    and order_item_id = v_order_item.id;

  if v_existing_entry_count > 0 then
    raise exception 'Promo entries already exist for an unfulfilled order; manual review required';
  end if;

  select id
  into v_access_grant_id
  from public.access_grants
  where order_id = v_order.id
    and order_item_id = v_order_item.id
    and access_type = 'daypass'
  order by created_at asc
  limit 1
  for update;

  if not found then
    insert into public.access_grants (
      member_profile_id,
      order_id,
      order_item_id,
      access_type,
      status,
      starts_at,
      expires_at
    )
    values (
      v_member_profile_id,
      v_order.id,
      v_order_item.id,
      'daypass',
      'pending_activation',
      null,
      null
    )
    returning id
    into v_access_grant_id;
  else
    update public.access_grants
    set
      member_profile_id = v_member_profile_id,
      status = 'pending_activation',
      starts_at = null,
      expires_at = null
    where id = v_access_grant_id;
  end if;

  v_index := 0;

  for v_friend_code in
    select value
    from jsonb_array_elements(coalesce(p_friend_codes, '[]'::jsonb)) as code(value)
  loop
    v_index := v_index + 1;

    if length(coalesce(v_friend_code ->> 'code_hash', '')) = 0
      or length(coalesce(v_friend_code ->> 'code_last4', '')) = 0
      or length(coalesce(v_friend_code ->> 'encrypted_code', '')) = 0
      or length(coalesce(v_friend_code ->> 'encryption_key_version', '')) = 0 then
      raise exception 'Invalid encrypted friend code payload';
    end if;

    insert into public.daypass_codes (
      purchaser_member_profile_id,
      purchaser_email_normalized,
      order_id,
      order_item_id,
      campaign_id,
      code_hash,
      code_last4,
      encrypted_code,
      encryption_key_version,
      status
    )
    values (
      v_member_profile_id,
      p_purchaser_email_normalized,
      v_order.id,
      v_order_item.id,
      v_campaign.id,
      v_friend_code ->> 'code_hash',
      v_friend_code ->> 'code_last4',
      v_friend_code ->> 'encrypted_code',
      v_friend_code ->> 'encryption_key_version',
      'available'
    )
    returning id
    into v_inserted_code_id;

    v_code_ids := array_append(v_code_ids, v_inserted_code_id);
    v_code_count := v_code_count + 1;
  end loop;

  insert into public.promo_campaign_entry_counters (
    campaign_id,
    last_entry_number,
    updated_at
  )
  values (
    v_campaign.id,
    0,
    v_now
  )
  on conflict (campaign_id) do nothing;

  select last_entry_number
  into v_counter_start
  from public.promo_campaign_entry_counters
  where campaign_id = v_campaign.id
  for update;

  update public.promo_campaign_entry_counters
  set
    last_entry_number = last_entry_number + p_quantity,
    updated_at = v_now
  where campaign_id = v_campaign.id
  returning last_entry_number
  into v_counter_end;

  for v_index in 1..p_quantity loop
    insert into public.promo_entries (
      campaign_id,
      order_id,
      order_item_id,
      daypass_code_id,
      entry_number,
      owner_member_profile_id,
      owner_email_normalized,
      current_holder_member_profile_id,
      display_alias,
      status
    )
    values (
      v_campaign.id,
      v_order.id,
      v_order_item.id,
      case when v_index = 1 then null else v_code_ids[v_index - 1] end,
      v_counter_start + v_index,
      v_member_profile_id,
      p_purchaser_email_normalized,
      v_member_profile_id,
      'Member #' || (v_counter_start + v_index)::text,
      'active'
    );

    v_entry_numbers := array_append(v_entry_numbers, v_counter_start + v_index);
  end loop;

  v_fulfilled_at := v_now;

  update public.orders
  set
    member_profile_id = v_member_profile_id,
    purchaser_email = p_purchaser_email,
    purchaser_email_normalized = p_purchaser_email_normalized,
    stripe_customer_id = p_stripe_customer_id,
    stripe_checkout_session_id = p_stripe_checkout_session_id,
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    status = 'fulfilled',
    subtotal_cents = p_quantity * v_offer.unit_price_cents,
    total_cents = p_quantity * v_offer.unit_price_cents,
    currency = v_offer.currency,
    fulfilled_at = v_fulfilled_at
  where id = v_order.id
  returning *
  into v_order;

  update public.stripe_webhook_events
  set
    processing_status = 'processed',
    related_order_id = v_order.id,
    processed_at = v_fulfilled_at,
    payload_json = v_payload || jsonb_build_object(
      'order_id', v_order.id,
      'order_item_id', v_order_item.id,
      'member_profile_id', v_member_profile_id,
      'access_grant_id', v_access_grant_id,
      'daypass_code_count', v_code_count,
      'promo_entry_count', p_quantity,
      'processing_status', 'processed'
    ),
    error_message = null
  where stripe_event_id = p_stripe_event_id;

  return jsonb_build_object(
    'already_fulfilled', false,
    'order_id', v_order.id,
    'order_item_id', v_order_item.id,
    'member_profile_id', v_member_profile_id,
    'access_grant_id', v_access_grant_id,
    'daypass_code_count', v_code_count,
    'promo_entry_count', p_quantity,
    'entry_numbers', to_jsonb(v_entry_numbers),
    'fulfilled_at', v_fulfilled_at
  );
end;
$$;

revoke all on function public.fulfill_daypass_order(
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  integer,
  jsonb,
  jsonb
) from public, anon, authenticated;

grant execute on function public.fulfill_daypass_order(
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  integer,
  jsonb,
  jsonb
) to service_role;
