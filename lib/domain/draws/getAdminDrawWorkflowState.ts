import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { DrawResult, DrawSnapshot, PromoCampaign, PromoEntry } from "@/lib/types/database";

export type AdminDrawSnapshotRow = DrawSnapshot & {
  downloadHref: string;
};

export type AdminDrawResultRow = DrawResult & {
  winnerAlias: string | null;
};

export type AdminDrawWorkflowState = {
  campaign: PromoCampaign | null;
  counts: {
    activeEligible: number;
    cancelled: number;
    disqualified: number;
    excludedTotal: number;
    lockedEligible: number;
    refunded: number;
    totalEntries: number;
    unlockedEligible: number;
    voided: number;
  };
  latestResult: AdminDrawResultRow | null;
  snapshots: AdminDrawSnapshotRow[];
};

function emptyCounts(): AdminDrawWorkflowState["counts"] {
  return {
    activeEligible: 0,
    cancelled: 0,
    disqualified: 0,
    excludedTotal: 0,
    lockedEligible: 0,
    refunded: 0,
    totalEntries: 0,
    unlockedEligible: 0,
    voided: 0,
  };
}

function buildCounts(entries: PromoEntry[]): AdminDrawWorkflowState["counts"] {
  const activeEntries = entries.filter((entry) => entry.status === "active");
  const counts = {
    activeEligible: activeEntries.length,
    cancelled: entries.filter((entry) => entry.status === "cancelled").length,
    disqualified: entries.filter((entry) => entry.status === "disqualified").length,
    excludedTotal: 0,
    lockedEligible: activeEntries.filter((entry) => entry.locked_at).length,
    refunded: entries.filter((entry) => entry.status === "refunded").length,
    totalEntries: entries.length,
    unlockedEligible: activeEntries.filter((entry) => !entry.locked_at).length,
    voided: entries.filter((entry) => entry.status === "void").length,
  };

  return {
    ...counts,
    excludedTotal: counts.cancelled + counts.disqualified + counts.refunded + counts.voided,
  };
}

export async function getAdminDrawWorkflowState(campaignSlug: string): Promise<AdminDrawWorkflowState> {
  const supabase = createAdminSupabaseClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("slug", campaignSlug)
    .maybeSingle();

  if (campaignError || !campaign) {
    if (campaignError) {
      console.error(`Admin draw campaign query failed: ${campaignError.message}`);
    }

    return {
      campaign: null,
      counts: emptyCounts(),
      latestResult: null,
      snapshots: [],
    };
  }

  const [entriesResult, snapshotsResult, resultsResult] = await Promise.all([
    supabase.from("promo_entries").select("*").eq("campaign_id", campaign.id).order("entry_number", { ascending: true }),
    supabase
      .from("draw_snapshots")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("draw_results")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (entriesResult.error) {
    console.error(`Admin draw entries query failed: ${entriesResult.error.message}`);
  }

  if (snapshotsResult.error) {
    console.error(`Admin draw snapshots query failed: ${snapshotsResult.error.message}`);
  }

  if (resultsResult.error) {
    console.error(`Admin draw results query failed: ${resultsResult.error.message}`);
  }

  const entries = entriesResult.data ?? [];
  const latestResult = resultsResult.data?.[0] ?? null;
  const winnerEntry = latestResult?.winning_entry_id
    ? entries.find((entry) => entry.id === latestResult.winning_entry_id) ?? null
    : null;

  return {
    campaign,
    counts: buildCounts(entries),
    latestResult: latestResult
      ? {
          ...latestResult,
          winnerAlias: winnerEntry?.display_alias ?? null,
        }
      : null,
    snapshots: (snapshotsResult.data ?? []).map((snapshot) => ({
      ...snapshot,
      downloadHref: `/api/admin/draws/snapshots/${snapshot.id}/csv`,
    })),
  };
}
