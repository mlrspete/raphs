import "server-only";

import {
  adminRangeLabels,
  getAdminRangeStartIso,
  normalizeAdminDateRange,
  readParam,
  type AdminDateRangeKey,
} from "@/lib/db/admin-filters";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  AccessGrant,
  DaypassCode,
  MemberProfile,
  Order,
  OrderItem,
  OutboundEmail,
  PromoCampaign,
  PromoEntry,
  StripeWebhookEvent,
} from "@/lib/types/database";

export type AdminV1StatusFilter = string | null;
export type AdminV1RedeemedFilter = "redeemed" | "unredeemed" | null;

export type AdminV1Filters = {
  range: AdminDateRangeKey;
  campaignSlug: string | null;
  status: AdminV1StatusFilter;
  redeemed: AdminV1RedeemedFilter;
};

export type AdminV1Overview = {
  range: AdminDateRangeKey;
  rangeLabel: string;
  paidOrders: number;
  revenueCents: number;
  currency: string;
  fulfilledOrders: number;
  refundedOrders: number;
  cancelledOrders: number;
  daypassesSold: number;
  codesCreated: number;
  codesRedeemed: number;
  entriesIssued: number;
  activeEntries: number;
  refundedEntries: number;
  cancelledEntries: number;
  voidEntries: number;
  activeAccessGrants: number;
  recentWebhookEvents: AdminWebhookEventReportRow[];
  recentOutboundEmails: AdminOutboundEmailReportRow[];
};

export type AdminOrderReportRow = {
  id: string;
  createdAt: string;
  purchaserEmail: string | null;
  status: string;
  totalCents: number;
  currency: string;
  quantity: number;
  campaignName: string | null;
  campaignSlug: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  fulfilledAt: string | null;
  sourceSlug: string | null;
};

export type AdminEntryReportRow = {
  id: string;
  campaignName: string | null;
  campaignSlug: string | null;
  entryNumber: number;
  displayAlias: string;
  ownerEmail: string | null;
  currentHolderEmail: string | null;
  referrerEmail: string | null;
  daypassCodeLast4: string | null;
  status: string;
  lockedAt: string | null;
  createdAt: string;
  orderId: string | null;
};

export type AdminCodeReportRow = {
  id: string;
  campaignName: string | null;
  campaignSlug: string | null;
  orderId: string | null;
  purchaserEmail: string | null;
  purchaserEmailNormalized: string;
  codeLast4: string;
  status: string;
  redeemedByEmail: string | null;
  redeemedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export type AdminAccessGrantReportRow = {
  id: string;
  memberEmail: string | null;
  orderId: string | null;
  daypassCodeLast4: string | null;
  campaignName: string | null;
  campaignSlug: string | null;
  accessType: string;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type AdminWebhookEventReportRow = {
  id: string;
  stripeEventId: string;
  eventType: string;
  stripeCheckoutSessionId: string | null;
  processingStatus: string;
  relatedOrderId: string | null;
  errorMessage: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export type AdminOutboundEmailReportRow = {
  id: string;
  provider: string;
  providerMessageId: string | null;
  recipientEmail: string;
  templateKey: string;
  idempotencyKey: string;
  relatedOrderId: string | null;
  campaignName: string | null;
  campaignSlug: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
};

type SafeDaypassCode = Pick<
  DaypassCode,
  | "id"
  | "purchaser_member_profile_id"
  | "purchaser_email_normalized"
  | "order_id"
  | "order_item_id"
  | "campaign_id"
  | "code_last4"
  | "status"
  | "redeemed_by_member_profile_id"
  | "redeemed_at"
  | "access_grant_id"
  | "created_at"
  | "expires_at"
>;

type AdminV1DataSet = {
  range: AdminDateRangeKey;
  orders: Order[];
  orderItems: OrderItem[];
  accessGrants: AccessGrant[];
  codes: SafeDaypassCode[];
  entries: PromoEntry[];
  campaigns: PromoCampaign[];
  members: MemberProfile[];
  webhookEvents: StripeWebhookEvent[];
  outboundEmails: OutboundEmail[];
};

const paidOrderStatuses = new Set(["paid", "fulfilled"]);

export function normalizeAdminV1Filters(input: {
  range?: string | string[];
  campaign?: string | string[];
  campaignSlug?: string | string[];
  status?: string | string[];
  redeemed?: string | string[];
}): AdminV1Filters {
  const redeemed = readParam(input.redeemed);

  return {
    range: normalizeAdminDateRange(input.range),
    campaignSlug: readParam(input.campaignSlug) ?? readParam(input.campaign),
    status: readParam(input.status),
    redeemed: redeemed === "redeemed" || redeemed === "unredeemed" ? redeemed : null,
  };
}

async function getAdminV1Data(range: AdminDateRangeKey): Promise<AdminV1DataSet> {
  const supabase = createAdminSupabaseClient();
  const rangeStartIso = getAdminRangeStartIso(range);

  let ordersQuery = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10000);
  let accessQuery = supabase
    .from("access_grants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);
  let codesQuery = supabase
    .from("daypass_codes")
    .select(
      "id,purchaser_member_profile_id,purchaser_email_normalized,order_id,order_item_id,campaign_id,code_last4,status,redeemed_by_member_profile_id,redeemed_at,access_grant_id,created_at,expires_at",
    )
    .order("created_at", { ascending: false })
    .limit(10000);
  let entriesQuery = supabase
    .from("promo_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);
  let webhookQuery = supabase
    .from("stripe_webhook_events")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(1000);
  let emailQuery = supabase
    .from("outbound_emails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (rangeStartIso) {
    ordersQuery = ordersQuery.gte("created_at", rangeStartIso);
    accessQuery = accessQuery.gte("created_at", rangeStartIso);
    codesQuery = codesQuery.gte("created_at", rangeStartIso);
    entriesQuery = entriesQuery.gte("created_at", rangeStartIso);
    webhookQuery = webhookQuery.gte("received_at", rangeStartIso);
    emailQuery = emailQuery.gte("created_at", rangeStartIso);
  }

  const [
    ordersResult,
    orderItemsResult,
    accessResult,
    codesResult,
    entriesResult,
    campaignsResult,
    membersResult,
    webhookResult,
    emailResult,
  ] = await Promise.all([
    ordersQuery,
    supabase.from("order_items").select("*").order("created_at", { ascending: false }).limit(10000),
    accessQuery,
    codesQuery,
    entriesQuery,
    supabase.from("promo_campaigns").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("member_profiles").select("*").order("created_at", { ascending: false }).limit(10000),
    webhookQuery,
    emailQuery,
  ]);

  for (const [label, error] of [
    ["orders", ordersResult.error],
    ["order_items", orderItemsResult.error],
    ["access_grants", accessResult.error],
    ["daypass_codes", codesResult.error],
    ["promo_entries", entriesResult.error],
    ["promo_campaigns", campaignsResult.error],
    ["member_profiles", membersResult.error],
    ["stripe_webhook_events", webhookResult.error],
    ["outbound_emails", emailResult.error],
  ] as const) {
    if (error) {
      console.error(`Admin V1 ${label} query failed: ${error.message}`);
    }
  }

  return {
    range,
    orders: ordersResult.data ?? [],
    orderItems: orderItemsResult.data ?? [],
    accessGrants: accessResult.data ?? [],
    codes: (codesResult.data ?? []) as SafeDaypassCode[],
    entries: entriesResult.data ?? [],
    campaigns: campaignsResult.data ?? [],
    members: membersResult.data ?? [],
    webhookEvents: webhookResult.data ?? [],
    outboundEmails: emailResult.data ?? [],
  };
}

function indexById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function orderItemsByOrder(data: AdminV1DataSet) {
  const map = new Map<string, OrderItem[]>();

  for (const item of data.orderItems) {
    map.set(item.order_id, [...(map.get(item.order_id) ?? []), item]);
  }

  return map;
}

function firstCampaignForOrder(items: OrderItem[], campaignsById: Map<string, PromoCampaign>) {
  const campaignId = items.find((item) => item.campaign_id)?.campaign_id;
  return campaignId ? campaignsById.get(campaignId) ?? null : null;
}

function orderQuantity(items: OrderItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function memberEmail(memberId: string | null | undefined, membersById: Map<string, MemberProfile>) {
  return memberId ? membersById.get(memberId)?.email ?? null : null;
}

function campaignFilterMatches(campaignSlug: string | null, rowCampaignSlug: string | null) {
  return !campaignSlug || rowCampaignSlug === campaignSlug;
}

function statusFilterMatches(status: string | null, rowStatus: string) {
  return !status || rowStatus === status;
}

function redeemedFilterMatches(redeemed: AdminV1RedeemedFilter, rowStatus: string) {
  if (!redeemed) {
    return true;
  }

  return redeemed === "redeemed" ? rowStatus === "redeemed" : rowStatus !== "redeemed";
}

function buildOrderRows(data: AdminV1DataSet): AdminOrderReportRow[] {
  const itemsByOrder = orderItemsByOrder(data);
  const campaignsById = indexById(data.campaigns);

  return data.orders.map((order) => {
    const items = itemsByOrder.get(order.id) ?? [];
    const campaign = firstCampaignForOrder(items, campaignsById);

    return {
      id: order.id,
      createdAt: order.created_at,
      purchaserEmail: order.purchaser_email,
      status: order.status,
      totalCents: order.total_cents,
      currency: order.currency,
      quantity: orderQuantity(items),
      campaignName: campaign?.name ?? null,
      campaignSlug: campaign?.slug ?? null,
      stripeCheckoutSessionId: order.stripe_checkout_session_id,
      stripePaymentIntentId: order.stripe_payment_intent_id,
      fulfilledAt: order.fulfilled_at,
      sourceSlug: order.source_slug,
    };
  });
}

function buildEntryRows(data: AdminV1DataSet): AdminEntryReportRow[] {
  const campaignsById = indexById(data.campaigns);
  const membersById = indexById(data.members);
  const codesById = indexById(data.codes);

  return data.entries.map((entry) => {
    const campaign = campaignsById.get(entry.campaign_id) ?? null;
    const code = entry.daypass_code_id ? codesById.get(entry.daypass_code_id) ?? null : null;

    return {
      id: entry.id,
      campaignName: campaign?.name ?? null,
      campaignSlug: campaign?.slug ?? null,
      entryNumber: entry.entry_number,
      displayAlias: entry.display_alias,
      ownerEmail: memberEmail(entry.owner_member_profile_id, membersById) ?? entry.owner_email_normalized,
      currentHolderEmail: memberEmail(entry.current_holder_member_profile_id, membersById),
      referrerEmail: memberEmail(entry.referrer_member_profile_id, membersById),
      daypassCodeLast4: code?.code_last4 ?? null,
      status: entry.status,
      lockedAt: entry.locked_at,
      createdAt: entry.created_at,
      orderId: entry.order_id,
    };
  });
}

function buildCodeRows(data: AdminV1DataSet): AdminCodeReportRow[] {
  const campaignsById = indexById(data.campaigns);
  const membersById = indexById(data.members);
  const ordersById = indexById(data.orders);

  return data.codes.map((code) => {
    const campaign = code.campaign_id ? campaignsById.get(code.campaign_id) ?? null : null;
    const order = code.order_id ? ordersById.get(code.order_id) ?? null : null;

    return {
      id: code.id,
      campaignName: campaign?.name ?? null,
      campaignSlug: campaign?.slug ?? null,
      orderId: code.order_id,
      purchaserEmail:
        memberEmail(code.purchaser_member_profile_id, membersById) ??
        order?.purchaser_email ??
        code.purchaser_email_normalized,
      purchaserEmailNormalized: code.purchaser_email_normalized,
      codeLast4: code.code_last4,
      status: code.status,
      redeemedByEmail: memberEmail(code.redeemed_by_member_profile_id, membersById),
      redeemedAt: code.redeemed_at,
      createdAt: code.created_at,
      expiresAt: code.expires_at,
    };
  });
}

function buildAccessRows(data: AdminV1DataSet): AdminAccessGrantReportRow[] {
  const campaignsById = indexById(data.campaigns);
  const membersById = indexById(data.members);
  const itemsById = indexById(data.orderItems);
  const codesById = indexById(data.codes);

  return data.accessGrants.map((grant) => {
    const code = grant.daypass_code_id ? codesById.get(grant.daypass_code_id) ?? null : null;
    const item = grant.order_item_id ? itemsById.get(grant.order_item_id) ?? null : null;
    const campaignId = code?.campaign_id ?? item?.campaign_id ?? null;
    const campaign = campaignId ? campaignsById.get(campaignId) ?? null : null;

    return {
      id: grant.id,
      memberEmail: memberEmail(grant.member_profile_id, membersById),
      orderId: grant.order_id,
      daypassCodeLast4: code?.code_last4 ?? null,
      campaignName: campaign?.name ?? null,
      campaignSlug: campaign?.slug ?? null,
      accessType: grant.access_type,
      status: grant.status,
      startsAt: grant.starts_at,
      expiresAt: grant.expires_at,
      createdAt: grant.created_at,
      revokedAt: grant.revoked_at,
    };
  });
}

function buildWebhookRows(data: AdminV1DataSet): AdminWebhookEventReportRow[] {
  return data.webhookEvents.map((event) => ({
    id: event.id,
    stripeEventId: event.stripe_event_id,
    eventType: event.event_type,
    stripeCheckoutSessionId: event.stripe_checkout_session_id,
    processingStatus: event.processing_status,
    relatedOrderId: event.related_order_id,
    errorMessage: event.error_message,
    receivedAt: event.received_at,
    processedAt: event.processed_at,
  }));
}

function buildOutboundEmailRows(data: AdminV1DataSet): AdminOutboundEmailReportRow[] {
  const campaignsById = indexById(data.campaigns);

  return data.outboundEmails.map((email) => {
    const campaign = email.related_campaign_id ? campaignsById.get(email.related_campaign_id) ?? null : null;

    return {
      id: email.id,
      provider: email.provider,
      providerMessageId: email.provider_message_id,
      recipientEmail: email.recipient_email,
      templateKey: email.template_key,
      idempotencyKey: email.idempotency_key,
      relatedOrderId: email.related_order_id,
      campaignName: campaign?.name ?? null,
      campaignSlug: campaign?.slug ?? null,
      status: email.status,
      errorMessage: email.error_message,
      createdAt: email.created_at,
      sentAt: email.sent_at,
    };
  });
}

export async function getAdminV1Overview(rangeInput?: string | string[]): Promise<AdminV1Overview> {
  const range = normalizeAdminDateRange(rangeInput);
  const data = await getAdminV1Data(range);
  const orderRows = buildOrderRows(data);
  const paidOrders = orderRows.filter((order) => paidOrderStatuses.has(order.status));
  const paidOrderIds = new Set(paidOrders.map((order) => order.id));
  const daypassesSold = data.orderItems
    .filter((item) => item.item_type === "daypass" && paidOrderIds.has(item.order_id))
    .reduce((total, item) => total + item.quantity, 0);

  return {
    range,
    rangeLabel: adminRangeLabels[range],
    paidOrders: paidOrders.length,
    revenueCents: paidOrders.reduce((total, order) => total + order.totalCents, 0),
    currency: paidOrders[0]?.currency ?? "AUD",
    fulfilledOrders: orderRows.filter((order) => order.status === "fulfilled").length,
    refundedOrders: orderRows.filter((order) => order.status === "refunded").length,
    cancelledOrders: orderRows.filter((order) => order.status === "cancelled").length,
    daypassesSold,
    codesCreated: data.codes.length,
    codesRedeemed: data.codes.filter((code) => code.status === "redeemed").length,
    entriesIssued: data.entries.length,
    activeEntries: data.entries.filter((entry) => entry.status === "active" || entry.status === "winner").length,
    refundedEntries: data.entries.filter((entry) => entry.status === "refunded").length,
    cancelledEntries: data.entries.filter((entry) => entry.status === "cancelled").length,
    voidEntries: data.entries.filter((entry) => entry.status === "void" || entry.status === "disqualified").length,
    activeAccessGrants: data.accessGrants.filter((grant) => grant.status === "active").length,
    recentWebhookEvents: buildWebhookRows(data).slice(0, 8),
    recentOutboundEmails: buildOutboundEmailRows(data).slice(0, 8),
  };
}

export async function getAdminOrdersReport(filters: AdminV1Filters): Promise<AdminOrderReportRow[]> {
  const data = await getAdminV1Data(filters.range);

  return buildOrderRows(data).filter(
    (row) =>
      statusFilterMatches(filters.status, row.status) &&
      campaignFilterMatches(filters.campaignSlug, row.campaignSlug),
  );
}

export async function getAdminEntriesReport(filters: AdminV1Filters): Promise<AdminEntryReportRow[]> {
  const data = await getAdminV1Data(filters.range);

  return buildEntryRows(data).filter(
    (row) =>
      statusFilterMatches(filters.status, row.status) && campaignFilterMatches(filters.campaignSlug, row.campaignSlug),
  );
}

export async function getAdminCodesReport(filters: AdminV1Filters): Promise<AdminCodeReportRow[]> {
  const data = await getAdminV1Data(filters.range);

  return buildCodeRows(data).filter(
    (row) =>
      statusFilterMatches(filters.status, row.status) &&
      redeemedFilterMatches(filters.redeemed, row.status) &&
      campaignFilterMatches(filters.campaignSlug, row.campaignSlug),
  );
}

export async function getAdminAccessGrantsReport(
  filters: AdminV1Filters,
): Promise<AdminAccessGrantReportRow[]> {
  const data = await getAdminV1Data(filters.range);

  return buildAccessRows(data).filter(
    (row) =>
      statusFilterMatches(filters.status, row.status) && campaignFilterMatches(filters.campaignSlug, row.campaignSlug),
  );
}

export async function getAdminWebhookEventsReport(filters: AdminV1Filters): Promise<AdminWebhookEventReportRow[]> {
  const data = await getAdminV1Data(filters.range);

  return buildWebhookRows(data).filter((row) => statusFilterMatches(filters.status, row.processingStatus));
}

export async function getAdminOutboundEmailsReport(filters: AdminV1Filters): Promise<AdminOutboundEmailReportRow[]> {
  const data = await getAdminV1Data(filters.range);

  return buildOutboundEmailRows(data).filter(
    (row) =>
      statusFilterMatches(filters.status, row.status) && campaignFilterMatches(filters.campaignSlug, row.campaignSlug),
  );
}
