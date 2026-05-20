import "server-only";

import { insertEventLog } from "@/lib/db/events";
import { buildEligibleEntriesCsv } from "@/lib/domain/draws/buildEligibleEntriesCsv";
import { hashCsvSha256 } from "@/lib/domain/draws/hashCsvSha256";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { DrawSnapshot, PromoCampaign } from "@/lib/types/database";
import type { EventPayload } from "@/lib/validation/events";

export const DRAW_REFUND_RULE_CONFIRMATION = "exclude_refunded_cancelled_void";

export type CreateDrawSnapshotInput = {
  adminProfileId: string;
  campaignSlug: string;
  notes?: string | null;
  refundRuleConfirmation: string | null;
};

export type CreateDrawSnapshotResult = {
  csv: string;
  csvSha256: string;
  entryCount: number;
  snapshot: DrawSnapshot;
};

function assertSnapshotWindow(campaign: PromoCampaign) {
  if (!campaign.draw_lock_at) {
    throw new Error("Set draw_lock_at before creating a draw snapshot.");
  }

  if (Date.now() < new Date(campaign.draw_lock_at).getTime()) {
    throw new Error("Create the draw snapshot after draw_lock_at so attribution is frozen.");
  }
}

async function assertNoUnlockedEligibleEntries(campaignId: string) {
  const supabase = createAdminSupabaseClient();
  const { count, error } = await supabase
    .from("promo_entries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "active")
    .is("locked_at", null);

  if (error) {
    throw new Error(`Unlocked entry count could not be checked: ${error.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error("Lock eligible entries before creating the final draw snapshot.");
  }
}

async function logSnapshotCreated({
  campaign,
  csvSha256,
  entryCount,
  snapshotId,
}: {
  campaign: PromoCampaign;
  csvSha256: string;
  entryCount: number;
  snapshotId: string;
}) {
  const payload: EventPayload = {
    anonymous_id: null,
    currency: "AUD",
    device_type: "unknown",
    event_name: "draw_snapshot_created",
    fbclid: null,
    landing_page_id: null,
    landing_slug: campaign.slug,
    lead_id: null,
    meta_ad_id: null,
    meta_adset_id: null,
    meta_campaign_id: null,
    offer_id: null,
    offer_type: null,
    path: "/admin/draws",
    price_cents: null,
    properties: {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      csv_sha256: csvSha256,
      entry_count: entryCount,
      snapshot_id: snapshotId,
      surface: "admin_draws",
    },
    referrer: null,
    session_id: null,
    timestamp: new Date().toISOString(),
    url: null,
    utm_campaign: null,
    utm_content: null,
    utm_medium: null,
    utm_source: null,
    utm_term: null,
  };

  try {
    await insertEventLog(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`draw_snapshot_created event could not be logged: ${message}`);
  }
}

export async function createDrawSnapshot(input: CreateDrawSnapshotInput): Promise<CreateDrawSnapshotResult> {
  if (input.refundRuleConfirmation !== DRAW_REFUND_RULE_CONFIRMATION) {
    throw new Error("Confirm the refund/cancellation rule before creating a final draw snapshot.");
  }

  const supabase = createAdminSupabaseClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("slug", input.campaignSlug)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message ?? "Campaign could not be found.");
  }

  assertSnapshotWindow(campaign);
  await assertNoUnlockedEligibleEntries(campaign.id);

  const eligible = await buildEligibleEntriesCsv({
    campaignId: campaign.id,
    campaignName: campaign.name,
    campaignSlug: campaign.slug,
    requireLocked: true,
  });

  if (eligible.entries.length === 0) {
    throw new Error("No locked active entries are eligible for a draw snapshot.");
  }

  const csvSha256 = hashCsvSha256(eligible.csv);
  const { data: snapshot, error: snapshotError } = await supabase
    .from("draw_snapshots")
    .insert({
      campaign_id: campaign.id,
      created_by: input.adminProfileId,
      csv_sha256: csvSha256,
      entry_count: eligible.entries.length,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(snapshotError?.message ?? "Draw snapshot could not be created.");
  }

  await logSnapshotCreated({
    campaign,
    csvSha256,
    entryCount: eligible.entries.length,
    snapshotId: snapshot.id,
  });

  return {
    csv: eligible.csv,
    csvSha256,
    entryCount: eligible.entries.length,
    snapshot,
  };
}
