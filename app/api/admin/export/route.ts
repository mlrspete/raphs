import { NextRequest, NextResponse } from "next/server";

import { getAdminAuthState } from "@/lib/auth/admin";
import { csvResponse, rowsToCsv, type CsvRow } from "@/lib/csv/export";
import { getAdminRangeStartIso, normalizeAdminDateRange, readParam } from "@/lib/db/admin-filters";
import { getAdminOverviewMetrics } from "@/lib/db/admin-metrics";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database";
import { formatCurrencyFromCents } from "@/lib/utils/format";
import { formatPercent } from "@/lib/utils/rates";

export const dynamic = "force-dynamic";

type ExportType = "leads" | "events" | "landing-tests";

const exportTypes = ["leads", "events", "landing-tests"] as const;

function isExportType(value: string | null): value is ExportType {
  return exportTypes.includes(value as ExportType);
}

function getParam(request: NextRequest, key: string) {
  return readParam(request.nextUrl.searchParams.get(key) ?? undefined);
}

async function logExport(adminUserId: string, exportType: ExportType, filters: Record<string, Json>) {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("export_logs").insert({
      admin_user_id: adminUserId,
      export_type: exportType,
      filters_json: filters,
    });

    if (error) {
      console.error(`Export log insert failed: ${error.message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Export log could not be written: ${message}`);
  }
}

export async function GET(request: NextRequest) {
  const authState = await getAdminAuthState();

  if (authState.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (authState.status === "denied") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = getParam(request, "type");

  if (!isExportType(type)) {
    return NextResponse.json({ error: "Unsupported export type" }, { status: 400 });
  }

  const range = normalizeAdminDateRange(request.nextUrl.searchParams.get("range") ?? undefined);
  const filters = {
    range,
    landingPageId: getParam(request, "landingPageId"),
    utmSource: getParam(request, "utmSource"),
    utmCampaign: getParam(request, "utmCampaign"),
    budget: getParam(request, "budget"),
    eventName: getParam(request, "eventName"),
  };

  let response: Response;

  if (type === "leads") {
    response = await exportLeads(filters);
  } else if (type === "events") {
    response = await exportEvents(filters);
  } else {
    response = await exportLandingTestSummary(filters.range);
  }

  await logExport(authState.user.id, type, filters);

  return response;
}

async function exportLeads(filters: {
  range: ReturnType<typeof normalizeAdminDateRange>;
  landingPageId: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  budget: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const rangeStartIso = getAdminRangeStartIso(filters.range);
  let query = supabase
    .from("waitlist_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (rangeStartIso) {
    query = query.gte("created_at", rangeStartIso);
  }

  if (filters.landingPageId) {
    query = query.eq("source_landing_page_id", filters.landingPageId);
  }

  if (filters.utmSource) {
    query = query.eq("utm_source", filters.utmSource);
  }

  if (filters.utmCampaign) {
    query = query.eq("utm_campaign", filters.utmCampaign);
  }

  if (filters.budget) {
    query = query.eq("budget_range", filters.budget);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Lead export failed: ${error.message}`);
  }

  const headers = [
    "email",
    "first_name",
    "source_slug",
    "utm_source",
    "utm_campaign",
    "budget_range",
    "buyer_seller_intent",
    "likelihood_to_buy",
    "offer_type",
    "price_cents",
    "currency",
    "created_at",
  ];
  const rows: CsvRow[] = (data ?? []).map((lead) => ({
    email: lead.email,
    first_name: lead.first_name,
    source_slug: lead.source_slug,
    utm_source: lead.utm_source,
    utm_campaign: lead.utm_campaign,
    budget_range: lead.budget_range,
    buyer_seller_intent: lead.buyer_seller_intent,
    likelihood_to_buy: lead.likelihood_to_buy,
    offer_type: lead.offer_type,
    price_cents: lead.price_cents,
    currency: lead.currency,
    created_at: lead.created_at,
  }));

  return csvResponse(rowsToCsv(rows, headers), `raphs-leads-${filters.range}.csv`);
}

async function exportEvents(filters: {
  range: ReturnType<typeof normalizeAdminDateRange>;
  landingPageId: string | null;
  eventName: string | null;
}) {
  const supabase = createAdminSupabaseClient();
  const rangeStartIso = getAdminRangeStartIso(filters.range);
  let query = supabase
    .from("event_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (rangeStartIso) {
    query = query.gte("created_at", rangeStartIso);
  }

  if (filters.landingPageId) {
    query = query.eq("landing_page_id", filters.landingPageId);
  }

  if (filters.eventName) {
    query = query.eq("event_name", filters.eventName);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Event export failed: ${error.message}`);
  }

  const headers = [
    "event_name",
    "landing_slug",
    "offer_type",
    "price",
    "utm_source",
    "utm_campaign",
    "session_id",
    "anonymous_id",
    "created_at",
    "properties",
  ];
  const rows: CsvRow[] = (data ?? []).map((event) => ({
    event_name: event.event_name,
    landing_slug: event.landing_slug,
    offer_type: event.offer_type,
    price: formatCurrencyFromCents(event.price_cents, event.currency ?? "AUD"),
    utm_source: event.utm_source,
    utm_campaign: event.utm_campaign,
    session_id: event.session_id,
    anonymous_id: event.anonymous_id,
    created_at: event.created_at,
    properties: event.properties,
  }));

  return csvResponse(rowsToCsv(rows, headers), `raphs-events-${filters.range}.csv`);
}

async function exportLandingTestSummary(range: ReturnType<typeof normalizeAdminDateRange>) {
  const metrics = await getAdminOverviewMetrics(range);
  const headers = [
    "status",
    "slug",
    "internal_name",
    "offer_type",
    "price_display",
    "landing_views",
    "paid_intent_clicks",
    "modal_opens",
    "waitlist_submissions",
    "cta_click_rate",
    "modal_to_waitlist_conversion",
    "overall_waitlist_conversion",
  ];
  const rows: CsvRow[] = metrics.tests.map((test) => ({
    status: test.status,
    slug: test.slug,
    internal_name: test.internal_name,
    offer_type: test.offer_type,
    price_display: test.price_display,
    landing_views: test.landingViews,
    paid_intent_clicks: test.paidIntentClicks,
    modal_opens: test.modalOpens,
    waitlist_submissions: test.waitlistSubmissions,
    cta_click_rate: formatPercent(test.ctaClickRate),
    modal_to_waitlist_conversion: formatPercent(test.modalToWaitlistConversion),
    overall_waitlist_conversion: formatPercent(test.overallWaitlistConversion),
  }));

  return csvResponse(rowsToCsv(rows, headers), `raphs-landing-tests-${range}.csv`);
}
