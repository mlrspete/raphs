import "server-only";

import { sendLoggedTransactionalEmail, type LoggedEmailResult } from "@/lib/domain/email/outboundEmailLog";
import { buildCodeRedeemedEmail } from "@/lib/domain/email/templates";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SendCodeRedeemedEmailInput = {
  attributionUpdated: boolean;
  campaignId: string | null;
  codeId: string;
  codeLast4: string;
  purchaserMemberProfileId: string | null;
  redeemedAt: string | null;
  redeemedByMemberProfileId: string;
  redemptionBeforeLock: boolean;
};

async function loadCodeRedeemedContext(input: SendCodeRedeemedEmailInput) {
  if (!input.purchaserMemberProfileId) {
    throw new Error("Code redeemed email requires a purchaser member profile.");
  }

  const supabase = createAdminSupabaseClient();
  const { data: purchaser, error: purchaserError } = await supabase
    .from("member_profiles")
    .select("id, email")
    .eq("id", input.purchaserMemberProfileId)
    .maybeSingle();

  if (purchaserError) {
    throw new Error(purchaserError.message);
  }

  if (!purchaser?.email) {
    throw new Error("Code redeemed email requires a purchaser email.");
  }

  if (!input.campaignId) {
    return {
      campaign: null,
      purchaser,
    };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("promo_campaigns")
    .select("id, name")
    .eq("id", input.campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  return {
    campaign,
    purchaser,
  };
}

export async function sendCodeRedeemedEmail(input: SendCodeRedeemedEmailInput): Promise<LoggedEmailResult> {
  const context = await loadCodeRedeemedContext(input);
  const idempotencyKey = `code_redeemed:${input.codeId}:${input.redeemedByMemberProfileId}`;

  return sendLoggedTransactionalEmail({
    idempotencyKey,
    recipientEmail: context.purchaser.email,
    relatedCampaignId: input.campaignId,
    relatedOrderId: null,
    render: () =>
      buildCodeRedeemedEmail({
        attributionUpdated: input.attributionUpdated,
        campaignName: context.campaign?.name ?? null,
        codeLast4: input.codeLast4,
        redeemedAt: input.redeemedAt,
        redemptionBeforeLock: input.redemptionBeforeLock,
      }),
    tags: [
      {
        name: "template",
        value: "code_redeemed",
      },
    ],
    templateKey: "code_redeemed",
  });
}
