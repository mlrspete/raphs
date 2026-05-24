import { campaign001Slug } from "@/lib/domain/campaigns/config";
import { campaign001PublicContent } from "@/lib/domain/campaigns/publicContent";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

export function getCampaign001LandingFallback(slug: string): LandingPageViewModel | null {
  if (slug !== campaign001Slug) {
    return null;
  }

  return {
    bonusEntryLabel: campaign001PublicContent.entryWording,
    campaignLimit: 100,
    categoryFocus: "Campaign 001 Daypass",
    configJson: {
      campaignFallback: true,
      canonicalRoute: campaign001PublicContent.canonicalRoute,
      campaignSlug: campaign001Slug,
      checkoutEnabled: true,
      rulesUrl: campaign001PublicContent.rulesUrl,
    },
    ctaPrimary: "Get Daypass",
    ctaSecondary: "View promo rules",
    currency: "AUD",
    faqItems: [],
    headline: "Monroes Campaign 001 Daypass",
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
    slug,
    status: "live",
    subheadline:
      "Get a Monroes Daypass and browse the member-only deck market. Eligible Daypass purchases receive free entry into the promotion.",
    unitPriceCents: 499,
    waitlistCta: null,
  };
}
