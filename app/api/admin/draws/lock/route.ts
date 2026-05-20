import { NextRequest, NextResponse } from "next/server";

import { getAdminAuthState } from "@/lib/auth/admin";
import { lockCampaignEntries } from "@/lib/domain/draws/lockCampaignEntries";

export const dynamic = "force-dynamic";

function redirectToDraws(request: NextRequest, key: "error" | "message", value: string, campaignSlug = "campaign-001") {
  const url = new URL("/admin/draws", request.url);
  url.searchParams.set("campaign", campaignSlug);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url, { status: 303 });
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const authState = await getAdminAuthState();

  if (authState.status !== "admin") {
    return redirectToDraws(request, "error", "Admin access is required.");
  }

  const formData = await request.formData();
  const campaignSlug = readFormString(formData, "campaignSlug") || "campaign-001";

  try {
    const result = await lockCampaignEntries(campaignSlug);
    return redirectToDraws(
      request,
      "message",
      `Locked ${result.newlyLockedCount} entries. ${result.totalLockedEligibleCount} active entries are locked for draw review.`,
      campaignSlug,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Entries could not be locked.";
    return redirectToDraws(request, "error", message, campaignSlug);
  }
}
