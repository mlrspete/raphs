import { NextResponse } from "next/server";
import { z } from "zod";

import { insertEventLog } from "@/lib/db/events";
import { attachCheckoutSessionToOrder, createPendingOrder } from "@/lib/domain/orders/createPendingOrder";
import { assertStripeSecretConfigured, getStripeDaypassCheckoutOption } from "@/lib/domain/payments/stripe";
import { createCheckoutSession } from "@/lib/domain/payments/createCheckoutSession";
import { campaign001Slug } from "@/lib/domain/campaigns/config";
import { ensureCampaign001CheckoutData } from "@/lib/domain/campaigns/ensureCampaign001CheckoutData";
import { isSupportedDaypassCheckoutQuantity } from "@/lib/domain/daypass/pricing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json, PromoCampaign } from "@/lib/types/database";
import type { EventPayload } from "@/lib/validation/events";

export const dynamic = "force-dynamic";

const optionalTrimmedString = (maxLength: number) =>
  z
    .preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().max(maxLength).optional().nullable())
    .transform((value) => value || null);

const optionalUuid = z
  .preprocess((value) => (value === "" ? null : value), z.string().uuid().optional().nullable())
  .transform((value) => value ?? null);

const attributionSchema = z
  .object({
    anonymous_id: optionalTrimmedString(160),
    session_id: optionalTrimmedString(160),
    path: optionalTrimmedString(1000),
    url: optionalTrimmedString(1200),
    referrer: optionalTrimmedString(1000),
    device_type: z.enum(["desktop", "mobile", "tablet", "unknown"]).optional().nullable().default("unknown"),
    timestamp: optionalTrimmedString(80),
    utm_source: optionalTrimmedString(200),
    utm_medium: optionalTrimmedString(200),
    utm_campaign: optionalTrimmedString(300),
    utm_content: optionalTrimmedString(300),
    utm_term: optionalTrimmedString(300),
    fbclid: optionalTrimmedString(500),
    meta_campaign_id: optionalTrimmedString(200),
    meta_adset_id: optionalTrimmedString(200),
    meta_ad_id: optionalTrimmedString(200),
    first_touch: z.unknown().optional().nullable(),
    latest_touch: z.unknown().optional().nullable(),
  })
  .passthrough()
  .partial()
  .transform((value) => ({
    ...value,
    anonymous_id: value.anonymous_id ?? null,
    device_type: value.device_type ?? "unknown",
    fbclid: value.fbclid ?? null,
    first_touch: value.first_touch ?? null,
    latest_touch: value.latest_touch ?? null,
    meta_ad_id: value.meta_ad_id ?? null,
    meta_adset_id: value.meta_adset_id ?? null,
    meta_campaign_id: value.meta_campaign_id ?? null,
    path: value.path ?? null,
    referrer: value.referrer ?? null,
    session_id: value.session_id ?? null,
    timestamp: value.timestamp ?? null,
    url: value.url ?? null,
    utm_campaign: value.utm_campaign ?? null,
    utm_content: value.utm_content ?? null,
    utm_medium: value.utm_medium ?? null,
    utm_source: value.utm_source ?? null,
    utm_term: value.utm_term ?? null,
  }));

const checkoutPayloadSchema = z.object({
  quantity: z
    .number()
    .int()
    .refine(isSupportedDaypassCheckoutQuantity, { message: "Choose 1, 5, or 10 Daypasses." }),
  campaign_slug: optionalTrimmedString(120).default(campaign001Slug),
  campaign_id: optionalUuid,
  source_landing_page_id: optionalUuid,
  source_slug: optionalTrimmedString(120),
  attribution: z.unknown().optional(),
});

type CheckoutResponse =
  | {
      success: true;
      url: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

function methodNotAllowed() {
  return NextResponse.json<CheckoutResponse>(
    {
      error: "Method not allowed.",
      success: false,
    },
    {
      headers: {
        Allow: "POST",
      },
      status: 405,
    },
  );
}

function isDraftCheckoutAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DRAFT_CAMPAIGN_CHECKOUT === "true";
}

function assertCampaignCheckoutAllowed(campaign: PromoCampaign) {
  if (campaign.slug !== campaign001Slug) {
    throw new Error("Checkout is only available for Campaign 001.");
  }

  if (campaign.status === "live") {
    return;
  }

  if (campaign.status === "draft" && isDraftCheckoutAllowed()) {
    return;
  }

  throw new Error("Campaign 001 is not open for checkout.");
}

async function getCampaignForCheckout(
  campaignSlug: string | null,
  campaignId: string | null,
  campaign001Fallback: PromoCampaign,
) {
  const slug = campaignSlug ?? campaign001Slug;

  if (slug === "first-preview-drop") {
    throw new Error("first-preview-drop is not a canonical Campaign 001 checkout slug.");
  }

  if (slug !== campaign001Slug) {
    throw new Error("Checkout is only available for Campaign 001.");
  }

  if (!campaignId) {
    return campaign001Fallback;
  }

  const supabase = createAdminSupabaseClient();
  const { data: campaign, error } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (error || !campaign) {
    throw new Error(error?.message ?? "Campaign could not be found.");
  }

  return campaign;
}

function toPendingOrderAttribution(attribution: z.infer<typeof attributionSchema>) {
  return {
    anonymous_id: attribution.anonymous_id,
    fbclid: attribution.fbclid,
    meta_ad_id: attribution.meta_ad_id,
    meta_adset_id: attribution.meta_adset_id,
    meta_campaign_id: attribution.meta_campaign_id,
    path: attribution.path,
    raw: toJson(attribution),
    referrer: attribution.referrer,
    session_id: attribution.session_id,
    url: attribution.url,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_medium: attribution.utm_medium,
    utm_source: attribution.utm_source,
    utm_term: attribution.utm_term,
  };
}

async function logOrderCreatedEvent({
  attribution,
  campaign,
  currency,
  landingPageId,
  landingSlug,
  offerId,
  offerType,
  quantity,
  totalPriceCents,
  unitPriceCents,
}: {
  attribution: z.infer<typeof attributionSchema>;
  campaign: PromoCampaign;
  currency: "AUD";
  landingPageId: string | null;
  landingSlug: string | null;
  offerId: string;
  offerType: string;
  quantity: number;
  totalPriceCents: number;
  unitPriceCents: number;
}) {
  const payload: EventPayload = {
    anonymous_id: attribution.anonymous_id,
    currency,
    device_type: attribution.device_type ?? "unknown",
    event_name: "order_created",
    fbclid: attribution.fbclid,
    landing_page_id: landingPageId,
    landing_slug: landingSlug,
    lead_id: null,
    meta_ad_id: attribution.meta_ad_id,
    meta_adset_id: attribution.meta_adset_id,
    meta_campaign_id: attribution.meta_campaign_id,
    offer_id: offerId,
    offer_type: offerType,
    path: attribution.path,
    price_cents: unitPriceCents,
    properties: {
      campaign_slug: campaign.slug,
      daypass_quantity: quantity,
      surface: "checkout_daypass_api",
      total_price_cents: totalPriceCents,
      unit_price_cents: unitPriceCents,
    },
    referrer: attribution.referrer,
    session_id: attribution.session_id,
    timestamp: new Date().toISOString(),
    url: attribution.url,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_medium: attribution.utm_medium,
    utm_source: attribution.utm_source,
    utm_term: attribution.utm_term,
  };

  try {
    await insertEventLog(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`order_created event could not be logged: ${message}`);
  }
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<CheckoutResponse>(
      {
        error: "Invalid JSON payload.",
        success: false,
      },
      { status: 400 },
    );
  }

  const parsed = checkoutPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json<CheckoutResponse>(
      {
        error: "Invalid checkout payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
        success: false,
      },
      { status: 400 },
    );
  }

  const parsedAttribution = attributionSchema.safeParse(parsed.data.attribution ?? {});

  if (!parsedAttribution.success) {
    return NextResponse.json<CheckoutResponse>(
      {
        error: "Invalid checkout attribution payload.",
        fieldErrors: parsedAttribution.error.flatten().fieldErrors,
        success: false,
      },
      { status: 400 },
    );
  }

  try {
    const checkoutData = await ensureCampaign001CheckoutData();
    const campaign = await getCampaignForCheckout(parsed.data.campaign_slug, parsed.data.campaign_id, checkoutData.campaign);
    assertCampaignCheckoutAllowed(campaign);

    const offer = checkoutData.offer;

    if (offer.status !== "active") {
      throw new Error("Campaign 001 Daypass offer is not available.");
    }

    const checkoutOption = getStripeDaypassCheckoutOption(offer, parsed.data.quantity);
    assertStripeSecretConfigured();

    const attribution = toPendingOrderAttribution(parsedAttribution.data);
    const { order, orderItem } = await createPendingOrder({
      attribution,
      campaign,
      checkoutOption,
      offer,
      quantity: parsed.data.quantity,
      sourceLandingPageId: parsed.data.source_landing_page_id,
      sourceSlug: parsed.data.source_slug,
    });

    await logOrderCreatedEvent({
      attribution: parsedAttribution.data,
      campaign,
      currency: "AUD",
      landingPageId: parsed.data.source_landing_page_id,
      landingSlug: parsed.data.source_slug,
      offerId: offer.code,
      offerType: offer.offer_type,
      quantity: parsed.data.quantity,
      totalPriceCents: order.total_cents,
      unitPriceCents: checkoutOption.unitPriceCents,
    });

    const session = await createCheckoutSession({
      attribution,
      campaign,
      checkoutOption,
      offer,
      order,
      orderItem,
      quantity: parsed.data.quantity,
      sourceLandingPageId: parsed.data.source_landing_page_id,
      sourceSlug: parsed.data.source_slug,
    });

    await attachCheckoutSessionToOrder(order.id, session.id);

    return NextResponse.json<CheckoutResponse>({
      success: true,
      url: session.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be started.";
    const status = message.includes("not configured") || message.includes("price is not configured") ? 503 : 400;

    return NextResponse.json<CheckoutResponse>(
      {
        error: message,
        success: false,
      },
      { status },
    );
  }
}
