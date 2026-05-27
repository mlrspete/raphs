"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const authHashErrorCodes = new Set(["access_denied", "invalid_token", "otp_expired"]);

function getAuthErrorFromHash() {
  if (typeof window === "undefined" || !window.location.hash) {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode = hashParams.get("error_code");
  const error = hashParams.get("error");

  if (errorCode && authHashErrorCodes.has(errorCode)) {
    return errorCode;
  }

  if (error && authHashErrorCodes.has(error)) {
    return error;
  }

  return null;
}

export function MemberAuthHashErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authError = getAuthErrorFromHash();

    if (!authError) {
      return;
    }

    router.replace(`/member/login?auth_error=${encodeURIComponent(authError)}`);
  }, [router]);

  return null;
}
