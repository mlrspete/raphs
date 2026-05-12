import "server-only";

import { analyticsEventNames } from "@/lib/analytics/types";
import { adminRangeLabels, getAdminRangeStartIso, normalizeAdminDateRange, readParam } from "@/lib/db/admin-filters";
import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { EventLog, LandingPageTest } from "@/lib/types/database";

export type AdminEventFilters = {
  range?: string | string[];
  eventName?: string | string[];
  landingPageId?: string | string[];
};

export type AdminEventRow = EventLog & {
  landingTest: Pick<LandingPageTest, "id" | "slug" | "internal_name"> | null;
};

export type AdminEventsData = {
  filters: {
    range: ReturnType<typeof normalizeAdminDateRange>;
    eventName: string | null;
    landingPageId: string | null;
  };
  rangeLabel: string;
  events: AdminEventRow[];
  landingTests: Pick<LandingPageTest, "id" | "slug" | "internal_name">[];
  eventNames: readonly string[];
};

export async function getAdminEvents(filters: AdminEventFilters = {}): Promise<AdminEventsData> {
  const range = normalizeAdminDateRange(filters.range);
  const rangeStartIso = getAdminRangeStartIso(range);
  const eventName = readParam(filters.eventName);
  const landingPageId = readParam(filters.landingPageId);

  try {
    const supabase = await createServerSupabaseAuthClient();
    const testsQuery = supabase
      .from("landing_page_tests")
      .select("id, slug, internal_name")
      .order("created_at", { ascending: false })
      .limit(500);
    let eventsQuery = supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1500);

    if (rangeStartIso) {
      eventsQuery = eventsQuery.gte("created_at", rangeStartIso);
    }

    if (eventName) {
      eventsQuery = eventsQuery.eq("event_name", eventName);
    }

    if (landingPageId) {
      eventsQuery = eventsQuery.eq("landing_page_id", landingPageId);
    }

    const [{ data: landingTests, error: testsError }, { data: events, error: eventsError }] = await Promise.all([
      testsQuery,
      eventsQuery,
    ]);

    if (testsError || eventsError) {
      console.error("Admin events query failed", testsError ?? eventsError);
    }

    const tests = landingTests ?? [];
    const rows = (events ?? []).map((event) => ({
      ...event,
      landingTest:
        tests.find((test) => test.id === event.landing_page_id || test.slug === event.landing_slug) ?? null,
    }));

    return {
      filters: {
        range,
        eventName,
        landingPageId,
      },
      rangeLabel: adminRangeLabels[range],
      events: rows,
      landingTests: tests,
      eventNames: analyticsEventNames,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Admin events could not be loaded: ${message}`);

    return {
      filters: {
        range,
        eventName,
        landingPageId,
      },
      rangeLabel: adminRangeLabels[range],
      events: [],
      landingTests: [],
      eventNames: analyticsEventNames,
    };
  }
}
