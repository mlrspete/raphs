import "server-only";

import { cache } from "react";

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

const defaultListingLimit = 24;
const maxListingLimit = 60;

function normalizeLimit(limit: number | undefined) {
  if (!limit || !Number.isFinite(limit)) {
    return defaultListingLimit;
  }

  return Math.min(maxListingLimit, Math.max(1, Math.trunc(limit)));
}

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
