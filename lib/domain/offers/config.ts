import type { Database } from "@/lib/types/database";

type CommerceOfferSeed = Database["public"]["Tables"]["commerce_offers"]["Insert"];

export const daypassCampaign001OfferCode = "daypass_campaign_001";
export const ultraMonthlyOfferCode = "ultra_monthly";

export const commerceOfferSeeds = [
  {
    id: "9a4935a2-472f-48ea-a6f7-b19dd4f7c1e2",
    code: daypassCampaign001OfferCode,
    status: "active",
    name: "Campaign 001 Daypass",
    offer_type: "daypass",
    stripe_price_id: null,
    unit_price_cents: 499,
    currency: "AUD",
    access_duration_hours: 12,
    config_json: {
      campaignSlug: "campaign-001",
      checkoutEnabled: true,
      manualStripeSetupRequired: true,
      route: "/l/campaign-001",
      stripePriceIdSource:
        "STRIPE_DAYPASS_PRICE_ID or commerce_offers.stripe_price_id for single Daypass; STRIPE_5X_DAYPASS_PRICE_ID and STRIPE_10X_DAYPASS_PRICE_ID for bundles",
    },
  },
  {
    id: "e0459c42-9029-4d2c-ac6b-7c2a9d8a5615",
    code: ultraMonthlyOfferCode,
    status: "active",
    name: "Monroes Ultra",
    offer_type: "subscription",
    stripe_price_id: null,
    unit_price_cents: 2499,
    currency: "AUD",
    access_duration_hours: null,
    config_json: {
      checkoutEnabled: false,
      manualStripeSetupRequired: true,
      referenceOffer: true,
    },
  },
] satisfies CommerceOfferSeed[];
