import type { Database } from "@/lib/types/database";

type PromoCampaignSeed = Database["public"]["Tables"]["promo_campaigns"]["Insert"];

export const campaign001Slug = "campaign-001";
export const sunGodLandingSlug = "sungod";
export const campaign001LegacyRoute = `/l/${campaign001Slug}`;
export const campaign001Route = `/l/${sunGodLandingSlug}`;

// Timing definitions:
// starts_at controls campaign display/start.
// closes_at controls general campaign/public close copy.
// entries_close_at controls when new promo entries stop being accepted/issued, if applicable.
// draw_lock_at controls when friend-code redemption can no longer change promo entry attribution.
// draw_at is the planned public draw time.
export const campaignSeeds = [
  {
    id: "f8e7c176-24f6-4a59-9fae-a6b86af39a91",
    slug: campaign001Slug,
    status: "draft",
    name: "Monroes Campaign 001",
    short_name: "Sun God",
    prize_title: "2016 Santa Cruz Jason Jessee Purple Pearlescent Sun God deck - final asset pending",
    prize_description:
      "Final prize proof, prize copy, asset photography, value confirmation, and launch approval must be supplied before this campaign goes live.",
    prize_value_cents: null,
    currency: "AUD",
    entry_limit: null,
    starts_at: null,
    closes_at: null,
    entries_close_at: null,
    draw_lock_at: null,
    draw_at: null,
    rules_url: "/promo-rules/sungod",
    terms_version: "campaign-001-draft",
    config_json: {
      canonicalRoute: campaign001Route,
      copyWarnings: [
        "Campaign not launch-ready. Do not launch before final prize proof is supplied.",
        "Replace placeholder prize facts, imagery, eligibility summary, and disclaimer before paid traffic.",
      ],
      drawTimingPlaceholders: {
        startsAt: null,
        closesAt: null,
        entriesCloseAt: null,
        drawLockAt: null,
        drawAt: null,
      },
      eligibilitySummary:
        "Placeholder: Australia-only eligibility summary must be reviewed against the final promo rules before launch.",
      noAffiliationDisclaimer:
        "Placeholder: add final no-affiliation/no-endorsement disclaimer for the prize brand and any named parties before launch.",
      prizeFacts: {
        assetStatus: "final_asset_pending",
        copyStatus: "draft_placeholder",
        ownershipStatus: "to_be_confirmed_before_launch",
        proofRequired: true,
      },
      timingDefinitions: {
        starts_at: "Controls campaign display/start.",
        closes_at: "Controls general campaign/public close copy.",
        entries_close_at: "Controls when new promo entries stop being accepted/issued, if applicable.",
        draw_lock_at: "Controls when friend-code redemption can no longer change promo entry attribution.",
        draw_at: "Planned public draw time.",
      },
    },
  },
] satisfies PromoCampaignSeed[];

export const campaign001 = campaignSeeds[0];
