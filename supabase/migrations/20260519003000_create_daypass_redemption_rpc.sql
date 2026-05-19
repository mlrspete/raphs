create or replace function public.redeem_daypass_code(
  p_code_hash text,
  p_redeemer_member_profile_id uuid,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_access_grant_id uuid;
  v_attribution_updated boolean := false;
  v_campaign public.promo_campaigns%rowtype;
  v_code public.daypass_codes%rowtype;
  v_existing_access_grant_id uuid;
  v_entry public.promo_entries%rowtype;
  v_member_exists boolean;
  v_redemption_before_lock boolean := false;
begin
  if p_code_hash is null or length(trim(p_code_hash)) = 0 then
    raise exception 'Invalid Daypass code';
  end if;

  select exists (
    select 1
    from public.member_profiles
    where id = p_redeemer_member_profile_id
  )
  into v_member_exists;

  if not v_member_exists then
    raise exception 'Redeeming member profile was not found';
  end if;

  select *
  into v_code
  from public.daypass_codes
  where code_hash = p_code_hash
  for update;

  if not found then
    raise exception 'Invalid or unavailable Daypass code';
  end if;

  if v_code.status = 'redeemed' then
    if v_code.redeemed_by_member_profile_id = p_redeemer_member_profile_id and v_code.access_grant_id is not null then
      return jsonb_build_object(
        'already_redeemed', true,
        'access_grant_id', v_code.access_grant_id,
        'attribution_updated', false,
        'campaign_id', v_code.campaign_id,
        'campaign_slug', null,
        'code_id', v_code.id,
        'code_last4', v_code.code_last4,
        'redemption_before_lock', false,
        'redeemed_at', v_code.redeemed_at,
        'purchaser_member_profile_id', v_code.purchaser_member_profile_id,
        'purchaser_notification', jsonb_build_object(
          'code_last4', v_code.code_last4,
          'redeemed_at', v_code.redeemed_at
        )
      );
    end if;

    raise exception 'This Daypass code has already been redeemed';
  end if;

  if v_code.status in ('revoked', 'expired') then
    raise exception 'This Daypass code is not available';
  end if;

  if v_code.status <> 'available' then
    raise exception 'This Daypass code is not available';
  end if;

  if v_code.expires_at is not null and p_now >= v_code.expires_at then
    raise exception 'This Daypass code is expired';
  end if;

  select id
  into v_existing_access_grant_id
  from public.access_grants
  where daypass_code_id = v_code.id
  limit 1
  for update;

  if found then
    raise exception 'This Daypass code requires manual review';
  end if;

  select *
  into v_entry
  from public.promo_entries
  where daypass_code_id = v_code.id
  order by created_at asc
  limit 1
  for update;

  if found then
    select *
    into v_campaign
    from public.promo_campaigns
    where id = v_entry.campaign_id
    for update;

    if not found then
      raise exception 'Campaign for Daypass code was not found';
    end if;

    if v_campaign.draw_lock_at is null then
      raise exception 'Campaign draw lock is not configured; redemption requires manual review';
    end if;
  elsif v_code.campaign_id is not null then
    select *
    into v_campaign
    from public.promo_campaigns
    where id = v_code.campaign_id;
  end if;

  insert into public.access_grants (
    member_profile_id,
    order_id,
    order_item_id,
    daypass_code_id,
    access_type,
    status,
    starts_at,
    expires_at
  )
  values (
    p_redeemer_member_profile_id,
    v_code.order_id,
    v_code.order_item_id,
    v_code.id,
    'daypass',
    'pending_activation',
    null,
    null
  )
  returning id
  into v_access_grant_id;

  update public.daypass_codes
  set
    status = 'redeemed',
    redeemed_by_member_profile_id = p_redeemer_member_profile_id,
    redeemed_at = p_now,
    access_grant_id = v_access_grant_id
  where id = v_code.id
  returning *
  into v_code;

  if v_entry.id is not null and v_campaign.draw_lock_at is not null and p_now < v_campaign.draw_lock_at and v_entry.locked_at is null then
    update public.promo_entries
    set
      current_holder_member_profile_id = p_redeemer_member_profile_id,
      referrer_member_profile_id = coalesce(referrer_member_profile_id, v_code.purchaser_member_profile_id)
    where id = v_entry.id
    returning *
    into v_entry;

    v_attribution_updated := true;
    v_redemption_before_lock := true;
  end if;

  return jsonb_build_object(
    'already_redeemed', false,
    'access_grant_id', v_access_grant_id,
    'attribution_updated', v_attribution_updated,
    'campaign_id', coalesce(v_entry.campaign_id, v_code.campaign_id),
    'campaign_slug', v_campaign.slug,
    'code_id', v_code.id,
    'code_last4', v_code.code_last4,
    'entry_id', v_entry.id,
    'promo_entry_current_holder_updated', v_attribution_updated,
    'redemption_before_lock', v_redemption_before_lock,
    'redeemed_at', v_code.redeemed_at,
    'purchaser_member_profile_id', v_code.purchaser_member_profile_id,
    'purchaser_notification', jsonb_build_object(
      'code_last4', v_code.code_last4,
      'redeemed_at', v_code.redeemed_at
    )
  );
end;
$$;

revoke all on function public.redeem_daypass_code(text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.redeem_daypass_code(text, uuid, timestamptz) to service_role;
