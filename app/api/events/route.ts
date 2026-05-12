import { NextResponse } from "next/server";

import { insertEventLog } from "@/lib/db/events";
import { eventPayloadSchema } from "@/lib/validation/events";

export const dynamic = "force-dynamic";

type EventApiResponse =
  | {
      success: true;
      eventId: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

function methodNotAllowed() {
  return NextResponse.json<EventApiResponse>(
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
    return NextResponse.json<EventApiResponse>(
      {
        success: false,
        error: "Invalid JSON payload.",
      },
      { status: 400 },
    );
  }

  const parsed = eventPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).filter(([, messages]) => messages && messages.length > 0),
    ) as Record<string, string[]>;

    return NextResponse.json<EventApiResponse>(
      {
        success: false,
        error: "Unsupported or invalid event payload.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await insertEventLog(parsed.data);

    return NextResponse.json<EventApiResponse>({
      success: true,
      eventId: result.eventId,
    });
  } catch (error) {
    console.error("Event logging failed", error);

    return NextResponse.json<EventApiResponse>(
      {
        success: false,
        error: "Event could not be logged.",
      },
      { status: 500 },
    );
  }
}
