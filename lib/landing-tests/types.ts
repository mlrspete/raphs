import type { Json } from "@/lib/types/database";

export type LandingTestStatus = "draft" | "active" | "paused";

export type LandingTestCurrency = "AUD";

export type LandingTestOfferType = "preview_pass" | "monthly_pass" | "upgrade_pass";

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
