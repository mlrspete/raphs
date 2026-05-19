import type { Json } from "@/lib/types/database";

export type LandingTestStatus = "draft" | "live" | "paused" | "archived";

export type LandingTestCurrency = "AUD";

export type LandingTestOfferType = "daypass" | "preview_pass" | "monthly_pass" | "upgrade_pass";

export type LandingTestSection = {
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
};

export type LandingTestFaqItem = {
  question: string;
  answer: string;
};

export type LandingTestMediaItem = {
  title: string;
  label: string;
  imageUrl?: string | null;
  tone?: "orange" | "mint" | "lilac" | "peach";
};

export type LandingTestConfig = {
  id: string;
  slug: string;
  status: LandingTestStatus;
  internalName: string;
  headline: string;
  subheadline: string;
  offerType: LandingTestOfferType;
  offerId: string;
  priceCents: number;
  currency: LandingTestCurrency;
  priceDisplay: string;
  categoryFocus: string;
  heroImageUrl: string | null;
  ctaPrimary: string;
  ctaSecondary: string;
  modalHeadline: string;
  modalBody: string;
  waitlistCta: string;
  sections: LandingTestSection[];
  faqItems: LandingTestFaqItem[];
  configJson?: Record<string, Json>;
};

export type LandingPageViewModel = {
  id: string;
  slug: string;
  status: LandingTestStatus;
  headline: string;
  subheadline: string | null;
  offerType: LandingTestOfferType | null;
  offerId: string | null;
  priceCents: number | null;
  currency: LandingTestCurrency;
  priceDisplay: string | null;
  categoryFocus: string | null;
  heroImageUrl: string | null;
  ctaPrimary: string;
  ctaSecondary: string;
  modalHeadline: string | null;
  modalBody: string | null;
  waitlistCta: string | null;
  campaignLimit: number;
  bonusEntryLabel: string;
  unitPriceCents: number;
  sections: LandingTestSection[];
  faqItems: LandingTestFaqItem[];
  mediaItems: LandingTestMediaItem[];
  configJson: Record<string, Json>;
};
