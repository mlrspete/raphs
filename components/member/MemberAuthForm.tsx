"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type FormState = "idle" | "loading" | "sent" | "verifying";

const authCallbackPath = "/auth/callback";
const genericSecureLinkError = "We could not send a secure link. Check the email and try again.";
const genericCodeError = "That code did not work. Check the latest email and try again.";

function normalizeAppUrl(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getAuthRedirectTo() {
  const configuredAppUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  const fallbackOrigin = window.location.origin.replace(/\/+$/, "");
  const baseUrl = configuredAppUrl ?? fallbackOrigin;

  return `${baseUrl}${authCallbackPath}`;
}

function getErrorStringProperty(error: unknown, property: "code" | "message" | "name") {
  if (!error || typeof error !== "object" || !(property in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[property];

  return typeof value === "string" ? value : null;
}

function getErrorNumberProperty(error: unknown, property: "status") {
  if (!error || typeof error !== "object" || !(property in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[property];

  return typeof value === "number" ? value : null;
}

function isInvalidRedirectError(error: unknown) {
  const code = getErrorStringProperty(error, "code")?.toLowerCase() ?? "";
  const message = getErrorStringProperty(error, "message")?.toLowerCase() ?? "";
  const searchableText = `${code} ${message}`;

  return (
    searchableText.includes("redirect") &&
    (searchableText.includes("invalid") ||
      searchableText.includes("not allowed") ||
      searchableText.includes("not configured") ||
      searchableText.includes("uri"))
  );
}

function getFriendlyAuthErrorMessage(error: unknown) {
  const code = getErrorStringProperty(error, "code");

  if (code === "over_email_send_rate_limit") {
    return "Supabase is blocking secure-link emails right now. You can try again, but it may fail until the Auth rate limit resets.";
  }

  if (code === "otp_expired") {
    return "That link expired. Request a fresh secure link.";
  }

  if (isInvalidRedirectError(error)) {
    return "Auth redirect is not configured correctly.";
  }

  return genericSecureLinkError;
}

function logAuthErrorInDevelopment(error: unknown, redirectTo: string | null) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error("Member magic-link signInWithOtp failed", {
    code: getErrorStringProperty(error, "code"),
    message: getErrorStringProperty(error, "message") ?? String(error),
    name: getErrorStringProperty(error, "name"),
    redirectTo,
    status: getErrorNumberProperty(error, "status"),
  });
}

function clearPageAuthError() {
  window.dispatchEvent(new Event("member-auth-error-clear"));

  const url = new URL(window.location.href);
  url.searchParams.delete("auth_error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error");
  url.hash = "";
  window.history.replaceState(null, "", url);
}

export function MemberAuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setState("loading");

    let redirectTo: string | null = null;

    try {
      const supabase = createBrowserSupabaseClient();
      redirectTo = getAuthRedirectTo();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        logAuthErrorInDevelopment(signInError, redirectTo);
        setError(getFriendlyAuthErrorMessage(signInError));
        setState("idle");
        return;
      }

      setState("sent");
    } catch (signInError) {
      logAuthErrorInDevelopment(signInError, redirectTo);
      setError(getFriendlyAuthErrorMessage(signInError));
      setState("idle");
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeError(null);
    setState("verifying");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });

      if (verifyError) {
        logAuthErrorInDevelopment(verifyError, null);
        setCodeError(
          getErrorStringProperty(verifyError, "code") === "otp_expired"
            ? "That code expired. Request a fresh secure link."
            : genericCodeError,
        );
        setState("sent");
        return;
      }

      router.replace("/member");
    } catch (verifyError) {
      logAuthErrorInDevelopment(verifyError, null);
      setCodeError(genericCodeError);
      setState("sent");
    }
  }

  if (state === "sent" || state === "verifying") {
    return (
      <div className="mt-7 grid gap-4">
        <div className="rounded-lg border border-mint/45 bg-mint/20 p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">Check your email</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">
            We sent a secure Monroes link to {email.trim()}. Open it in this browser to continue.
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/58">
            Use the newest email only. Earlier secure links can expire or stop working after another link is requested.
          </p>
        </div>

        <form className="grid gap-3" onSubmit={handleVerifyCode}>
          <label className="grid gap-2 text-sm font-black text-ink">
            Secure code
            <input
              autoComplete="one-time-code"
              className="min-h-12 rounded-md border border-ink/12 bg-white px-4 text-base font-semibold text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setCodeError(null);
                setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder="123456"
              type="text"
              value={otpCode}
            />
          </label>

          {codeError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{codeError}</p> : null}

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={otpCode.length !== 6 || state === "verifying"}
            type="submit"
          >
            {state === "verifying" ? "Checking code" : "Use secure code"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-black text-ink">
        Email
        <input
          autoComplete="email"
          className="min-h-12 rounded-md border border-ink/12 bg-white px-4 text-base font-semibold text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25"
          onChange={(event) => {
            clearPageAuthError();
            setError(null);
            setEmail(event.target.value);
          }}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={state === "loading"}
        type="submit"
      >
        {state === "loading" ? "Sending link" : "Email me a secure link"}
      </button>
    </form>
  );
}
