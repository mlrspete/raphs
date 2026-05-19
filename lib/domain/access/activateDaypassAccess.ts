import "server-only";

import { z } from "zod";

import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type DaypassActivationResult = {
  grantId: string;
  status: "active";
  startsAt: string;
  expiresAt: string;
};

const grantIdSchema = z.string().uuid();
const defaultDaypassDurationHours = 12;

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function resolveAccessDurationHours(orderItemId: string | null) {
  if (!orderItemId) {
    return defaultDaypassDurationHours;
  }

  const supabase = createAdminSupabaseClient();
  const { data: orderItem, error: orderItemError } = await supabase
    .from("order_items")
    .select("offer_id")
    .eq("id", orderItemId)
    .maybeSingle();

  if (orderItemError || !orderItem?.offer_id) {
    if (orderItemError) {
      console.error(`Daypass activation could not load order item ${orderItemId}: ${orderItemError.message}`);
    }

    return defaultDaypassDurationHours;
  }

  const { data: offer, error: offerError } = await supabase
    .from("commerce_offers")
    .select("access_duration_hours")
    .eq("id", orderItem.offer_id)
    .maybeSingle();

  if (offerError) {
    console.error(`Daypass activation could not load offer ${orderItem.offer_id}: ${offerError.message}`);
  }

  return offer?.access_duration_hours && offer.access_duration_hours > 0
    ? offer.access_duration_hours
    : defaultDaypassDurationHours;
}

export async function activateDaypassAccess(grantIdInput: string): Promise<DaypassActivationResult> {
  const grantId = grantIdSchema.parse(grantIdInput);
  const memberProfile = await getCurrentMemberProfile();

  if (!memberProfile) {
    throw new Error("You must be signed in to activate Daypass access.");
  }

  const supabase = createAdminSupabaseClient();
  const { data: grant, error: grantError } = await supabase
    .from("access_grants")
    .select("*")
    .eq("id", grantId)
    .maybeSingle();

  if (grantError) {
    throw new Error(grantError.message);
  }

  if (!grant || grant.member_profile_id !== memberProfile.id) {
    throw new Error("Daypass access grant was not found for this member.");
  }

  if (grant.access_type !== "daypass") {
    throw new Error("Only Daypass access grants can be activated here.");
  }

  if (grant.status === "active" && grant.starts_at && grant.expires_at) {
    if (Date.parse(grant.expires_at) <= Date.now()) {
      throw new Error("This Daypass access window has already expired.");
    }

    return {
      expiresAt: grant.expires_at,
      grantId: grant.id,
      startsAt: grant.starts_at,
      status: "active",
    };
  }

  if (grant.status !== "pending_activation" || grant.starts_at || grant.expires_at) {
    throw new Error("This Daypass access grant cannot be activated.");
  }

  const now = new Date();
  const durationHours = await resolveAccessDurationHours(grant.order_item_id);
  const startsAt = now.toISOString();
  const expiresAt = addHours(now, durationHours).toISOString();
  const { data: activatedGrant, error: activationError } = await supabase
    .from("access_grants")
    .update({
      expires_at: expiresAt,
      starts_at: startsAt,
      status: "active",
    })
    .eq("id", grant.id)
    .eq("member_profile_id", memberProfile.id)
    .eq("status", "pending_activation")
    .is("starts_at", null)
    .is("expires_at", null)
    .select("id, starts_at, expires_at")
    .single();

  if (activationError || !activatedGrant?.starts_at || !activatedGrant.expires_at) {
    throw new Error(activationError?.message ?? "Failed to activate Daypass access.");
  }

  return {
    expiresAt: activatedGrant.expires_at,
    grantId: activatedGrant.id,
    startsAt: activatedGrant.starts_at,
    status: "active",
  };
}
