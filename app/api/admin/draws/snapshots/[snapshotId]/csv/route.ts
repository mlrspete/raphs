import { NextRequest, NextResponse } from "next/server";

import { getAdminAuthState } from "@/lib/auth/admin";
import { csvResponse } from "@/lib/csv/export";
import { getDrawSnapshotCsv } from "@/lib/domain/draws/getDrawSnapshotCsv";

export const dynamic = "force-dynamic";

type SnapshotCsvRouteProps = {
  params: Promise<{
    snapshotId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: SnapshotCsvRouteProps) {
  const authState = await getAdminAuthState();

  if (authState.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (authState.status === "denied") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { snapshotId } = await params;

  try {
    const snapshot = await getDrawSnapshotCsv(snapshotId);
    return csvResponse(snapshot.csv, snapshot.fileName);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draw snapshot CSV could not be downloaded.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
