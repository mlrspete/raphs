import "server-only";

import type Stripe from "stripe";

import { insertEventLog } from "@/lib/db/events";
import { grantDaypassOrderAccess, type DaypassFulfillmentSummary } from "@/lib/domain/access/grantAccess";
import { generateDaypassCodes } from "@/lib/domain/daypass-codes/generateDaypassCodes";
import { getExpectedFriendCodeCount, getExpectedPromoEntryCount } from "@/lib/domain/promo-entries/createPromoEntries";
import { getActiveCommerceOfferByCode } from "@/lib/domain/offers/queries";
import { daypassCampaign001OfferCode } from "@/lib/domain/offers/config";
import { getPaidOrderStripeFields } from "@/lib/domain/orders/markOrderPaid";
import { getStripeClient } from "@/lib/domain/payments/stripe";
import { normalizeEmail } from "@/lib/domain/members/normalizeEmail";
import { sendOrderConfirmationEmail } from "@/lib/domain/email/sendOrderConfirmationEmail";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database";
import type { EventPayload } from "@/lib/validation/events";

type FulfillCheckoutInput = {
  stripeEventId: string;
  sessionId: string;
  webhookPayload: Json;
};

export type FulfillCheckoutResult = {
  summary: DaypassFulfillmentSummary;
  plainFriendCodes: string[];
};

function readMetadataString(session: Stripe.Checkout.Session, key: string) {
  const value = session.metadata?.[key];
  return value && value.trim() ? value : null;
}

function sanitizeEmailHookError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 800);
}

function readQuantity(session: Stripe.Checkout.Session) {
  const rawQuantity = readMetadataString(session, "daypass_quantity");
  const quantity = rawQuantity ? Number.parseInt(rawQuantity, 10) : NaN;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new Error("Stripe Checkout Session is missing a valid Daypass quantity.");
  }

  return quantity;
}

async function getExistingOrderFulfilledAt(orderId: string | null, sessionId: string) {
  const supabase = createAdminSupabaseClient();
  let query = supabase.from("orders").select("id, fulfilled_at").eq("stripe_checkout_session_id", sessionId);

  if (orderId) {
    query = supabase.from("orders").select("id, fulfilled_at").or(`id.eq.${orderId},stripe_checkout_session_id.eq.${sessionId}`);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.fulfilled_at ?? null;
}

function buildWebhookEventPayload(
  eventName: EventPayload["event_name"],
  session: Stripe.Checkout.Session,
  properties: Record<string, Json>,
): EventPayload {
  return {
    anonymous_id: readMetadataString(session, "anonymous_id"),
    currency: "AUD",
    device_type: "unknown",
    event_name: eventName,
    fbclid: null,
    landing_page_id: readMetadataString(session, "landing_page_id"),
    landing_slug: readMetadataString(session, "landing_slug"),
    lead_id: null,
    meta_ad_id: readMetadataString(session, "meta_ad_id"),
    meta_adset_id: null,
    meta_campaign_id: null,
    offer_id: readMetadataString(session, "offer_code"),
    offer_type: "daypass",
    path: null,
    price_cents: null,
    properties,
    referrer: null,
    session_id: readMetadataString(session, "session_id"),
    timestamp: new Date().toISOString(),
    url: null,
    utm_campaign: readMetadataString(session, "utm_campaign"),
    utm_content: null,
    utm_medium: null,
    utm_source: readMetadataString(session, "utm_source"),
    utm_term: null,
  };
}

async function logFulfillmentBusinessEvents(
  session: Stripe.Checkout.Session,
  summary: DaypassFulfillmentSummary,
  quantity: number,
) {
  const baseProperties = {
    already_fulfilled: summary.already_fulfilled,
    campaign_id: readMetadataString(session, "campaign_id"),
    daypass_quantity: quantity,
    daypass_code_count: summary.daypass_code_count,
    promo_entry_count: summary.promo_entry_count,
    surface: "stripe_webhook",
  };
  const eventNames: EventPayload["event_name"][] = [
    "checkout_completed",
    "order_fulfilled",
    "access_grant_created",
    "daypass_code_created",
    "promo_entry_issued",
  ];

  for (const eventName of eventNames) {
    try {
      await insertEventLog(buildWebhookEventPayload(eventName, session, baseProperties));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${eventName} event could not be logged: ${message}`);
    }
  }
}

export async function fulfillCheckout({ sessionId, stripeEventId, webhookPayload }: FulfillCheckoutInput) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error("Stripe Checkout Session is not complete and paid.");
  }

  const purchaserEmail = session.customer_details?.email ?? session.customer_email ?? null;

  if (!purchaserEmail) {
    throw new Error("Stripe Checkout Session is missing purchaser email.");
  }

  const purchaserEmailNormalized = normalizeEmail(purchaserEmail);
  const orderId = readMetadataString(session, "order_id");
  const campaignId = readMetadataString(session, "campaign_id");
  const offerCode = readMetadataString(session, "offer_code");
  const quantity = readQuantity(session);

  if (!campaignId) {
    throw new Error("Stripe Checkout Session is missing campaign metadata.");
  }

  if (offerCode !== daypassCampaign001OfferCode) {
    throw new Error("Stripe Checkout Session is not for the Campaign 001 Daypass offer.");
  }

  const offer = await getActiveCommerceOfferByCode(daypassCampaign001OfferCode);

  if (!offer) {
    throw new Error("Campaign 001 Daypass offer is not active.");
  }

  const expectedPromoEntries = getExpectedPromoEntryCount(quantity);
  const expectedFriendCodes = getExpectedFriendCodeCount(quantity);
  const fulfilledAt = await getExistingOrderFulfilledAt(orderId, session.id);
  const generatedFriendCodes = fulfilledAt ? [] : generateDaypassCodes(expectedFriendCodes);
  const stripeFields = getPaidOrderStripeFields(session);
  const summary = await grantDaypassOrderAccess({
    campaignId,
    friendCodeRecords: generatedFriendCodes.map((code) => code.record),
    offerId: offer.id,
    orderId,
    purchaserEmail,
    purchaserEmailNormalized,
    quantity,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: stripeFields.stripeCustomerId,
    stripeEventId,
    stripePaymentIntentId: stripeFields.stripePaymentIntentId,
    webhookPayload,
  });

  await logFulfillmentBusinessEvents(session, summary, expectedPromoEntries);
  const plainFriendCodes = summary.already_fulfilled ? [] : generatedFriendCodes.map((code) => code.plainCode);

  try {
    await sendOrderConfirmationEmail({
      orderId: summary.order_id,
      plainFriendCodes,
    });
  } catch (error) {
    console.error(`Purchase confirmation email hook failed: ${sanitizeEmailHookError(error)}`);
  }

  return {
    plainFriendCodes,
    summary,
  };
}
