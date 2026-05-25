import { campaign001Slug, sunGodLandingSlug } from "@/lib/domain/campaigns/config";
import { campaign001PublicContent } from "@/lib/domain/campaigns/publicContent";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

const campaign001LandingSlugs = new Set([
  campaign001Slug,
  sunGodLandingSlug,
  "first-preview-drop",
  "preview-pass",
  "monthly-pass",
  "upgrade-access",
]);

export function isCampaign001LandingSlug(slug: string) {
  return campaign001LandingSlugs.has(slug);
}

export function getCampaign001LandingFallback(slug: string): LandingPageViewModel | null {
  if (!isCampaign001LandingSlug(slug)) {
    return null;
  }

  const publicLandingSlug = slug === sunGodLandingSlug ? sunGodLandingSlug : campaign001Slug;

  return {
    bonusEntryLabel: campaign001PublicContent.entryWording,
    campaignLimit: 100,
    categoryFocus: "Sun God Daypass promotion",
    configJson: {
      campaignFallback: true,
      canonicalRoute: campaign001PublicContent.canonicalRoute,
      campaignSlug: campaign001Slug,
      checkoutEnabled: true,
      rulesUrl: campaign001PublicContent.rulesUrl,
    },
    ctaPrimary: "GET DAYPASS",
    ctaSecondary: "VIEW PROMO RULES",
    currency: "AUD",
    faqItems: [],
    headline: "WIN THE 2016 JASON JESSEE SUN GOD REISSUE.",
    heroImageUrl: null,
    id: "",
    mediaItems: [],
    modalBody: null,
    modalHeadline: null,
    offerId: "daypass_campaign_001",
    offerType: "daypass",
    priceCents: 499,
    priceDisplay: "$4.99 AUD",
    sections: [],
    slug: publicLandingSlug,
    status: "live",
    subheadline:
      "Get a Monroes Daypass, browse the members-only deck market, and receive free entry into the Sun God deck promotion with each eligible Daypass.",
    unitPriceCents: 499,
    waitlistCta: null,
  };
}
