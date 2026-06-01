import "server-only";

import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";

import { listingSeeds } from "@/data/listings";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

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

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingSeed = Database["public"]["Tables"]["listings"]["Insert"];

const defaultListingLimit = 24;
const maxListingLimit = 60;
const previewStatsRowLimit = 1000;
const seedListingTimestamp = "1970-01-01T00:00:00.000Z";

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

function mapSeedToListingRow(listing: ListingSeed): ListingRow {
  return {
    brand: listing.brand ?? null,
    condition_label: listing.condition_label ?? null,
    created_at: listing.created_at ?? seedListingTimestamp,
    currency: listing.currency ?? "AUD",
    deck_year: listing.deck_year ?? null,
    era: listing.era ?? null,
    facts_json: listing.facts_json ?? {},
    id: listing.id ?? `seed:${listing.slug}`,
    is_featured: listing.is_featured ?? false,
    is_member_only: listing.is_member_only ?? true,
    location_region: listing.location_region ?? null,
    price_cents: listing.price_cents ?? null,
    primary_image_url: listing.primary_image_url ?? null,
    slug: listing.slug,
    sort_order: listing.sort_order ?? 0,
    status: listing.status ?? "draft",
    title: listing.title,
    updated_at: listing.updated_at ?? seedListingTimestamp,
  };
}

function matchesLiveListingFilters(listing: ListingRow, filters: LiveListingFilters) {
  if (listing.status !== "live") {
    return false;
  }

  if (filters.brand && listing.brand !== filters.brand) {
    return false;
  }

  if (filters.condition && listing.condition_label !== filters.condition) {
    return false;
  }

  if (filters.era && listing.era !== filters.era) {
    return false;
  }

  if (typeof filters.featured === "boolean" && listing.is_featured !== filters.featured) {
    return false;
  }

  if (filters.priceMode === "poa") {
    return listing.price_cents === null;
  }

  if (
    (typeof filters.minPriceCents === "number" || typeof filters.maxPriceCents === "number") &&
    listing.price_cents === null
  ) {
    return false;
  }

  if (typeof filters.minPriceCents === "number" && (listing.price_cents ?? 0) < filters.minPriceCents) {
    return false;
  }

  if (typeof filters.maxPriceCents === "number" && (listing.price_cents ?? 0) > filters.maxPriceCents) {
    return false;
  }

  return true;
}

function sortListings(a: ListingRow, b: ListingRow) {
  if (a.sort_order !== b.sort_order) {
    return a.sort_order - b.sort_order;
  }

  return b.created_at.localeCompare(a.created_at);
}

function getMissingSeedListings(filters: LiveListingFilters, existingSeedSlugs: Set<string>) {
  return listingSeeds
    .map(mapSeedToListingRow)
    .filter((listing) => !existingSeedSlugs.has(listing.slug))
    .filter((listing) => matchesLiveListingFilters(listing, filters));
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
    const limit = normalizeLimit(filters.limit);
    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "live")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

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

    const seedSlugs = listingSeeds.map((listing) => listing.slug);
    const [{ data, error }, { data: existingSeedRows, error: existingSeedRowsError }] = await Promise.all([
      query,
      supabase.from("listings").select("slug, status").in("slug", seedSlugs),
    ]);

    if (error) {
      console.error(`Live listings lookup failed: ${error.message}`);
      return [];
    }

    if (existingSeedRowsError) {
      console.error(`Seed listing status lookup failed: ${existingSeedRowsError.message}`);
    }

    const dbListings = data ?? [];
    const existingSeedSlugs = new Set(
      existingSeedRowsError ? seedSlugs : (existingSeedRows ?? []).map((listing) => listing.slug),
    );

    return [...dbListings, ...getMissingSeedListings(filters, existingSeedSlugs)].sort(sortListings).slice(0, limit);
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
