import "server-only";

import { z } from "zod";

import { hashDaypassCode } from "@/lib/domain/daypass-codes/hashCode";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database";

const submittedCodeSchema = z.string().trim().min(6, "Enter a Daypass code.").max(96, "Daypass code is too long.");

export type RedeemDaypassCodeResult = {
  alreadyRedeemed: boolean;
  accessGrantId: string;
  attributionUpdated: boolean;
  campaignId: string | null;
  campaignSlug: string | null;
  codeId: string;
  codeLast4: string;
  entryId: string | null;
  purchaserMemberProfileId: string | null;
  purchaserNotification: {
    codeLast4: string;
    redeemedAt: string | null;
  };
  redeemedAt: string | null;
  redemptionBeforeLock: boolean;
};

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: Json | undefined) {
  return typeof value === "boolean" ? value : false;
}

function parseNotification(value: Json | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      codeLast4: "",
      redeemedAt: null,
    };
  }

  return {
    codeLast4: readString(value.code_last4) ?? "",
    redeemedAt: readString(value.redeemed_at),
  };
}

function parseRedeemResult(value: Json): RedeemDaypassCodeResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Daypass redemption returned an invalid response.");
  }

  const accessGrantId = readString(value.access_grant_id);
  const codeId = readString(value.code_id);
  const codeLast4 = readString(value.code_last4);

  if (!accessGrantId || !codeId || !codeLast4) {
    throw new Error("Daypass redemption returned an incomplete response.");
  }

  return {
    accessGrantId,
    alreadyRedeemed: readBoolean(value.already_redeemed),
    attributionUpdated: readBoolean(value.attribution_updated),
    campaignId: readString(value.campaign_id),
    campaignSlug: readString(value.campaign_slug),
    codeId,
    codeLast4,
    entryId: readString(value.entry_id),
    purchaserMemberProfileId: readString(value.purchaser_member_profile_id),
    purchaserNotification: parseNotification(value.purchaser_notification),
    redeemedAt: readString(value.redeemed_at),
    redemptionBeforeLock: readBoolean(value.redemption_before_lock),
  };
}

function sanitizeRedemptionError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (rawMessage.includes("already been redeemed")) {
    return "This Daypass code has already been redeemed.";
  }

  if (rawMessage.includes("expired")) {
    return "This Daypass code is expired.";
  }

  if (rawMessage.includes("manual review") || rawMessage.includes("draw lock")) {
    return "This Daypass code needs manual review before it can be redeemed.";
  }

  if (rawMessage.includes("not available") || rawMessage.includes("Invalid")) {
    return "This Daypass code is invalid or unavailable.";
  }

  return "This Daypass code could not be redeemed.";
}

export async function redeemDaypassCode(submittedCode: string, redeemerMemberProfileId: string) {
  const code = submittedCodeSchema.parse(submittedCode);
  const codeHash = hashDaypassCode(code);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("redeem_daypass_code", {
    p_code_hash: codeHash,
    p_redeemer_member_profile_id: redeemerMemberProfileId,
  });

  if (error || !data) {
    throw new Error(sanitizeRedemptionError(error?.message ?? "Daypass redemption failed."));
  }

  try {
    return parseRedeemResult(data);
  } catch (error) {
    throw new Error(sanitizeRedemptionError(error));
  }
}
