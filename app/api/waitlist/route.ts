import { NextResponse } from "next/server";

import { upsertWaitlistLead } from "@/lib/db/leads";
import type { WaitlistApiResponse } from "@/lib/types/waitlist";
import { waitlistSubmissionSchema } from "@/lib/validation/waitlist";

export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return NextResponse.json<WaitlistApiResponse>(
    {
      success: false,
      error: "Method not allowed.",
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
    return NextResponse.json<WaitlistApiResponse>(
      {
        success: false,
        error: "Invalid JSON payload.",
      },
      { status: 400 },
    );
  }

  const parsed = waitlistSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).filter(([, messages]) => messages && messages.length > 0),
    ) as Record<string, string[]>;

    return NextResponse.json<WaitlistApiResponse>(
      {
        success: false,
        error: "Please check the waitlist form.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json<WaitlistApiResponse>({
      success: true,
      leadId: null,
    });
  }

  try {
    const result = await upsertWaitlistLead(parsed.data);

    return NextResponse.json<WaitlistApiResponse>({
      success: true,
      leadId: result.leadId,
    });
  } catch (error) {
    console.error("Waitlist submission failed", error);

    return NextResponse.json<WaitlistApiResponse>(
      {
        success: false,
        error: "We could not save your access-list request. Please try again.",
      },
      { status: 500 },
    );
  }
}
