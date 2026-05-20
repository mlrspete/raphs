import { NextRequest, NextResponse } from "next/server";

import { getAdminAuthState } from "@/lib/auth/admin";
import { csvResponse, rowsToCsv, type CsvRow } from "@/lib/csv/export";
import { getAdminRangeStartIso, normalizeAdminDateRange, readParam } from "@/lib/db/admin-filters";
import { getAdminOverviewMetrics } from "@/lib/db/admin-metrics";
import {
  getAdminAccessGrantsReport,
  getAdminCodesReport,
  getAdminEntriesReport,
  getAdminOrdersReport,
  getAdminOutboundEmailsReport,
  getAdminWebhookEventsReport,
  normalizeAdminV1Filters,
  type AdminV1Filters,
} from "@/lib/db/admin-v1-reports";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database";
import { formatCurrencyFromCents } from "@/lib/utils/format";
import { formatPercent } from "@/lib/utils/rates";

export const dynamic = "force-dynamic";

type ExportType =
  | "leads"
  | "events"
  | "landing-tests"
  | "orders"
  | "entries"
  | "codes"
  | "access-grants"
  | "webhook-events"
  | "outbound-emails";

const exportTypes = [
  "leads",
  "events",
  "landing-tests",
  "orders",
  "entries",
  "codes",
  "access-grants",
  "webhook-events",
  "outbound-emails",
] as const;

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
    campaignSlug: getParam(request, "campaignSlug") ?? getParam(request, "campaign"),
    status: getParam(request, "status"),
    redeemed: getParam(request, "redeemed"),
  };
  const v1Filters = normalizeAdminV1Filters({
    range,
    campaignSlug: filters.campaignSlug ?? undefined,
    status: filters.status ?? undefined,
    redeemed: filters.redeemed ?? undefined,
  });

  let response: Response;

  if (type === "leads") {
    response = await exportLeads(filters);
  } else if (type === "events") {
    response = await exportEvents(filters);
  } else if (type === "landing-tests") {
    response = await exportLandingTestSummary(filters.range);
  } else if (type === "orders") {
    response = await exportOrders(v1Filters);
  } else if (type === "entries") {
    response = await exportEntries(v1Filters);
  } else if (type === "codes") {
    response = await exportCodes(v1Filters);
  } else if (type === "access-grants") {
    response = await exportAccessGrants(v1Filters);
  } else if (type === "webhook-events") {
    response = await exportWebhookEvents(v1Filters);
  } else {
    response = await exportOutboundEmails(v1Filters);
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

  return csvResponse(rowsToCsv(rows, headers), `monroes-leads-${filters.range}.csv`);
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

  return csvResponse(rowsToCsv(rows, headers), `monroes-events-${filters.range}.csv`);
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

  return csvResponse(rowsToCsv(rows, headers), `monroes-landing-tests-${range}.csv`);
}

async function exportOrders(filters: AdminV1Filters) {
  const orders = await getAdminOrdersReport(filters);
  const headers = [
    "order_id",
    "created_at",
    "purchaser_email",
    "status",
    "total_cents",
    "currency",
    "quantity",
    "campaign_slug",
    "campaign_name",
    "stripe_checkout_session_id",
    "stripe_payment_intent_id",
    "fulfilled_at",
    "source_slug",
  ];
  const rows: CsvRow[] = orders.map((order) => ({
    order_id: order.id,
    created_at: order.createdAt,
    purchaser_email: order.purchaserEmail,
    status: order.status,
    total_cents: order.totalCents,
    currency: order.currency,
    quantity: order.quantity,
    campaign_slug: order.campaignSlug,
    campaign_name: order.campaignName,
    stripe_checkout_session_id: order.stripeCheckoutSessionId,
    stripe_payment_intent_id: order.stripePaymentIntentId,
    fulfilled_at: order.fulfilledAt,
    source_slug: order.sourceSlug,
  }));

  return csvResponse(rowsToCsv(rows, headers), `monroes-orders-${filters.range}.csv`);
}

async function exportEntries(filters: AdminV1Filters) {
  const entries = await getAdminEntriesReport(filters);
  const headers = [
    "campaign_slug",
    "campaign_name",
    "entry_number",
    "display_alias",
    "owner_email",
    "current_holder_email",
    "referrer_email",
    "daypass_code_last4",
    "status",
    "locked_at",
    "created_at",
    "order_id",
  ];
  const rows: CsvRow[] = entries.map((entry) => ({
    campaign_slug: entry.campaignSlug,
    campaign_name: entry.campaignName,
    entry_number: entry.entryNumber,
    display_alias: entry.displayAlias,
    owner_email: entry.ownerEmail,
    current_holder_email: entry.currentHolderEmail,
    referrer_email: entry.referrerEmail,
    daypass_code_last4: entry.daypassCodeLast4,
    status: entry.status,
    locked_at: entry.lockedAt,
    created_at: entry.createdAt,
    order_id: entry.orderId,
  }));

  return csvResponse(rowsToCsv(rows, headers), `monroes-entries-${filters.range}.csv`);
}

async function exportCodes(filters: AdminV1Filters) {
  const codes = await getAdminCodesReport(filters);
  const headers = [
    "campaign_slug",
    "campaign_name",
    "order_id",
    "purchaser_email",
    "purchaser_email_normalized",
    "code_last4",
    "status",
    "redeemed_by_email",
    "redeemed_at",
    "created_at",
    "expires_at",
  ];
  const rows: CsvRow[] = codes.map((code) => ({
    campaign_slug: code.campaignSlug,
    campaign_name: code.campaignName,
    order_id: code.orderId,
    purchaser_email: code.purchaserEmail,
    purchaser_email_normalized: code.purchaserEmailNormalized,
    code_last4: code.codeLast4,
    status: code.status,
    redeemed_by_email: code.redeemedByEmail,
    redeemed_at: code.redeemedAt,
    created_at: code.createdAt,
    expires_at: code.expiresAt,
  }));

  return csvResponse(rowsToCsv(rows, headers), `monroes-codes-${filters.range}.csv`);
}

async function exportAccessGrants(filters: AdminV1Filters) {
  const grants = await getAdminAccessGrantsReport(filters);
  const headers = [
    "access_grant_id",
    "member_email",
    "order_id",
    "daypass_code_last4",
    "campaign_slug",
    "campaign_name",
    "access_type",
    "status",
    "starts_at",
    "expires_at",
    "created_at",
    "revoked_at",
  ];
  const rows: CsvRow[] = grants.map((grant) => ({
    access_grant_id: grant.id,
    member_email: grant.memberEmail,
    order_id: grant.orderId,
    daypass_code_last4: grant.daypassCodeLast4,
    campaign_slug: grant.campaignSlug,
    campaign_name: grant.campaignName,
    access_type: grant.accessType,
    status: grant.status,
    starts_at: grant.startsAt,
    expires_at: grant.expiresAt,
    created_at: grant.createdAt,
    revoked_at: grant.revokedAt,
  }));

  return csvResponse(rowsToCsv(rows, headers), `monroes-access-grants-${filters.range}.csv`);
}

async function exportWebhookEvents(filters: AdminV1Filters) {
  const events = await getAdminWebhookEventsReport(filters);
  const headers = [
    "stripe_event_id",
    "event_type",
    "stripe_checkout_session_id",
    "processing_status",
    "related_order_id",
    "error_message",
    "received_at",
    "processed_at",
  ];
  const rows: CsvRow[] = events.map((event) => ({
    stripe_event_id: event.stripeEventId,
    event_type: event.eventType,
    stripe_checkout_session_id: event.stripeCheckoutSessionId,
    processing_status: event.processingStatus,
    related_order_id: event.relatedOrderId,
    error_message: event.errorMessage,
    received_at: event.receivedAt,
    processed_at: event.processedAt,
  }));

  return csvResponse(rowsToCsv(rows, headers), `monroes-webhook-events-${filters.range}.csv`);
}

async function exportOutboundEmails(filters: AdminV1Filters) {
  const emails = await getAdminOutboundEmailsReport(filters);
  const headers = [
    "provider",
    "provider_message_id",
    "recipient_email",
    "template_key",
    "idempotency_key",
    "related_order_id",
    "campaign_slug",
    "campaign_name",
    "status",
    "error_message",
    "created_at",
    "sent_at",
  ];
  const rows: CsvRow[] = emails.map((email) => ({
    provider: email.provider,
    provider_message_id: email.providerMessageId,
    recipient_email: email.recipientEmail,
    template_key: email.templateKey,
    idempotency_key: email.idempotencyKey,
    related_order_id: email.relatedOrderId,
    campaign_slug: email.campaignSlug,
    campaign_name: email.campaignName,
    status: email.status,
    error_message: email.errorMessage,
    created_at: email.createdAt,
    sent_at: email.sentAt,
  }));

  return csvResponse(rowsToCsv(rows, headers), `monroes-outbound-emails-${filters.range}.csv`);
}
