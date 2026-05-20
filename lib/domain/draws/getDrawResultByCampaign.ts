import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PublicDrawResult = {
  campaignName: string;
  campaignSlug: string;
  drawMethod: string;
  entryCount: number;
  entryRange: {
    first: number | null;
    last: number | null;
  };
  publicNotes: string | null;
  snapshotCreatedAt: string;
  snapshotSha256: string;
  winningEntryNumber: number;
  winnerAlias: string;
};

export async function getDrawResultByCampaign(slug: string): Promise<PublicDrawResult | null> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data: campaign, error: campaignError } = await supabase
      .from("promo_campaigns")
      .select("id,slug,name")
      .eq("slug", slug)
      .single();

    if (campaignError || !campaign) {
      return null;
    }

    const { data: result, error: resultError } = await supabase
      .from("draw_results")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resultError || !result) {
      return null;
    }

    const [{ data: snapshot }, { data: winningEntry }, { data: entryRangeRows }] = await Promise.all([
      supabase.from("draw_snapshots").select("*").eq("id", result.draw_snapshot_id ?? "").maybeSingle(),
      supabase.from("promo_entries").select("display_alias").eq("id", result.winning_entry_id ?? "").maybeSingle(),
      supabase
        .from("promo_entries")
        .select("entry_number")
        .eq("campaign_id", campaign.id)
        .eq("status", "active")
        .not("locked_at", "is", null)
        .order("entry_number", { ascending: true })
        .limit(10000),
    ]);

    if (!snapshot) {
      return null;
    }

    const entryNumbers = (entryRangeRows ?? []).map((entry) => entry.entry_number);

    return {
      campaignName: campaign.name,
      campaignSlug: campaign.slug,
      drawMethod: result.draw_method,
      entryCount: snapshot.entry_count,
      entryRange: {
        first: entryNumbers[0] ?? null,
        last: entryNumbers.at(-1) ?? null,
      },
      publicNotes: result.public_notes,
      snapshotCreatedAt: snapshot.created_at,
      snapshotSha256: snapshot.csv_sha256,
      winnerAlias: winningEntry?.display_alias ?? "Winner",
      winningEntryNumber: result.winning_entry_number,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Public draw result could not be loaded: ${message}`);
    return null;
  }
}
