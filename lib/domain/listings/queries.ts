import "server-only";

import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type LiveListingFilters = {
  brand?: string | null;
  condition?: string | null;
  era?: string | null;
  featured?: boolean | null;
  limit?: number;
  maxPriceCents?: number | null;
  minPriceCents?: number | null;
  priceMode?: "priced" | "poa" | null;
};

export type LiveListingPreviewStats = {
  brandCount: number;
  listingCount: number;
  oldestDeckYear: number | null;
};

const defaultListingLimit = 24;
const maxListingLimit = 60;
const previewStatsRowLimit = 1000;

function normalizeLimit(limit: number | undefined) {
  if (!limit || !Number.isFinite(limit)) {
    return defaultListingLimit;
  }

  return Math.min(maxListingLimit, Math.max(1, Math.trunc(limit)));
}

function calculateLiveListingPreviewStats(
  listings: { brand: string | null; deck_year: number | null }[],
  listingCount: number,
): LiveListingPreviewStats {
  const brands = new Set<string>();
  const deckYears: number[] = [];

  for (const listing of listings) {
    const brand = listing.brand?.trim();

    if (brand) {
      brands.add(brand.toLocaleLowerCase("en-AU"));
    }

    if (typeof listing.deck_year === "number" && Number.isFinite(listing.deck_year)) {
      deckYears.push(listing.deck_year);
    }
  }

  return {
    brandCount: brands.size,
    listingCount,
    oldestDeckYear: deckYears.length > 0 ? Math.min(...deckYears) : null,
  };
}

export const getLiveListingPreviewStats = cache(async (): Promise<LiveListingPreviewStats> => {
  noStore();

  try {
    const supabase = createAdminSupabaseClient();
    const { count, data, error } = await supabase
      .from("listings")
      .select("brand, deck_year", { count: "exact" })
      .eq("status", "live")
      .limit(previewStatsRowLimit);

    if (error) {
      console.error(`Live listing preview stats lookup failed: ${error.message}`);
      return calculateLiveListingPreviewStats([], 0);
    }

    return calculateLiveListingPreviewStats(data ?? [], count ?? data?.length ?? 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Live listing preview stats lookup could not run: ${message}`);
    return calculateLiveListingPreviewStats([], 0);
  }
});

// Server-side only. Call this after an active-access check; listings are not a public/client data surface.
export const getLiveListings = cache(async (filters: LiveListingFilters = {}) => {
  try {
    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "live")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(normalizeLimit(filters.limit));

    if (filters.brand) {
      query = query.eq("brand", filters.brand);
    }

    if (filters.condition) {
      query = query.eq("condition_label", filters.condition);
    }

    if (filters.era) {
      query = query.eq("era", filters.era);
    }

    if (filters.priceMode === "poa") {
      query = query.is("price_cents", null);
    } else {
      if (typeof filters.minPriceCents === "number") {
        query = query.gte("price_cents", filters.minPriceCents);
      }

      if (typeof filters.maxPriceCents === "number") {
        query = query.lte("price_cents", filters.maxPriceCents);
      }
    }

    if (typeof filters.featured === "boolean") {
      query = query.eq("is_featured", filters.featured);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Live listings lookup failed: ${error.message}`);
      return [];
    }

    return data ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Live listings lookup could not run: ${message}`);
    return [];
  }
});

// Server-side only. Call this after an active-access check; featured listings are still member-only data.
export const getFeaturedListings = cache(async (limit = 6) => {
  return getLiveListings({ featured: true, limit });
});
