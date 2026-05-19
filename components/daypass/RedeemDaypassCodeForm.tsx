"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type RedeemResponse =
  | {
      success: true;
      accessGrantId: string;
      alreadyRedeemed: boolean;
      attributionUpdated: boolean;
      campaignSlug: string | null;
      codeLast4: string;
      redemptionBeforeLock: boolean;
      redeemedAt: string | null;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export function RedeemDaypassCodeForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Extract<RedeemResponse, { success: true }> | null>(null);

  async function submitRedemption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/daypass/redeem", {
        body: JSON.stringify({ code }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = (await response.json()) as RedeemResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.success ? "This Daypass code could not be redeemed." : body.error);
      }

      setCode("");
      setResult(body);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "This Daypass code could not be redeemed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submitRedemption}>
      <label className="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-ink/58">
        Daypass code
        <input
          autoComplete="off"
          className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-base font-bold normal-case tracking-normal text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
          inputMode="text"
          name="daypass-code"
          onChange={(event) => setCode(event.target.value)}
          placeholder="Paste code after signing in"
          spellCheck={false}
          type="password"
          value={code}
        />
      </label>
      <p className="text-sm font-semibold leading-6 text-ink/62">
        Codes are submitted only in the request body. Monroes does not put full Daypass codes in URLs, analytics, or
        page links.
      </p>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Redeeming..." : "Redeem Daypass"}
      </button>

      {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">{error}</p> : null}

      {result ? (
        <div className="rounded-lg border border-ink/10 bg-mint/45 p-4">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-ink">Daypass redeemed</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/70">
            Code ending in {result.codeLast4} now has pending Daypass access. Activate the 12-hour window from your
            member dashboard when you are ready.
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/70">
            {result.attributionUpdated
              ? "Promo entry holder attribution was updated before the draw lock."
              : "Promo entry attribution is locked or unchanged; your Daypass access was still granted."}
          </p>
          <Link className="mt-4 inline-flex text-sm font-black uppercase tracking-[0.1em] text-orange hover:text-orange-hover" href="/member">
            Open member dashboard
          </Link>
        </div>
      ) : null}
    </form>
  );
}
