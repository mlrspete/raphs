import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  LandingPageViewModel,
  LandingTestCurrency,
  LandingTestFaqItem,
  LandingTestMediaItem,
  LandingTestOfferType,
  LandingTestSection,
  LandingTestStatus,
} from "@/lib/landing-tests/types";
import type { Json, LandingPageTest } from "@/lib/types/database";

const liveStatus = "live";
const defaultCampaignLimit = 100;
const defaultBonusEntryLabel = "1 free entry into the featured promo item";
const defaultPreviewPassPriceCents = 499;

function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readPositiveInteger(value: Json | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function isSection(value: Json) {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === "string" && typeof value.title === "string" && typeof value.body === "string";
}

function isFaqItem(value: Json) {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.question === "string" && typeof value.answer === "string";
}

function isMediaItem(value: Json) {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.title === "string" && typeof value.label === "string";
}

function readArray<T>(value: Json | undefined, guard: (item: Json) => boolean): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(guard) as T[];
}

function normalizeLandingPage(row: LandingPageTest): LandingPageViewModel {
  const configJson = isRecord(row.config_json) ? row.config_json : {};

  return {
    id: row.id,
    slug: row.slug,
    status: row.status as LandingTestStatus,
    headline: row.headline,
    subheadline: row.subheadline,
    offerType: row.offer_type as LandingTestOfferType | null,
    offerId: readString(configJson.offerId),
    priceCents: row.price_cents,
    currency: row.currency as LandingTestCurrency,
    priceDisplay: row.price_display,
    categoryFocus: row.category_focus,
    heroImageUrl: row.hero_image_url,
    ctaPrimary: row.cta_primary ?? "Get preview access",
    ctaSecondary: row.cta_secondary ?? "Join the access list",
    modalHeadline: row.modal_headline,
    modalBody: row.modal_body,
    waitlistCta: row.waitlist_cta,
    campaignLimit: readPositiveInteger(configJson.campaignLimit) ?? defaultCampaignLimit,
    bonusEntryLabel: readString(configJson.bonusEntryLabel) ?? defaultBonusEntryLabel,
    unitPriceCents:
      readPositiveInteger(configJson.unitPriceCents) ?? row.price_cents ?? defaultPreviewPassPriceCents,
    sections: readArray<LandingTestSection>(configJson.sections, isSection),
    faqItems: readArray<LandingTestFaqItem>(configJson.faqItems, isFaqItem),
    mediaItems: readArray<LandingTestMediaItem>(configJson.mediaItems, isMediaItem),
    configJson,
  };
}

export const getLandingPageBySlug = cache(async (slug: string) => {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("landing_page_tests")
      .select("*")
      .eq("slug", slug)
      .eq("status", liveStatus)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error(`Failed to fetch landing page "${slug}": ${error.message}`);
      }

      return null;
    }

    return normalizeLandingPage(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Landing page lookup failed for "${slug}": ${message}`);
    return null;
  }
});
