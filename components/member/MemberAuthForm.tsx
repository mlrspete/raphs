"use client";

import { FormEvent, useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type FormState = "idle" | "loading" | "sent";

const authCallbackPath = "/auth/callback";
const cooldownSeconds = 60;
const rateLimitCooldownSeconds = 90;
const genericSecureLinkError = "We could not send a secure link. Check the email and try again.";

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
    return "Too many links requested. Wait a little longer, then try again.";
  }

  if (code === "otp_expired") {
    return "That link expired. Request a fresh secure link.";
  }

  if (isInvalidRedirectError(error)) {
    return "Auth redirect is not configured correctly.";
  }

  return genericSecureLinkError;
}

function getCooldownSecondsForResult(error: unknown) {
  return getErrorStringProperty(error, "code") === "over_email_send_rate_limit"
    ? rateLimitCooldownSeconds
    : cooldownSeconds;
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
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>("idle");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }

    const activeCooldownUntil = cooldownUntil;

    function syncCooldownRemaining() {
      const nextRemaining = Math.max(0, Math.ceil((activeCooldownUntil - Date.now()) / 1000));

      setCooldownRemaining(nextRemaining);

      if (nextRemaining === 0) {
        setCooldownUntil(null);
      }
    }

    syncCooldownRemaining();
    const intervalId = window.setInterval(syncCooldownRemaining, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cooldownRemaining > 0) {
      return;
    }

    setError(null);
    setState("loading");

    let redirectTo: string | null = null;

    let cooldownDurationSeconds = cooldownSeconds;

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
        cooldownDurationSeconds = getCooldownSecondsForResult(signInError);
        logAuthErrorInDevelopment(signInError, redirectTo);
        setError(getFriendlyAuthErrorMessage(signInError));
        setState("idle");
        return;
      }

      setState("sent");
    } catch (signInError) {
      cooldownDurationSeconds = getCooldownSecondsForResult(signInError);
      logAuthErrorInDevelopment(signInError, redirectTo);
      setError(getFriendlyAuthErrorMessage(signInError));
      setState("idle");
    } finally {
      setCooldownUntil(Date.now() + cooldownDurationSeconds * 1000);
    }
  }

  if (state === "sent") {
    return (
      <div className="mt-7 rounded-lg border border-mint/45 bg-mint/20 p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">Check your email</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">
          We sent a secure Monroes link to {email.trim()}. Open it in this browser to continue.
        </p>
        <p className="mt-3 text-sm font-semibold leading-6 text-ink/58">
          Use the newest email only. Earlier secure links can expire or stop working after another link is requested.
        </p>
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
        disabled={state === "loading" || cooldownRemaining > 0}
        type="submit"
      >
        {state === "loading"
          ? "Sending link"
          : cooldownRemaining > 0
            ? `Try again in ${cooldownRemaining}s`
            : "Email me a secure link"}
      </button>
    </form>
  );
}
