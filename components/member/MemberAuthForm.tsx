"use client";

import { FormEvent, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type FormState = "idle" | "loading" | "sent";

export function MemberAuthForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("loading");

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/member`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setState("idle");
        return;
      }

      setState("sent");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to send login link.";
      setError(message);
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="mt-7 rounded-lg border border-mint/45 bg-mint/20 p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">Check your email</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">
          We sent a secure Monroes login link to {email.trim()}. Open it in this browser to continue.
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
          onChange={(event) => setEmail(event.target.value)}
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
