import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createServerSupabaseAuthClient } from "@/lib/supabase/server";

const allowedEmailOtpTypes = new Set(["magiclink", "signup", "email"]);

function loginErrorRedirect(requestUrl: URL, authError: "callback_failed" | "missing_code" | "otp_expired") {
  const redirectUrl = new URL("/member/login", requestUrl.origin);
  redirectUrl.searchParams.set("auth_error", authError);

  return NextResponse.redirect(redirectUrl);
}

function getEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value || !allowedEmailOtpTypes.has(value)) {
    return null;
  }

  return value as EmailOtpType;
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as Record<string, unknown>).code;

  return typeof code === "string" ? code : null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(requestUrl.searchParams.get("type"));

  if (!tokenHash || !type) {
    return loginErrorRedirect(requestUrl, "missing_code");
  }

  try {
    const supabase = await createServerSupabaseAuthClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return loginErrorRedirect(requestUrl, getErrorCode(error) === "otp_expired" ? "otp_expired" : "callback_failed");
    }
  } catch {
    return loginErrorRedirect(requestUrl, "callback_failed");
  }

  return NextResponse.redirect(new URL("/member", requestUrl.origin));
}
