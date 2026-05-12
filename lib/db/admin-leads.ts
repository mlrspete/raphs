import "server-only";

import { adminRangeLabels, getAdminRangeStartIso, normalizeAdminDateRange, readParam } from "@/lib/db/admin-filters";
import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { LandingPageTest, WaitlistLead } from "@/lib/types/database";

export type AdminLeadFilters = {
  range?: string | string[];
  landingPageId?: string | string[];
  utmSource?: string | string[];
  utmCampaign?: string | string[];
  budget?: string | string[];
};

export type AdminLeadRow = WaitlistLead & {
  landingTest: Pick<LandingPageTest, "id" | "slug" | "internal_name"> | null;
};

export type AdminLeadsData = {
  filters: {
    range: ReturnType<typeof normalizeAdminDateRange>;
    landingPageId: string | null;
    utmSource: string | null;
    utmCampaign: string | null;
    budget: string | null;
  };
  rangeLabel: string;
  leads: AdminLeadRow[];
  landingTests: Pick<LandingPageTest, "id" | "slug" | "internal_name">[];
  utmSources: string[];
  utmCampaigns: string[];
  budgets: string[];
};

function unique(values: (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

export async function getAdminLeads(filters: AdminLeadFilters = {}): Promise<AdminLeadsData> {
  const range = normalizeAdminDateRange(filters.range);
  const rangeStartIso = getAdminRangeStartIso(range);
  const landingPageId = readParam(filters.landingPageId);
  const utmSource = readParam(filters.utmSource);
  const utmCampaign = readParam(filters.utmCampaign);
  const budget = readParam(filters.budget);

  try {
    const supabase = await createServerSupabaseAuthClient();
    const testsQuery = supabase
      .from("landing_page_tests")
      .select("id, slug, internal_name")
      .order("created_at", { ascending: false })
      .limit(500);
    let leadsQuery = supabase
      .from("waitlist_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (rangeStartIso) {
      leadsQuery = leadsQuery.gte("created_at", rangeStartIso);
    }

    if (landingPageId) {
      leadsQuery = leadsQuery.eq("source_landing_page_id", landingPageId);
    }

    if (utmSource) {
      leadsQuery = leadsQuery.eq("utm_source", utmSource);
    }

    if (utmCampaign) {
      leadsQuery = leadsQuery.eq("utm_campaign", utmCampaign);
    }

    if (budget) {
      leadsQuery = leadsQuery.eq("budget_range", budget);
    }

    const [{ data: landingTests, error: testsError }, { data: leads, error: leadsError }] = await Promise.all([
      testsQuery,
      leadsQuery,
    ]);

    if (testsError || leadsError) {
      console.error("Admin leads query failed", testsError ?? leadsError);
    }

    const tests = landingTests ?? [];
    const rows = (leads ?? []).map((lead) => ({
      ...lead,
      landingTest:
        tests.find((test) => test.id === lead.source_landing_page_id || test.slug === lead.source_slug) ?? null,
    }));

    return {
      filters: {
        range,
        landingPageId,
        utmSource,
        utmCampaign,
        budget,
      },
      rangeLabel: adminRangeLabels[range],
      leads: rows,
      landingTests: tests,
      utmSources: unique(rows.map((lead) => lead.utm_source)),
      utmCampaigns: unique(rows.map((lead) => lead.utm_campaign)),
      budgets: unique(rows.map((lead) => lead.budget_range)),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Admin leads could not be loaded: ${message}`);

    return {
      filters: {
        range,
        landingPageId,
        utmSource,
        utmCampaign,
        budget,
      },
      rangeLabel: adminRangeLabels[range],
      leads: [],
      landingTests: [],
      utmSources: [],
      utmCampaigns: [],
      budgets: [],
    };
  }
}
