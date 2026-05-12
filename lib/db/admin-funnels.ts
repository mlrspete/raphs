import "server-only";

import { adminRangeLabels, getAdminRangeStartIso, normalizeAdminDateRange } from "@/lib/db/admin-filters";
import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { EventLog, LandingPageTest, WaitlistLead } from "@/lib/types/database";
import { safeRate } from "@/lib/utils/rates";

export type FunnelStepKey =
  | "landing_viewed"
  | "paid_intent_clicked"
  | "sold_out_modal_opened"
  | "waitlist_form_started"
  | "waitlist_submitted";

export type AdminFunnelStep = {
  key: FunnelStepKey;
  label: string;
  count: number;
  conversionFromPrevious: number;
  conversionFromFirst: number;
  dropOffFromPrevious: number;
};

export type AdminFunnelRow = {
  landingPageId: string;
  landingSlug: string;
  internalName: string;
  offerType: string | null;
  priceDisplay: string | null;
  steps: AdminFunnelStep[];
};

export type AdminFunnelsData = {
  range: ReturnType<typeof normalizeAdminDateRange>;
  rangeLabel: string;
  rows: AdminFunnelRow[];
};

const funnelSteps: { key: FunnelStepKey; label: string }[] = [
  { key: "landing_viewed", label: "Landing viewed" },
  { key: "paid_intent_clicked", label: "Paid intent" },
  { key: "sold_out_modal_opened", label: "Modal opened" },
  { key: "waitlist_form_started", label: "Form started" },
  { key: "waitlist_submitted", label: "Waitlist submitted" },
];

function eventMatchesTest(event: EventLog, test: LandingPageTest) {
  return event.landing_page_id === test.id || (!event.landing_page_id && event.landing_slug === test.slug);
}

function leadMatchesTest(lead: WaitlistLead, test: LandingPageTest) {
  return lead.source_landing_page_id === test.id || (!lead.source_landing_page_id && lead.source_slug === test.slug);
}

function buildSteps(counts: Record<FunnelStepKey, number>): AdminFunnelStep[] {
  return funnelSteps.map((step, index) => {
    const previousCount = index === 0 ? counts[step.key] : counts[funnelSteps[index - 1].key];
    const firstCount = counts[funnelSteps[0].key];
    const conversionFromPrevious = index === 0 ? 1 : safeRate(counts[step.key], previousCount);

    return {
      key: step.key,
      label: step.label,
      count: counts[step.key],
      conversionFromPrevious,
      conversionFromFirst: index === 0 ? 1 : safeRate(counts[step.key], firstCount),
      dropOffFromPrevious: index === 0 ? 0 : Math.max(0, 1 - conversionFromPrevious),
    };
  });
}

export async function getAdminFunnels(rangeInput?: string | string[]): Promise<AdminFunnelsData> {
  const range = normalizeAdminDateRange(rangeInput);
  const rangeStartIso = getAdminRangeStartIso(range);

  try {
    const supabase = await createServerSupabaseAuthClient();
    const testsQuery = supabase
      .from("landing_page_tests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    let eventsQuery = supabase
      .from("event_logs")
      .select("*")
      .in("event_name", funnelSteps.map((step) => step.key))
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
      console.error("Admin funnels query failed", testsError ?? eventsError ?? leadsError);
    }

    const rows = (tests ?? []).map((test) => {
      const counts: Record<FunnelStepKey, number> = {
        landing_viewed: 0,
        paid_intent_clicked: 0,
        sold_out_modal_opened: 0,
        waitlist_form_started: 0,
        waitlist_submitted: 0,
      };

      for (const event of events ?? []) {
        if (!eventMatchesTest(event, test) || !funnelSteps.some((step) => step.key === event.event_name)) {
          continue;
        }

        counts[event.event_name as FunnelStepKey] += 1;
      }

      const matchedLeadCount = (leads ?? []).filter((lead) => leadMatchesTest(lead, test)).length;
      counts.waitlist_submitted = Math.max(counts.waitlist_submitted, matchedLeadCount);

      return {
        landingPageId: test.id,
        landingSlug: test.slug,
        internalName: test.internal_name,
        offerType: test.offer_type,
        priceDisplay: test.price_display,
        steps: buildSteps(counts),
      };
    });

    return {
      range,
      rangeLabel: adminRangeLabels[range],
      rows,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Admin funnels could not be loaded: ${message}`);

    return {
      range,
      rangeLabel: adminRangeLabels[range],
      rows: [],
    };
  }
}
