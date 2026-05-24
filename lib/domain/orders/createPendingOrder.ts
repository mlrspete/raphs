import "server-only";

import type { StripeDaypassCheckoutOption } from "@/lib/domain/payments/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { CommerceOffer, Json, Order, OrderItem, PromoCampaign } from "@/lib/types/database";

export type PendingOrderAttribution = {
  anonymous_id: string | null;
  session_id: string | null;
  path: string | null;
  url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  raw: Json;
};

type CreatePendingOrderInput = {
  campaign: PromoCampaign;
  checkoutOption: StripeDaypassCheckoutOption;
  offer: CommerceOffer;
  quantity: number;
  sourceLandingPageId: string | null;
  sourceSlug: string | null;
  attribution: PendingOrderAttribution;
};

type CreatePendingOrderResult = {
  order: Order;
  orderItem: OrderItem;
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

export async function createPendingOrder({
  attribution,
  campaign,
  checkoutOption,
  offer,
  quantity,
  sourceLandingPageId,
  sourceSlug,
}: CreatePendingOrderInput): Promise<CreatePendingOrderResult> {
  const supabase = createAdminSupabaseClient();
  const totalCents = checkoutOption.totalPriceCents;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      anonymous_id: attribution.anonymous_id,
      attribution_json: toJson({
        attribution: attribution.raw,
        checkout_context: {
          campaign_id: campaign.id,
          campaign_slug: campaign.slug,
          checkout_option_code: checkoutOption.code,
          offer_code: offer.code,
          offer_id: offer.id,
          stripe_price_id: checkoutOption.stripePriceId,
          total_price_cents: checkoutOption.totalPriceCents,
          unit_price_cents: checkoutOption.unitPriceCents,
        },
      }),
      currency: offer.currency,
      purchaser_email: null,
      purchaser_email_normalized: null,
      session_id: attribution.session_id,
      source_landing_page_id: sourceLandingPageId,
      source_slug: sourceSlug,
      status: "pending",
      subtotal_cents: totalCents,
      total_cents: totalCents,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Pending order could not be created.");
  }

  const { data: orderItem, error: itemError } = await supabase
    .from("order_items")
    .insert({
      campaign_id: campaign.id,
      currency: offer.currency,
      item_type: offer.offer_type,
      offer_id: offer.id,
      order_id: order.id,
      quantity,
      total_price_cents: totalCents,
      unit_price_cents: checkoutOption.unitPriceCents,
    })
    .select("*")
    .single();

  if (itemError || !orderItem) {
    throw new Error(itemError?.message ?? "Pending order item could not be created.");
  }

  return {
    order,
    orderItem,
  };
}

export async function attachCheckoutSessionToOrder(orderId: string, stripeCheckoutSessionId: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({
      stripe_checkout_session_id: stripeCheckoutSessionId,
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}
