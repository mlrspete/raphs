import "server-only";

import { buildEligibleEntriesCsv } from "@/lib/domain/draws/buildEligibleEntriesCsv";
import { hashCsvSha256 } from "@/lib/domain/draws/hashCsvSha256";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type DrawSnapshotCsv = {
  campaignSlug: string;
  csv: string;
  csvSha256: string;
  fileName: string;
};

export async function getDrawSnapshotCsv(snapshotId: string): Promise<DrawSnapshotCsv> {
  const supabase = createAdminSupabaseClient();
  const { data: snapshot, error: snapshotError } = await supabase
    .from("draw_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(snapshotError?.message ?? "Draw snapshot could not be found.");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("id", snapshot.campaign_id)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message ?? "Snapshot campaign could not be found.");
  }

  const eligible = await buildEligibleEntriesCsv({
    campaignId: campaign.id,
    campaignName: campaign.name,
    campaignSlug: campaign.slug,
    requireLocked: true,
  });
  const csvSha256 = hashCsvSha256(eligible.csv);

  if (csvSha256 !== snapshot.csv_sha256) {
    throw new Error("Current locked entry CSV no longer matches the selected snapshot hash.");
  }

  return {
    campaignSlug: campaign.slug,
    csv: eligible.csv,
    csvSha256,
    fileName: `monroes-draw-snapshot-${campaign.slug}-${snapshot.created_at.slice(0, 10)}.csv`,
  };
}
