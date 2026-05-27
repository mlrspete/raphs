import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { buildMemberSignInEmail } from "@/lib/domain/email/templates";
import { sendWithResend } from "@/lib/domain/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type MemberAuthLinkResponse =
  | {
      success: true;
    }
  | {
      error: string;
      errorCode?: string;
      success: false;
    };

const authLinkPayloadSchema = z.object({
  email: z.string().trim().email().max(254),
});

function methodNotAllowed() {
  return NextResponse.json<MemberAuthLinkResponse>(
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

function getErrorStringProperty(error: unknown, property: "code" | "message" | "name") {
  if (!error || typeof error !== "object" || !(property in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[property];

  return typeof value === "string" ? value : null;
}

function normalizeAppUrl(value: string | null | undefined) {
  const trimmed = value?.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getAuthBaseUrl(request: Request) {
  return normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ?? new URL(request.url).origin.replace(/\/+$/, "");
}

function buildConfirmUrl(baseUrl: string, tokenHash: string, type: string) {
  const confirmUrl = new URL("/auth/confirm", baseUrl);
  confirmUrl.searchParams.set("token_hash", tokenHash);
  confirmUrl.searchParams.set("type", type);

  return confirmUrl.toString();
}

function logMemberAuthLinkError(message: string, error: unknown) {
  console.error(message, {
    code: getErrorStringProperty(error, "code"),
    message: getErrorStringProperty(error, "message") ?? String(error),
    name: getErrorStringProperty(error, "name"),
  });
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<MemberAuthLinkResponse>(
      {
        error: "Invalid JSON payload.",
        success: false,
      },
      { status: 400 },
    );
  }

  const parsed = authLinkPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json<MemberAuthLinkResponse>(
      {
        error: "Enter a valid email address.",
        success: false,
      },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      email,
      type: "magiclink",
    });

    if (error) {
      logMemberAuthLinkError("Member magic-link token generation failed", error);

      return NextResponse.json<MemberAuthLinkResponse>(
        {
          error: "We could not create a secure sign-in link.",
          errorCode: getErrorStringProperty(error, "code") ?? undefined,
          success: false,
        },
        { status: 502 },
      );
    }

    const { email_otp: code, hashed_token: tokenHash, verification_type: verificationType } = data.properties;

    if (!code || !tokenHash || !verificationType) {
      console.error("Member magic-link token generation returned an incomplete response.");

      return NextResponse.json<MemberAuthLinkResponse>(
        {
          error: "We could not create a secure sign-in link.",
          success: false,
        },
        { status: 502 },
      );
    }

    const emailContent = buildMemberSignInEmail({
      actionUrl: buildConfirmUrl(getAuthBaseUrl(request), tokenHash, verificationType),
      code,
      email,
    });
    const providerResult = await sendWithResend({
      ...emailContent,
      idempotencyKey: `member-sign-in-${randomUUID()}`,
      tags: [
        {
          name: "email_type",
          value: "member_sign_in",
        },
      ],
      to: email,
    });

    if (providerResult.status !== "sent") {
      console.error("Member sign-in email send failed", providerResult.errorMessage);

      return NextResponse.json<MemberAuthLinkResponse>(
        {
          error:
            providerResult.status === "skipped"
              ? "Monroes secure email is not configured yet."
              : "We could not send a secure link. Check the email and try again.",
          errorCode: providerResult.status === "skipped" ? "email_provider_not_configured" : "email_send_failed",
          success: false,
        },
        { status: 500 },
      );
    }

    return NextResponse.json<MemberAuthLinkResponse>({
      success: true,
    });
  } catch (error) {
    logMemberAuthLinkError("Member magic-link email failed", error);

    return NextResponse.json<MemberAuthLinkResponse>(
      {
        error: "We could not send a secure link. Check the email and try again.",
        errorCode: getErrorStringProperty(error, "code") ?? undefined,
        success: false,
      },
      { status: 500 },
    );
  }
}
