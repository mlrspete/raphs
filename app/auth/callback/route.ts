import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseAuthClient } from "@/lib/supabase/server";

function loginErrorRedirect(requestUrl: URL, authError: "callback_failed" | "missing_code") {
  const redirectUrl = new URL("/member/login", requestUrl.origin);
  redirectUrl.searchParams.set("auth_error", authError);

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return loginErrorRedirect(requestUrl, "missing_code");
  }

  try {
    const supabase = await createServerSupabaseAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return loginErrorRedirect(requestUrl, "callback_failed");
    }
  } catch {
    return loginErrorRedirect(requestUrl, "callback_failed");
  }

  return NextResponse.redirect(new URL("/member", requestUrl.origin));
}
