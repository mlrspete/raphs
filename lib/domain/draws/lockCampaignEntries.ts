import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { PromoCampaign } from "@/lib/types/database";

export type LockCampaignEntriesResult = {
  campaign: PromoCampaign;
  lockedAt: string;
  newlyLockedCount: number;
  totalLockedEligibleCount: number;
};

function assertDrawLockWindow(campaign: PromoCampaign) {
  if (!campaign.draw_lock_at) {
    throw new Error("Set draw_lock_at before locking entries.");
  }

  if (Date.now() < new Date(campaign.draw_lock_at).getTime()) {
    throw new Error("Entries cannot be locked before the campaign draw_lock_at time.");
  }
}

export async function lockCampaignEntries(campaignSlug: string): Promise<LockCampaignEntriesResult> {
  const supabase = createAdminSupabaseClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("slug", campaignSlug)
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message ?? "Campaign could not be found.");
  }

  assertDrawLockWindow(campaign);

  const lockedAt = new Date().toISOString();
  const { data: updatedEntries, error: updateError } = await supabase
    .from("promo_entries")
    .update({ locked_at: lockedAt })
    .eq("campaign_id", campaign.id)
    .eq("status", "active")
    .is("locked_at", null)
    .select("id");

  if (updateError) {
    throw new Error(`Entries could not be locked: ${updateError.message}`);
  }

  if (campaign.status !== "drawn" && campaign.status !== "archived") {
    const { error: campaignUpdateError } = await supabase
      .from("promo_campaigns")
      .update({ status: "locked" })
      .eq("id", campaign.id);

    if (campaignUpdateError) {
      throw new Error(`Campaign status could not be moved to locked: ${campaignUpdateError.message}`);
    }
  }

  const { count, error: countError } = await supabase
    .from("promo_entries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("status", "active")
    .not("locked_at", "is", null);

  if (countError) {
    throw new Error(`Locked entry count could not be loaded: ${countError.message}`);
  }

  const newlyLockedCount = updatedEntries?.length ?? 0;

  return {
    campaign,
    lockedAt,
    newlyLockedCount,
    totalLockedEligibleCount: count ?? 0,
  };
}
