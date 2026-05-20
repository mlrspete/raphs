import "server-only";

import { insertEventLog } from "@/lib/db/events";
import { buildEligibleEntriesCsv } from "@/lib/domain/draws/buildEligibleEntriesCsv";
import { hashCsvSha256 } from "@/lib/domain/draws/hashCsvSha256";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { DrawResult, DrawSnapshot, PromoCampaign } from "@/lib/types/database";
import type { EventPayload } from "@/lib/validation/events";

export type RecordDrawResultInput = {
  adminProfileId: string;
  campaignSlug: string;
  drawMethod: string;
  drawSnapshotId: string;
  internalNotes?: string | null;
  publicNotes?: string | null;
  winningEntryNumber: number;
};

export type RecordDrawResultResult = {
  result: DrawResult;
  snapshot: DrawSnapshot;
};

async function logDrawCompleted({
  campaign,
  drawMethod,
  resultId,
  snapshot,
  winningEntryNumber,
}: {
  campaign: PromoCampaign;
  drawMethod: string;
  resultId: string;
  snapshot: DrawSnapshot;
  winningEntryNumber: number;
}) {
  const payload: EventPayload = {
    anonymous_id: null,
    currency: "AUD",
    device_type: "unknown",
    event_name: "draw_completed",
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
      draw_method: drawMethod,
      result_id: resultId,
      snapshot_id: snapshot.id,
      snapshot_sha256: snapshot.csv_sha256,
      surface: "admin_draws",
      winning_entry_number: winningEntryNumber,
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
    console.error(`draw_completed event could not be logged: ${message}`);
  }
}

export async function recordDrawResult(input: RecordDrawResultInput): Promise<RecordDrawResultResult> {
  const drawMethod = input.drawMethod.trim();

  if (!drawMethod) {
    throw new Error("Draw method is required.");
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

  const { data: existingResult, error: existingError } = await supabase
    .from("draw_results")
    .select("id")
    .eq("campaign_id", campaign.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Existing draw result could not be checked: ${existingError.message}`);
  }

  if (existingResult) {
    throw new Error("A draw result has already been recorded for this campaign.");
  }

  const { data: snapshot, error: snapshotError } = await supabase
    .from("draw_snapshots")
    .select("*")
    .eq("id", input.drawSnapshotId)
    .eq("campaign_id", campaign.id)
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(snapshotError?.message ?? "Draw snapshot could not be found for this campaign.");
  }

  const eligible = await buildEligibleEntriesCsv({
    campaignId: campaign.id,
    campaignName: campaign.name,
    campaignSlug: campaign.slug,
    requireLocked: true,
  });
  const currentHash = hashCsvSha256(eligible.csv);

  if (currentHash !== snapshot.csv_sha256) {
    throw new Error("Current locked entry CSV no longer matches the selected snapshot hash.");
  }

  const winningEntry = eligible.entries.find((entry) => entry.entryNumber === input.winningEntryNumber);

  if (!winningEntry) {
    throw new Error("Winning entry number is not present in the selected eligible snapshot.");
  }

  const { data: result, error: resultError } = await supabase
    .from("draw_results")
    .insert({
      campaign_id: campaign.id,
      created_by: input.adminProfileId,
      draw_method: drawMethod,
      draw_snapshot_id: snapshot.id,
      internal_notes: input.internalNotes?.trim() || null,
      public_notes: input.publicNotes?.trim() || null,
      winning_entry_id: winningEntry.entryId,
      winning_entry_number: winningEntry.entryNumber,
    })
    .select("*")
    .single();

  if (resultError || !result) {
    throw new Error(resultError?.message ?? "Draw result could not be recorded.");
  }

  const { error: campaignUpdateError } = await supabase
    .from("promo_campaigns")
    .update({ status: "drawn" })
    .eq("id", campaign.id);

  if (campaignUpdateError) {
    throw new Error(`Campaign status could not be moved to drawn: ${campaignUpdateError.message}`);
  }

  await logDrawCompleted({
    campaign,
    drawMethod,
    resultId: result.id,
    snapshot,
    winningEntryNumber: winningEntry.entryNumber,
  });

  return {
    result,
    snapshot,
  };
}
