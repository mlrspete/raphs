import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { GeneratedFriendCodeRecord } from "@/lib/domain/daypass-codes/generateDaypassCodes";
import type { Json } from "@/lib/types/database";

export type DaypassFulfillmentSummary = {
  already_fulfilled: boolean;
  order_id: string;
  order_item_id: string | null;
  member_profile_id: string | null;
  access_grant_id: string | null;
  daypass_code_count: number;
  promo_entry_count: number;
  entry_numbers: number[];
  fulfilled_at: string | null;
};

type GrantDaypassOrderAccessInput = {
  stripeEventId: string;
  orderId: string | null;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  purchaserEmail: string;
  purchaserEmailNormalized: string;
  campaignId: string;
  offerId: string;
  quantity: number;
  friendCodeRecords: GeneratedFriendCodeRecord[];
  webhookPayload: Json;
};

type RpcResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type RpcCapableClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult<Json>>;
};

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: Json | undefined) {
  return typeof value === "number" ? value : 0;
}

function readBoolean(value: Json | undefined) {
  return typeof value === "boolean" ? value : false;
}

function readNumberArray(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];
}

function parseSummary(value: Json): DaypassFulfillmentSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Fulfilment RPC returned an invalid summary.");
  }

  return {
    access_grant_id: readString(value.access_grant_id),
    already_fulfilled: readBoolean(value.already_fulfilled),
    daypass_code_count: readNumber(value.daypass_code_count),
    entry_numbers: readNumberArray(value.entry_numbers),
    fulfilled_at: readString(value.fulfilled_at),
    member_profile_id: readString(value.member_profile_id),
    order_id: readString(value.order_id) ?? "",
    order_item_id: readString(value.order_item_id),
    promo_entry_count: readNumber(value.promo_entry_count),
  };
}

export async function grantDaypassOrderAccess(input: GrantDaypassOrderAccessInput) {
  const supabase = createAdminSupabaseClient() as unknown as RpcCapableClient;
  const { data, error } = await supabase.rpc("fulfill_daypass_order", {
    p_campaign_id: input.campaignId,
    p_friend_codes: input.friendCodeRecords,
    p_offer_id: input.offerId,
    p_order_id: input.orderId,
    p_purchaser_email: input.purchaserEmail,
    p_purchaser_email_normalized: input.purchaserEmailNormalized,
    p_quantity: input.quantity,
    p_stripe_checkout_session_id: input.stripeCheckoutSessionId,
    p_stripe_customer_id: input.stripeCustomerId,
    p_stripe_event_id: input.stripeEventId,
    p_stripe_payment_intent_id: input.stripePaymentIntentId,
    p_webhook_payload: input.webhookPayload,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Daypass fulfilment RPC failed.");
  }

  return parseSummary(data);
}
