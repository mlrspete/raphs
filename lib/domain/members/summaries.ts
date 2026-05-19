import "server-only";

import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { DaypassCodeStatus, OrderStatus, PromoEntryStatus } from "@/lib/types/database";

export type MemberOrderSummary = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  fulfilledAt: string | null;
  itemCount: number;
  daypassQuantity: number;
};

export type MemberCodeSummary = {
  id: string;
  codeLast4: string;
  status: DaypassCodeStatus;
  redeemedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export type MemberEntrySummary = {
  id: string;
  campaignId: string;
  campaignName: string;
  entryNumber: number;
  displayAlias: string;
  status: PromoEntryStatus;
  lockedAt: string | null;
  createdAt: string;
};

async function resolveMemberProfileId(memberProfileId?: string) {
  return memberProfileId ?? (await getCurrentMemberProfile())?.id ?? null;
}

export async function getMemberOrdersSummary(memberProfileId?: string): Promise<MemberOrderSummary[]> {
  const resolvedMemberProfileId = await resolveMemberProfileId(memberProfileId);

  if (!resolvedMemberProfileId) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, created_at, fulfilled_at")
    .eq("member_profile_id", resolvedMemberProfileId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(`Member orders summary failed: ${error.message}`);
    return [];
  }

  const orders = data ?? [];
  const orderIds = orders.map((order) => order.id);

  if (orderIds.length === 0) {
    return [];
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id, item_type, quantity")
    .in("order_id", orderIds);

  if (itemsError) {
    console.error(`Member order item summary failed: ${itemsError.message}`);
  }

  const itemStatsByOrderId = new Map<string, { itemCount: number; daypassQuantity: number }>();

  for (const item of items ?? []) {
    const stats = itemStatsByOrderId.get(item.order_id) ?? { daypassQuantity: 0, itemCount: 0 };
    stats.itemCount += item.quantity;

    if (item.item_type.toLowerCase().includes("daypass")) {
      stats.daypassQuantity += item.quantity;
    }

    itemStatsByOrderId.set(item.order_id, stats);
  }

  return orders.map((order) => {
    const stats = itemStatsByOrderId.get(order.id) ?? { daypassQuantity: 0, itemCount: 0 };

    return {
      createdAt: order.created_at,
      currency: order.currency,
      daypassQuantity: stats.daypassQuantity,
      fulfilledAt: order.fulfilled_at,
      id: order.id,
      itemCount: stats.itemCount,
      status: order.status,
      totalCents: order.total_cents,
    };
  });
}

export async function getMemberCodeSummary(memberProfileId?: string): Promise<MemberCodeSummary[]> {
  const resolvedMemberProfileId = await resolveMemberProfileId(memberProfileId);

  if (!resolvedMemberProfileId) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("daypass_codes")
    .select("id, code_last4, status, redeemed_at, created_at, expires_at")
    .or(
      `purchaser_member_profile_id.eq.${resolvedMemberProfileId},redeemed_by_member_profile_id.eq.${resolvedMemberProfileId}`,
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(`Member code summary failed: ${error.message}`);
    return [];
  }

  return (data ?? []).map((code) => ({
    codeLast4: code.code_last4,
    createdAt: code.created_at,
    expiresAt: code.expires_at,
    id: code.id,
    redeemedAt: code.redeemed_at,
    status: code.status,
  }));
}

export async function getMemberEntrySummary(memberProfileId?: string): Promise<MemberEntrySummary[]> {
  const resolvedMemberProfileId = await resolveMemberProfileId(memberProfileId);

  if (!resolvedMemberProfileId) {
    return [];
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("promo_entries")
    .select("id, campaign_id, entry_number, display_alias, status, locked_at, created_at")
    .or(
      `owner_member_profile_id.eq.${resolvedMemberProfileId},current_holder_member_profile_id.eq.${resolvedMemberProfileId}`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(`Member entry summary failed: ${error.message}`);
    return [];
  }

  const entries = data ?? [];
  const campaignIds = Array.from(new Set(entries.map((entry) => entry.campaign_id)));
  const campaignNameById = new Map<string, string>();

  if (campaignIds.length > 0) {
    const { data: campaigns, error: campaignsError } = await supabase
      .from("promo_campaigns")
      .select("id, name, short_name")
      .in("id", campaignIds);

    if (campaignsError) {
      console.error(`Member entry campaign summary failed: ${campaignsError.message}`);
    }

    for (const campaign of campaigns ?? []) {
      campaignNameById.set(campaign.id, campaign.short_name ?? campaign.name);
    }
  }

  return entries.map((entry) => ({
    campaignId: entry.campaign_id,
    campaignName: campaignNameById.get(entry.campaign_id) ?? "Campaign",
    createdAt: entry.created_at,
    displayAlias: entry.display_alias,
    entryNumber: entry.entry_number,
    id: entry.id,
    lockedAt: entry.locked_at,
    status: entry.status,
  }));
}
