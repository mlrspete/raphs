import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const statusesWithPublicProgress = new Set(["live", "closed", "locked", "drawn"]);

export type PublicCampaignProgress = {
  entryCount: number | null;
  entryLimit: number | null;
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

  try {
    const supabase = createAdminSupabaseClient();
    const { data: campaign, error: campaignError } = await supabase
      .from("promo_campaigns")
      .select("id,status,entry_limit")
      .eq("slug", slug)
      .maybeSingle();

    if (campaignError || !campaign) {
      if (campaignError) {
        console.error(`Public campaign progress lookup failed for "${slug}": ${campaignError.message}`);
      }

      return { entryCount: null, entryLimit };
    }

    // TODO(milestone-15): set promo_campaigns.entry_limit before launch so public progress can use the live campaign cap instead of the landing-page public cap fallback.
    entryLimit = positiveInteger(campaign.entry_limit) ?? entryLimit;

    if (!statusesWithPublicProgress.has(campaign.status)) {
      return { entryCount: null, entryLimit };
    }

    const { count, error: countError } = await supabase
      .from("promo_entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "active");

    if (countError) {
      console.error(`Public campaign progress count failed for "${slug}": ${countError.message}`);
      return { entryCount: null, entryLimit };
    }

    return {
      entryCount: count ?? 0,
      entryLimit,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Public campaign progress could not be loaded for "${slug}": ${message}`);
    return { entryCount: null, entryLimit };
  }
}
