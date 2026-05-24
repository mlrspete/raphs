import "server-only";

import type Stripe from "stripe";

import { getCheckoutBaseUrl, getStripeClient, type StripeDaypassCheckoutOption } from "@/lib/domain/payments/stripe";
import type { PendingOrderAttribution } from "@/lib/domain/orders/createPendingOrder";
import type { CommerceOffer, Order, OrderItem, PromoCampaign } from "@/lib/types/database";

type CreateCheckoutSessionInput = {
  attribution: PendingOrderAttribution;
  campaign: PromoCampaign;
  checkoutOption: StripeDaypassCheckoutOption;
  offer: CommerceOffer;
  order: Order;
  orderItem: OrderItem;
  quantity: number;
  sourceLandingPageId: string | null;
  sourceSlug: string | null;
};

function metadataValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).slice(0, 500);
}

function createMetadata({
  attribution,
  campaign,
  checkoutOption,
  offer,
  order,
  quantity,
  sourceLandingPageId,
  sourceSlug,
}: CreateCheckoutSessionInput): Stripe.MetadataParam {
  return {
    anonymous_id: metadataValue(attribution.anonymous_id),
    campaign_id: metadataValue(campaign.id),
    checkout_option_code: metadataValue(checkoutOption.code),
    checkout_total_price_cents: metadataValue(checkoutOption.totalPriceCents),
    checkout_unit_price_cents: metadataValue(checkoutOption.unitPriceCents),
    daypass_quantity: metadataValue(quantity),
    landing_page_id: metadataValue(sourceLandingPageId),
    landing_slug: metadataValue(sourceSlug),
    meta_ad_id: metadataValue(attribution.meta_ad_id),
    offer_code: metadataValue(offer.code),
    order_id: metadataValue(order.id),
    session_id: metadataValue(attribution.session_id),
    stripe_price_id: metadataValue(checkoutOption.stripePriceId),
    utm_campaign: metadataValue(attribution.utm_campaign),
    utm_source: metadataValue(attribution.utm_source),
  };
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const stripe = getStripeClient();
  const baseUrl = getCheckoutBaseUrl();
  const metadata = createMetadata(input);
  const session = await stripe.checkout.sessions.create({
    client_reference_id: input.order.id,
    line_items: [
      {
        price: input.checkoutOption.stripePriceId,
        quantity: input.checkoutOption.stripeLineItemQuantity,
      },
    ],
    metadata,
    mode: "payment",
    payment_intent_data: {
      metadata,
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  return {
    id: session.id,
    url: session.url,
  };
}
