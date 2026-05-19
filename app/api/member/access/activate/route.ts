import { NextResponse } from "next/server";
import { z } from "zod";

import { activateDaypassAccess } from "@/lib/domain/access/activateDaypassAccess";

export const dynamic = "force-dynamic";

const activationPayloadSchema = z.object({
  grantId: z.string().uuid(),
});

type ActivationResponse =
  | {
      success: true;
      grantId: string;
      startsAt: string;
      expiresAt: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

function methodNotAllowed() {
  return NextResponse.json<ActivationResponse>(
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

export function GET() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<ActivationResponse>(
      {
        error: "Invalid JSON payload.",
        success: false,
      },
      { status: 400 },
    );
  }

  const parsed = activationPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json<ActivationResponse>(
      {
        error: "Invalid access activation payload.",
        fieldErrors: parsed.error.flatten().fieldErrors,
        success: false,
      },
      { status: 400 },
    );
  }

  try {
    const result = await activateDaypassAccess(parsed.data.grantId);

    return NextResponse.json<ActivationResponse>({
      expiresAt: result.expiresAt,
      grantId: result.grantId,
      startsAt: result.startsAt,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daypass access could not be activated.";

    return NextResponse.json<ActivationResponse>(
      {
        error: message,
        success: false,
      },
      { status: 400 },
    );
  }
}
