import { NextResponse } from "next/server";
import { z } from "zod";

import { insertEventLog } from "@/lib/db/events";
import { redeemDaypassCode } from "@/lib/domain/daypass-codes/redeemDaypassCode";
import { sendCodeRedeemedEmail } from "@/lib/domain/email/sendCodeRedeemedEmail";
import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import type { EventPayload } from "@/lib/validation/events";

export const dynamic = "force-dynamic";

const redeemPayloadSchema = z.object({
  code: z.string().trim().min(6).max(96),
});

type RedeemResponse =
  | {
      success: true;
      accessGrantId: string;
      alreadyRedeemed: boolean;
      attributionUpdated: boolean;
      campaignSlug: string | null;
      codeLast4: string;
      redemptionBeforeLock: boolean;
      redeemedAt: string | null;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

function methodNotAllowed() {
  return NextResponse.json<RedeemResponse>(
    {
      error: "Method not allowed.",
      success: false,
    },
    {
      headers: {
        Allow: "POST",
      },
      status: 405,
    },
  );
}

function sanitizeNotificationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 800);
}

async function logRedemptionEvent({
  accessGrantId,
  attributionUpdated,
  campaignId,
  campaignSlug,
  redemptionBeforeLock,
}: {
  accessGrantId: string;
  attributionUpdated: boolean;
  campaignId: string | null;
  campaignSlug: string | null;
  redemptionBeforeLock: boolean;
}) {
  const payload: EventPayload = {
    anonymous_id: null,
    currency: "AUD",
    device_type: "unknown",
    event_name: "daypass_code_redeemed",
    fbclid: null,
    landing_page_id: null,
    landing_slug: null,
    lead_id: null,
    meta_ad_id: null,
    meta_adset_id: null,
    meta_campaign_id: null,
    offer_id: null,
    offer_type: "daypass",
    path: "/redeem",
    price_cents: null,
    properties: {
      access_grant_id: accessGrantId,
      attribution_updated: attributionUpdated,
      campaign_id: campaignId,
      campaign_slug: campaignSlug,
      redemption_before_lock: redemptionBeforeLock,
      surface: "daypass_redeem_api",
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
    console.error(`daypass_code_redeemed event could not be logged: ${message}`);
  }
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  const memberProfile = await getCurrentMemberProfile();

  if (!memberProfile) {
    return NextResponse.json<RedeemResponse>(
      {
        error: "Sign in before redeeming a Daypass code.",
        success: false,
      },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<RedeemResponse>(
      {
        error: "Invalid redemption payload.",
        success: false,
      },
      { status: 400 },
    );
  }

  const parsed = redeemPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json<RedeemResponse>(
      {
        error: "Enter a valid Daypass code.",
        fieldErrors: parsed.error.flatten().fieldErrors,
        success: false,
      },
      { status: 400 },
    );
  }

  try {
    const result = await redeemDaypassCode(parsed.data.code, memberProfile.id);

    await logRedemptionEvent({
      accessGrantId: result.accessGrantId,
      attributionUpdated: result.attributionUpdated,
      campaignId: result.campaignId,
      campaignSlug: result.campaignSlug,
      redemptionBeforeLock: result.redemptionBeforeLock,
    });

    try {
      await sendCodeRedeemedEmail({
        attributionUpdated: result.attributionUpdated,
        campaignId: result.campaignId,
        codeId: result.codeId,
        codeLast4: result.codeLast4,
        purchaserMemberProfileId: result.purchaserMemberProfileId,
        redeemedAt: result.redeemedAt,
        redeemedByMemberProfileId: memberProfile.id,
        redemptionBeforeLock: result.redemptionBeforeLock,
      });
    } catch (notificationError) {
      console.error(`Code redeemed email hook failed: ${sanitizeNotificationError(notificationError)}`);
    }

    return NextResponse.json<RedeemResponse>({
      accessGrantId: result.accessGrantId,
      alreadyRedeemed: result.alreadyRedeemed,
      attributionUpdated: result.attributionUpdated,
      campaignSlug: result.campaignSlug,
      codeLast4: result.codeLast4,
      redeemedAt: result.redeemedAt,
      redemptionBeforeLock: result.redemptionBeforeLock,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "This Daypass code could not be redeemed.";

    return NextResponse.json<RedeemResponse>(
      {
        error: message,
        success: false,
      },
      { status: 400 },
    );
  }
}
