import { campaign001Route, campaign001Slug, sunGodLandingSlug } from "@/lib/domain/campaigns/config";

export type CampaignTimingKey = "starts_at" | "closes_at" | "entries_close_at" | "draw_lock_at" | "draw_at";

export const sunGodPromoRulesSlug = sunGodLandingSlug;

export const campaign001PublicContent = {
  slug: campaign001Slug,
  canonicalRoute: campaign001Route,
  name: "Monroes Sun God Daypass promotion",
  shortName: "Sun God",
  prizeTitle: "2016 Santa Cruz Jason Jessee Purple Pearlescent Sun God deck",
  prizeStatus: "Final prize proof pending",
  prizeDescription:
    "Final prize details are pending. Monroes must add final prize photography, ownership proof, condition notes, verified value, and launch approval before paid promotion.",
  prizeValueDisplay: "Final value pending operator proof",
  rulesUrl: "/promo-rules/sungod",
  refundUrl: "/refund-policy",
  privacyUrl: "/privacy",
  termsUrl: "/terms",
  supportEmailLabel: "support email to be confirmed",
  eligibilitySummary:
    "Australia-only eligibility is intended, but final age, residency, permit, and state/territory requirements need operator and legal review before launch.",
  entryWording: "Eligible Daypass purchases receive free entry into the promotion.",
  noAffiliationDisclaimer:
    "No affiliation, endorsement, sponsorship, or approval by any third-party prize brand, manufacturer, rider, or rights holder is implied unless Monroes publishes verified approval before launch.",
  timings: {
    starts_at: null,
    closes_at: null,
    entries_close_at: null,
    draw_lock_at: null,
    draw_at: null,
  } satisfies Record<CampaignTimingKey, string | null>,
  timingDefinitions: {
    starts_at: "Campaign display/start: when public campaign copy can say the campaign has started.",
    closes_at: "Campaign close: when public campaign promotion and Daypass campaign copy should stop.",
    entries_close_at: "Entries close: when new promo entries stop being issued.",
    draw_lock_at: "Draw lock: when friend Daypass code redemption can no longer change promo entry holder attribution.",
    draw_at: "Planned draw: the intended public draw time after eligible entries are frozen.",
  } satisfies Record<CampaignTimingKey, string>,
  prizeFacts: [
    {
      label: "Prize asset",
      value: "Operator-supplied photography required",
    },
    {
      label: "Condition proof",
      value: "Detailed condition notes required",
    },
    {
      label: "Ownership proof",
      value: "Operator verification required",
    },
    {
      label: "Value",
      value: "Final value pending",
    },
  ],
  mechanics: [
    "Choose 1 to 10 Daypasses for the Sun God promotion.",
    "One Daypass gives the purchaser pending 12-hour member access.",
    "Additional Daypasses create friend Daypass codes that can be redeemed from /redeem.",
    "Each eligible Daypass purchase receives one free promo entry for this promotion.",
    "Friend Daypass code redemption before draw lock can update the current promo entry holder. After draw lock, access may still be granted but attribution does not change.",
  ],
  drawProcess: [
    "Monroes freezes eligible entries after entries close and draw lock.",
    "A draw snapshot should be created before selecting a winner.",
    "The winner notification, publication, claim window, delivery process, and redraw rules require final operator/legal approval before launch.",
  ],
} as const;

export function getPublicCampaignContent(slug: string) {
  return slug === campaign001Slug || slug === sunGodPromoRulesSlug ? campaign001PublicContent : null;
}

export function formatCampaignDateTime(value: string | null) {
  if (!value) {
    return "To be announced before launch";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(value));
}
