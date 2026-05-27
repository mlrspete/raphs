"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const expiredOrInvalidLinkMessage = "That secure link expired or was already used. Request a fresh one.";

const expiredOrInvalidAuthErrors = new Set([
  "access_denied",
  "callback_failed",
  "invalid_token",
  "missing_code",
  "otp_expired",
]);

function getHashParams() {
  if (typeof window === "undefined" || !window.location.hash) {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function MemberLoginAuthErrorNotice() {
  const searchParams = useSearchParams();
  const [hashParams, setHashParams] = useState<URLSearchParams>(() => new URLSearchParams());
  const authError =
    searchParams.get("auth_error") ??
    searchParams.get("error_code") ??
    searchParams.get("error") ??
    hashParams.get("auth_error") ??
    hashParams.get("error_code") ??
    hashParams.get("error");

  useEffect(() => {
    setHashParams(getHashParams());
  }, []);

  if (!authError || !expiredOrInvalidAuthErrors.has(authError)) {
    return null;
  }

  return (
    <div className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm font-bold leading-6 text-red-700">
      {expiredOrInvalidLinkMessage}
    </div>
  );
}
