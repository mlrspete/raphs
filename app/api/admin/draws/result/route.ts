import { NextRequest, NextResponse } from "next/server";

import { getAdminAuthState } from "@/lib/auth/admin";
import { recordDrawResult } from "@/lib/domain/draws/recordDrawResult";

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
  const winningEntryNumber = Number(readFormString(formData, "winningEntryNumber"));

  if (!Number.isInteger(winningEntryNumber) || winningEntryNumber <= 0) {
    return redirectToDraws(request, "error", "Winning entry number must be a positive integer.", campaignSlug);
  }

  try {
    const result = await recordDrawResult({
      adminProfileId: authState.profile.id,
      campaignSlug,
      drawMethod: readFormString(formData, "drawMethod"),
      drawSnapshotId: readFormString(formData, "drawSnapshotId"),
      internalNotes: readFormString(formData, "internalNotes"),
      publicNotes: readFormString(formData, "publicNotes"),
      winningEntryNumber,
    });

    return redirectToDraws(
      request,
      "message",
      `Recorded winning entry ${result.result.winning_entry_number}.`,
      campaignSlug,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draw result could not be recorded.";
    return redirectToDraws(request, "error", message, campaignSlug);
  }
}
