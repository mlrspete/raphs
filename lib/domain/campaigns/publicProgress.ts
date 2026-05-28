import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const statusesWithPublicProgress = new Set(["live", "closed", "locked", "drawn"]);

export type PublicCampaignProgress = {
  closesAt: string | null;
  entryCount: number | null;
  entryLimit: number | null;
  entriesCloseAt: string | null;
};

function positiveInteger(value: number | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export async function getPublicCampaignProgress({
  publicEntryLimit,
  slug,
}: {
  publicEntryLimit: number | null;
  slug: string;
}): Promise<PublicCampaignProgress> {
  let entryLimit = positiveInteger(publicEntryLimit);
  const fallbackProgress = {
    closesAt: null,
    entryCount: null,
    entryLimit,
    entriesCloseAt: null,
  } satisfies PublicCampaignProgress;

  try {
    const supabase = createAdminSupabaseClient();
    const { data: campaign, error: campaignError } = await supabase
      .from("promo_campaigns")
      .select("id,status,entry_limit,closes_at,entries_close_at")
      .eq("slug", slug)
      .maybeSingle();

    if (campaignError || !campaign) {
      if (campaignError) {
        console.error(`Public campaign progress lookup failed for "${slug}": ${campaignError.message}`);
      }

      return fallbackProgress;
    }

    // TODO(milestone-15): set promo_campaigns.entry_limit before launch so public progress can use the live campaign cap instead of the landing-page public cap fallback.
    entryLimit = positiveInteger(campaign.entry_limit) ?? entryLimit;
    const campaignProgress = {
      closesAt: campaign.closes_at,
      entryCount: null,
      entryLimit,
      entriesCloseAt: campaign.entries_close_at,
    } satisfies PublicCampaignProgress;

    if (!statusesWithPublicProgress.has(campaign.status)) {
      return campaignProgress;
    }

    const { count, error: countError } = await supabase
      .from("promo_entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "active");

    if (countError) {
      console.error(`Public campaign progress count failed for "${slug}": ${countError.message}`);
      return campaignProgress;
    }

    return {
      closesAt: campaign.closes_at,
      entryCount: count ?? 0,
      entryLimit,
      entriesCloseAt: campaign.entries_close_at,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Public campaign progress could not be loaded for "${slug}": ${message}`);
    return fallbackProgress;
  }
}
