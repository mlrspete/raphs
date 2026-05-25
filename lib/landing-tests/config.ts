import type { LandingTestConfig } from "@/lib/landing-tests/types";

export const soldOutModalCopy = {
  modalHeadline: "SOLD OUT",
  modalBody:
    "This promotion has sold out. Thanks for the support. Join the waitlist and we\u2019ll email you when more Daypasses become available.",
  waitlistCta: "JOIN WAITLIST",
} as const;

export const landingPageTests: LandingTestConfig[] = [
  {
    id: "24cf88d0-8f5a-46b9-8d4c-2d19504e1cd0",
    slug: "campaign-001",
    status: "live",
    internalName: "Campaign 001 real Daypass checkout",
    headline: "WIN THE 2016 JASON JESSEE SUN GOD REISSUE.",
    subheadline:
      "Get a Monroes Daypass, browse the members-only deck market, and receive free entry into the Sun God deck promotion with each eligible Daypass.",
    offerType: "daypass",
    offerId: "daypass_campaign_001",
    priceCents: 499,
    currency: "AUD",
    priceDisplay: "$4.99 AUD",
    categoryFocus: "Campaign 001 Daypass access and promo entry",
    heroImageUrl: null,
    ctaPrimary: "GET DAYPASS",
    ctaSecondary: "VIEW PROMO RULES",
    modalHeadline: "CHECKOUT UNAVAILABLE",
    modalBody:
      "Campaign 001 checkout is not available right now. Please check back soon or contact support if you expected access.",
    waitlistCta: "CHECK BACK SOON",
    sections: [
      {
        id: "campaign-001-daypass",
        eyebrow: "12-hour access",
        title: "Paid Daypass utility before the draw.",
        body: "Campaign 001 gives buyers a real 12-hour look inside the Monroes members market before any later Monroes Ultra decision.",
        bullets: ["$4.99 AUD Daypass", "Member-only listings", "Eligible purchase includes a free promo entry"],
      },
      {
        id: "campaign-001-promo",
        eyebrow: "Promo entry",
        title: "A simple paid campaign MVP.",
        body: "The checkout flow creates a pending order first, then payment processor confirmation is handled separately.",
      },
    ],
    faqItems: [
      {
        question: "Does checkout create my access immediately?",
        answer:
          "No. Payment is confirmed by our processor after checkout. The success page only confirms that our processor redirected you back.",
      },
      {
        question: "Do I need an account before buying?",
        answer:
          "No. You can pay first. Later, log in with the same email used at checkout so Monroes can link your member profile.",
      },
    ],
    configJson: {
      audience: "real_campaign_buyers",
      bonusEntryLabel: "1 free entry into Campaign 001 with each eligible Daypass purchase",
      campaignLimit: 100,
      campaignSlug: "campaign-001",
      canonicalRoute: "/l/sungod",
      checkoutEnabled: true,
      experimentAngle: "campaign_001_checkout",
      rulesUrl: "/promo-rules/sungod",
      mediaItems: [
        {
          title: "Campaign 001",
          label: "Daypass | promo entry",
          tone: "orange",
        },
        {
          title: "Private market",
          label: "12-hour member access",
          tone: "mint",
        },
      ],
      unitPriceCents: 499,
    },
  },
  {
    id: "0f3d7b2e-6f24-45dc-b63a-5883d56bf90a",
    slug: "preview-pass",
    status: "live",
    internalName: "Daypass angle",
    headline: "Get a Daypass look inside Monroes.",
    subheadline:
      "A low-friction Daypass for Australian deck hunters who want to see whether a curated members market is worth their attention.",
    offerType: "preview_pass",
    offerId: "one_day_preview_pass",
    priceCents: 499,
    currency: "AUD",
    priceDisplay: "$4.99 AUD",
    categoryFocus: "OG, rare, vintage, and interesting skateboard decks",
    heroImageUrl: null,
    ctaPrimary: "Get Daypass",
    ctaSecondary: "Unlock access",
    ...soldOutModalCopy,
    sections: [
      {
        id: "why-preview",
        eyebrow: "Tiny commitment",
        title: "Peek at the members market before going Ultra.",
        body: "The Daypass gives buyers a quick paid look at the members market after arriving from Monroes ads.",
        bullets: ["One-day access", "Australia-only positioning", "No seller account needed"],
      },
      {
        id: "deck-energy",
        eyebrow: "Deck focus",
        title: "Made for boards with better stories than stock listings.",
        body: "This angle leans into curiosity: OG graphics, clean wall-hangers, rare shapes, and decks that feel hard to stumble across twice.",
      },
    ],
    faqItems: [
      {
        question: "What comes with the Daypass?",
        answer: "It gives buyers a short look at the curated Monroes members market before deciding whether to join Monroes Ultra.",
      },
      {
        question: "Is the Daypass in AUD?",
        answer: "Yes. The Daypass is priced at $4.99 AUD.",
      },
    ],
    configJson: {
      audience: "curious_buyers",
      experimentAngle: "low_price_preview",
      mediaItems: [
        {
          title: "Preview wall",
          label: "Fast look | curated deck energy",
          tone: "orange",
        },
        {
          title: "Rare shapes",
          label: "OG, vintage, oddball",
          tone: "mint",
        },
      ],
    },
  },
  {
    id: "aa6cae98-586b-4a55-98a0-6b9fb8eab125",
    slug: "monthly-pass",
    status: "live",
    internalName: "Monroes Ultra angle",
    headline: "Monroes Ultra access for skateboard decks worth checking first.",
    subheadline:
      "For Australian buyers who would rather browse a tighter, more curated members market than refresh scattered listings all week.",
    offerType: "monthly_pass",
    offerId: "monthly_marketplace_pass",
    priceCents: 2499,
    currency: "AUD",
    priceDisplay: "$24.99 AUD/month",
    categoryFocus: "curated monthly access",
    heroImageUrl: null,
    ctaPrimary: "Join Monroes Ultra",
    ctaSecondary: "Unlock access",
    ...soldOutModalCopy,
    sections: [
      {
        id: "monthly-value",
        eyebrow: "Ongoing access",
        title: "Built for people who want the first look, not the leftover feed.",
        body: "The monthly angle frames Monroes Ultra as an always-on members market for buyers who want recurring access.",
        bullets: ["$24.99 AUD/month positioning", "Curated members market feel", "Buyer demand signal for Monroes Ultra"],
      },
      {
        id: "market-quality",
        eyebrow: "More signal",
        title: "A tighter market for interesting decks.",
        body: "The copy frames Monroes as more selective than a general classifieds browse, while staying bright and approachable.",
      },
    ],
    faqItems: [
      {
        question: "What is Monroes Ultra?",
        answer: "It is a $24.99 AUD/month access concept for the Monroes members market.",
      },
      {
        question: "Who is this angle for?",
        answer: "Australian buyers who want a recurring curated place to check for OG, rare, vintage, and interesting decks.",
      },
    ],
    configJson: {
      audience: "high_intent_buyers",
      experimentAngle: "monthly_access",
      mediaItems: [
        {
          title: "Monthly drop",
          label: "Recurring access | AUD pricing",
          tone: "lilac",
        },
        {
          title: "Private browse",
          label: "Tighter market | less noise",
          tone: "peach",
        },
      ],
    },
  },
  {
    id: "7a89834e-8455-4325-9fab-9e55c67d70e5",
    slug: "upgrade-access",
    status: "live",
    internalName: "Upgrade and collector-intent angle",
    headline: "Preview first, then upgrade if the deck market feels right.",
    subheadline:
      "A collector-intent angle for buyers who want a small first step before committing to monthly private member access.",
    offerType: "upgrade_pass",
    offerId: "preview_to_monthly_upgrade",
    priceCents: 2000,
    currency: "AUD",
    priceDisplay: "$20 AUD upgrade",
    categoryFocus: "collector-intent upgrade path",
    heroImageUrl: null,
    ctaPrimary: "Unlock access",
    ctaSecondary: "Get preview access",
    ...soldOutModalCopy,
    sections: [
      {
        id: "upgrade-path",
        eyebrow: "Flexible intent",
        title: "A cleaner path from preview curiosity to monthly access.",
        body: "This angle gives buyers a preview-first path that can roll into monthly access without feeling like a double charge.",
        bullets: ["$20 AUD upgrade concept", "Preview-first positioning", "Collector-oriented copy"],
      },
      {
        id: "collector-signal",
        eyebrow: "Buyer signal",
        title: "For people who know what they are looking at.",
        body: "The angle speaks to buyers who care about condition, era, graphics, scarcity, and whether a board feels worth watching.",
      },
    ],
    faqItems: [
      {
        question: "What does the upgrade price mean?",
        answer: "It presents a $20 AUD path from Daypass access into Monroes Ultra.",
      },
      {
        question: "Is this for collectors only?",
        answer: "No. It is aimed at higher-intent buyers, including collectors, skaters, and people who love interesting deck finds.",
      },
    ],
    configJson: {
      audience: "collector_intent",
      experimentAngle: "preview_upgrade",
      mediaItems: [
        {
          title: "Upgrade path",
          label: "Preview first | upgrade later",
          tone: "mint",
        },
        {
          title: "Collector signal",
          label: "Condition, era, story",
          tone: "orange",
        },
      ],
    },
  },
];

export function getLandingTestBySlug(slug: string) {
  return landingPageTests.find((test) => test.slug === slug);
}
