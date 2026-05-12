import "server-only";

import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { EventLog, LandingPageTest, LeadPreference, WaitlistLead } from "@/lib/types/database";
import { safeRate } from "@/lib/utils/rates";

export type AdminDateRangeKey = "7d" | "30d" | "all";

export type AdminMetricCounts = {
  uniqueVisitors: number;
  landingViews: number;
  paidIntentClicks: number;
  modalOpens: number;
  waitlistSubmissions: number;
  ctaClickRate: number;
  modalToWaitlistConversion: number;
  overallWaitlistConversion: number;
};

export type AdminLandingTestMetric = LandingPageTest & AdminMetricCounts;

export type AdminBreakdownRow = {
  label: string;
  landingViews: number;
  paidIntentClicks: number;
  waitlistSubmissions: number;
  conversionRate: number;
};

export type AdminOverviewMetrics = {
  range: AdminDateRangeKey;
  rangeLabel: string;
  totals: AdminMetricCounts;
  tests: AdminLandingTestMetric[];
  topSources: AdminBreakdownRow[];
  topOffers: AdminBreakdownRow[];
};

export type AdminLandingTestResults = {
  range: AdminDateRangeKey;
  rangeLabel: string;
  test: LandingPageTest | null;
  metrics: AdminMetricCounts;
  funnel: { label: string; value: number; rateFromPrevious: number }[];
  topSources: AdminBreakdownRow[];
  topCampaigns: AdminBreakdownRow[];
  preferenceSummary: { label: string; value: string; count: number }[];
};

type AdminDataSet = {
  tests: LandingPageTest[];
  events: EventLog[];
  leads: WaitlistLead[];
};

type MutableCounts = {
  visitorIds: Set<string>;
  landingViews: number;
  paidIntentClicks: number;
  modalOpens: number;
  waitlistSubmissions: number;
};

const rangeLabels: Record<AdminDateRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

function emptyMutableCounts(): MutableCounts {
  return {
    visitorIds: new Set<string>(),
    landingViews: 0,
    paidIntentClicks: 0,
    modalOpens: 0,
    waitlistSubmissions: 0,
  };
}

function finalizeCounts(counts: MutableCounts): AdminMetricCounts {
  return {
    uniqueVisitors: counts.visitorIds.size,
    landingViews: counts.landingViews,
    paidIntentClicks: counts.paidIntentClicks,
    modalOpens: counts.modalOpens,
    waitlistSubmissions: counts.waitlistSubmissions,
    ctaClickRate: safeRate(counts.paidIntentClicks, counts.landingViews),
    modalToWaitlistConversion: safeRate(counts.waitlistSubmissions, counts.modalOpens),
    overallWaitlistConversion: safeRate(counts.waitlistSubmissions, counts.landingViews),
  };
}

function normalizeRange(range: string | string[] | undefined): AdminDateRangeKey {
  const value = Array.isArray(range) ? range[0] : range;

  if (value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "30d";
}

function getRangeStartIso(range: AdminDateRangeKey) {
  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 7 : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start.toISOString();
}

function incrementEventCounts(counts: MutableCounts, event: EventLog) {
  if (event.anonymous_id) {
    counts.visitorIds.add(event.anonymous_id);
  }

  if (event.event_name === "landing_viewed") {
    counts.landingViews += 1;
  }

  if (event.event_name === "paid_intent_clicked") {
    counts.paidIntentClicks += 1;
  }

  if (event.event_name === "sold_out_modal_opened") {
    counts.modalOpens += 1;
  }
}

function testKey(test: LandingPageTest) {
  return test.id;
}

function eventMatchesTest(event: EventLog, test: LandingPageTest) {
  return event.landing_page_id === test.id || (!event.landing_page_id && event.landing_slug === test.slug);
}

function leadMatchesTest(lead: WaitlistLead, test: LandingPageTest) {
  return lead.source_landing_page_id === test.id || (!lead.source_landing_page_id && lead.source_slug === test.slug);
}

function addBreakdownEvent(map: Map<string, MutableCounts>, label: string, event: EventLog) {
  const counts = map.get(label) ?? emptyMutableCounts();
  incrementEventCounts(counts, event);
  map.set(label, counts);
}

function addBreakdownLead(map: Map<string, MutableCounts>, label: string) {
  const counts = map.get(label) ?? emptyMutableCounts();
  counts.waitlistSubmissions += 1;
  map.set(label, counts);
}

function toBreakdownRows(map: Map<string, MutableCounts>, limit = 5): AdminBreakdownRow[] {
  return [...map.entries()]
    .map(([label, counts]) => {
      const finalized = finalizeCounts(counts);

      return {
        label,
        landingViews: finalized.landingViews,
        paidIntentClicks: finalized.paidIntentClicks,
        waitlistSubmissions: finalized.waitlistSubmissions,
        conversionRate: finalized.overallWaitlistConversion,
      };
    })
    .sort((a, b) => b.waitlistSubmissions - a.waitlistSubmissions || b.paidIntentClicks - a.paidIntentClicks)
    .slice(0, limit);
}

async function getAdminData(range: AdminDateRangeKey): Promise<AdminDataSet> {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const rangeStartIso = getRangeStartIso(range);
    const testsQuery = supabase
      .from("landing_page_tests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    let eventsQuery = supabase
      .from("event_logs")
      .select("*")
      .in("event_name", [
        "landing_viewed",
        "paid_intent_clicked",
        "offer_intent_clicked",
        "sold_out_modal_opened",
        "waitlist_submitted",
        "budget_selected",
        "category_selected",
        "brand_interest_added",
      ])
      .order("created_at", { ascending: false })
      .limit(10000);
    let leadsQuery = supabase
      .from("waitlist_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (rangeStartIso) {
      eventsQuery = eventsQuery.gte("created_at", rangeStartIso);
      leadsQuery = leadsQuery.gte("created_at", rangeStartIso);
    }

    const [{ data: tests, error: testsError }, { data: events, error: eventsError }, { data: leads, error: leadsError }] =
      await Promise.all([testsQuery, eventsQuery, leadsQuery]);

    if (testsError || eventsError || leadsError) {
      console.error("Admin metrics query failed", testsError ?? eventsError ?? leadsError);
    }

    return {
      tests: tests ?? [],
      events: events ?? [],
      leads: leads ?? [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Admin metrics could not be loaded: ${message}`);

    return {
      tests: [],
      events: [],
      leads: [],
    };
  }
}

function buildTestMetrics(data: AdminDataSet): AdminLandingTestMetric[] {
  const countsByTest = new Map<string, MutableCounts>();

  for (const test of data.tests) {
    countsByTest.set(testKey(test), emptyMutableCounts());
  }

  for (const event of data.events) {
    const test = data.tests.find((item) => eventMatchesTest(event, item));

    if (!test) {
      continue;
    }

    incrementEventCounts(countsByTest.get(testKey(test)) ?? emptyMutableCounts(), event);
  }

  for (const lead of data.leads) {
    const test = data.tests.find((item) => leadMatchesTest(lead, item));

    if (!test) {
      continue;
    }

    const counts = countsByTest.get(testKey(test)) ?? emptyMutableCounts();
    counts.waitlistSubmissions += 1;
    countsByTest.set(testKey(test), counts);
  }

  return data.tests.map((test) => ({
    ...test,
    ...finalizeCounts(countsByTest.get(testKey(test)) ?? emptyMutableCounts()),
  }));
}

function buildOverviewBreakdowns(data: AdminDataSet) {
  const sourceMap = new Map<string, MutableCounts>();
  const offerMap = new Map<string, MutableCounts>();

  for (const event of data.events) {
    const sourceLabel = [event.utm_source || "direct / unknown", event.utm_campaign].filter(Boolean).join(" / ");
    const offerLabel = [event.offer_type || "unknown offer", event.currency && event.price_cents ? `${event.currency} ${(event.price_cents / 100).toFixed(2)}` : null]
      .filter(Boolean)
      .join(" / ");

    addBreakdownEvent(sourceMap, sourceLabel, event);
    addBreakdownEvent(offerMap, offerLabel, event);
  }

  for (const lead of data.leads) {
    const sourceLabel = [lead.utm_source || "direct / unknown", lead.utm_campaign].filter(Boolean).join(" / ");
    const offerLabel = [lead.offer_type || "unknown offer", lead.currency && lead.price_cents ? `${lead.currency} ${(lead.price_cents / 100).toFixed(2)}` : null]
      .filter(Boolean)
      .join(" / ");

    addBreakdownLead(sourceMap, sourceLabel);
    addBreakdownLead(offerMap, offerLabel);
  }

  return {
    topSources: toBreakdownRows(sourceMap),
    topOffers: toBreakdownRows(offerMap),
  };
}

function buildTotals(data: AdminDataSet): AdminMetricCounts {
  const counts = emptyMutableCounts();

  for (const event of data.events) {
    incrementEventCounts(counts, event);
  }

  counts.waitlistSubmissions = data.leads.length;

  return finalizeCounts(counts);
}

export async function getAdminOverviewMetrics(rangeInput?: string | string[]): Promise<AdminOverviewMetrics> {
  const range = normalizeRange(rangeInput);
  const data = await getAdminData(range);
  const tests = buildTestMetrics(data);
  const { topSources, topOffers } = buildOverviewBreakdowns(data);

  return {
    range,
    rangeLabel: rangeLabels[range],
    totals: buildTotals(data),
    tests,
    topSources,
    topOffers,
  };
}

export async function getLandingTestMetrics(rangeInput?: string | string[]) {
  const range = normalizeRange(rangeInput);
  const data = await getAdminData(range);

  return {
    range,
    rangeLabel: rangeLabels[range],
    tests: buildTestMetrics(data),
  };
}

export async function getLandingTestResults(testId: string, rangeInput?: string | string[]): Promise<AdminLandingTestResults> {
  const range = normalizeRange(rangeInput);
  const data = await getAdminData(range);
  const test = data.tests.find((item) => item.id === testId) ?? null;

  if (!test) {
    return {
      range,
      rangeLabel: rangeLabels[range],
      test: null,
      metrics: finalizeCounts(emptyMutableCounts()),
      funnel: [],
      topSources: [],
      topCampaigns: [],
      preferenceSummary: [],
    };
  }

  const testEvents = data.events.filter((event) => eventMatchesTest(event, test));
  const testLeads = data.leads.filter((lead) => leadMatchesTest(lead, test));
  const counts = emptyMutableCounts();

  for (const event of testEvents) {
    incrementEventCounts(counts, event);
  }

  counts.waitlistSubmissions = testLeads.length;

  const metrics = finalizeCounts(counts);
  const sourceMap = new Map<string, MutableCounts>();
  const campaignMap = new Map<string, MutableCounts>();

  for (const event of testEvents) {
    addBreakdownEvent(sourceMap, event.utm_source || "direct / unknown", event);
    addBreakdownEvent(campaignMap, event.utm_campaign || "no campaign", event);
  }

  for (const lead of testLeads) {
    addBreakdownLead(sourceMap, lead.utm_source || "direct / unknown");
    addBreakdownLead(campaignMap, lead.utm_campaign || "no campaign");
  }

  return {
    range,
    rangeLabel: rangeLabels[range],
    test,
    metrics,
    funnel: [
      { label: "Landing views", value: metrics.landingViews, rateFromPrevious: 1 },
      { label: "Paid-intent clicks", value: metrics.paidIntentClicks, rateFromPrevious: metrics.ctaClickRate },
      { label: "Sold-out modal opens", value: metrics.modalOpens, rateFromPrevious: safeRate(metrics.modalOpens, metrics.paidIntentClicks) },
      { label: "Waitlist leads", value: metrics.waitlistSubmissions, rateFromPrevious: metrics.modalToWaitlistConversion },
    ],
    topSources: toBreakdownRows(sourceMap),
    topCampaigns: toBreakdownRows(campaignMap),
    preferenceSummary: await getPreferenceSummary(testLeads),
  };
}

async function getPreferenceSummary(leads: WaitlistLead[]) {
  const directSummary = new Map<string, number>();
  const leadIds = leads.map((lead) => lead.id);
  const addSummary = (label: string, value: string | null) => {
    if (!value) {
      return;
    }

    const key = `${label}:${value}`;
    directSummary.set(key, (directSummary.get(key) ?? 0) + 1);
  };

  for (const lead of leads) {
    addSummary("Budget", lead.budget_range);
    addSummary("Intent", lead.buyer_seller_intent);
    addSummary("Likelihood", lead.likelihood_to_buy);
  }

  if (leadIds.length > 0) {
    try {
      const supabase = await createServerSupabaseAuthClient();
      const { data, error } = await supabase
        .from("lead_preferences")
        .select("*")
        .in("lead_id", leadIds)
        .limit(10000);

      if (error) {
        console.error(`Preference summary query failed: ${error.message}`);
      }

      for (const preference of (data ?? []) as LeadPreference[]) {
        const label = preference.preference_type.replaceAll("_", " ");
        addSummary(label, preference.preference_value);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Preference summary could not be loaded: ${message}`);
    }
  }

  return [...directSummary.entries()]
    .map(([key, count]) => {
      const [label, ...valueParts] = key.split(":");

      return {
        label,
        value: valueParts.join(":"),
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
