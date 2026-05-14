"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { getAttributionContext } from "@/lib/analytics/attribution";
import type { TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";
import type { WaitlistApiResponse } from "@/lib/types/waitlist";
import {
  waitlistPrivacyVersion,
  waitlistSubmissionSchema,
  type WaitlistSubmissionInput,
} from "@/lib/validation/waitlist";

type WaitlistFormProps = {
  ctaLabel: string;
  offerId?: string | null;
  offerType?: string | null;
  priceCents?: number | null;
  currency: string;
  landingPageId?: string | null;
  landingSlug?: string | null;
  extraTrackingProperties?: TrackEventProperties;
};

type FormState = {
  email: string;
  firstName: string;
  favouriteBrands: string;
  preferredCategory: string;
  budgetRange: string;
  buyerSellerIntent: string;
  likelihoodToBuy: string;
  consentMarketing: boolean;
  website: string;
  turnstileToken: string | null;
};

const initialFormState: FormState = {
  email: "",
  firstName: "",
  favouriteBrands: "",
  preferredCategory: "",
  budgetRange: "",
  buyerSellerIntent: "",
  likelihoodToBuy: "",
  consentMarketing: false,
  website: "",
  turnstileToken: null,
};

const emptyTrackingProperties: TrackEventProperties = {};

function firstError(fieldErrors: Record<string, string[]> | undefined, field: string) {
  return fieldErrors?.[field]?.[0] ?? null;
}

function toSingleFieldErrors(fieldErrors: Record<string, string[]> | undefined) {
  return Object.fromEntries(
    Object.entries(fieldErrors ?? {}).map(([field, messages]) => [field, messages[0] ?? "Invalid value."]),
  ) as Record<string, string>;
}

export function WaitlistForm({
  ctaLabel,
  offerId,
  offerType,
  priceCents,
  currency,
  landingPageId,
  landingSlug,
  extraTrackingProperties = emptyTrackingProperties,
}: WaitlistFormProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const startedRef = useRef(false);
  const submitLabel = ctaLabel === "Join the access list" ? "Join access list" : ctaLabel;
  const trackingProperties = useMemo<TrackEventProperties>(
    () => ({
      currency,
      landing_page_id: landingPageId ?? null,
      landing_slug: landingSlug ?? null,
      offer_id: offerId ?? null,
      offer_type: offerType ?? null,
      price_cents: priceCents ?? null,
      ...extraTrackingProperties,
    }),
    [currency, extraTrackingProperties, landingPageId, landingSlug, offerId, offerType, priceCents],
  );

  function markStarted(interaction: string) {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    trackEvent("waitlist_form_started", {
      ...trackingProperties,
      interaction,
    });
  }

  function updateField<Field extends keyof FormState>(field: Field, value: FormState[Field]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setFormState((current) => ({
      ...current,
      turnstileToken: token,
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.turnstileToken;
      return next;
    });
  }, []);

  function buildPayload(): WaitlistSubmissionInput {
    const attribution = getAttributionContext();

    return {
      email: formState.email,
      firstName: formState.firstName,
      favouriteBrands: formState.favouriteBrands,
      preferredCategory: formState.preferredCategory,
      budgetRange: formState.budgetRange,
      buyerSellerIntent: formState.buyerSellerIntent,
      likelihoodToBuy: formState.likelihoodToBuy,
      consentMarketing: formState.consentMarketing,
      privacyVersion: waitlistPrivacyVersion,
      turnstileToken: formState.turnstileToken,
      website: formState.website,
      context: {
        currency,
        landingPageId: landingPageId ?? null,
        landingSlug: landingSlug ?? null,
        offerId: offerId ?? null,
        offerType: offerType ?? null,
        priceCents: priceCents ?? null,
      },
      attribution: {
        anonymous_id: attribution.anonymous_id,
        session_id: attribution.session_id,
        path: attribution.path,
        referrer: attribution.referrer,
        device_type: attribution.device_type,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        fbclid: attribution.fbclid,
        meta_campaign_id: attribution.meta_campaign_id,
        meta_adset_id: attribution.meta_adset_id,
        meta_ad_id: attribution.meta_ad_id,
        timestamp: attribution.timestamp,
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markStarted("submit");
    setFormError(null);
    setFieldErrors({});

    const parsed = waitlistSubmissionSchema.safeParse(buildPayload());

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setFieldErrors(toSingleFieldErrors(flattened.fieldErrors));
      setFormError(firstError(flattened.fieldErrors, "consentMarketing") ?? "Please check the highlighted fields.");
      trackEvent("waitlist_failed", {
        ...trackingProperties,
        failure_reason: "client_validation",
      });
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        body: JSON.stringify(parsed.data),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as WaitlistApiResponse;

      if (!response.ok || !result.success) {
        const message = result.success ? "We could not save your access-list request." : result.error;

        if (!result.success) {
          setFieldErrors(toSingleFieldErrors(result.fieldErrors));
        }

        setFormError(message);
        setStatus("idle");
        trackEvent("waitlist_failed", {
          ...trackingProperties,
          failure_reason: "server_validation",
          status_code: response.status,
        });
        return;
      }

      setStatus("success");
      trackEvent("waitlist_submitted", {
        ...trackingProperties,
        lead_id: result.leadId,
      });
    } catch {
      setFormError("We could not reach the access list. Please try again.");
      setStatus("idle");
      trackEvent("waitlist_failed", {
        ...trackingProperties,
        failure_reason: "network",
      });
    }
  }

  if (status === "success") {
    return (
      <div className="mt-6 rounded-lg border border-mint/50 bg-mint/20 p-5 shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">You are on the list</p>
        <h3 className="mt-2 text-2xl font-black uppercase leading-tight text-ink">Request saved.</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">
          We will email you when the next Monroes Market access window opens. No payment has been taken.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-6 grid gap-4" onFocusCapture={() => markStarted("form_focus")} onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-black text-ink">
        Email address
        <input
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
          className={`min-h-14 rounded-md border bg-white px-4 text-base font-semibold text-ink shadow-soft outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25 ${
            fieldErrors.email ? "border-red-500" : "border-ink/12"
          }`}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={formState.email}
        />
        {fieldErrors.email ? <span className="text-xs font-bold normal-case text-red-600">{fieldErrors.email}</span> : null}
      </label>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="waitlist-company">Company</label>
        <input
          autoComplete="off"
          id="waitlist-company"
          onChange={(event) => updateField("website", event.target.value)}
          tabIndex={-1}
          type="text"
          value={formState.website}
        />
      </div>

      <label className="flex gap-3 rounded-md border border-ink/10 bg-white/68 p-3 text-sm font-semibold leading-6 text-ink/70">
        <input
          checked={formState.consentMarketing}
          className="mt-1 h-4 w-4 accent-orange"
          onChange={(event) => updateField("consentMarketing", event.target.checked)}
          required
          type="checkbox"
        />
        <span>
          I agree to receive emails about Monroes Market access windows and understand no payment is being processed.
          I have read the{" "}
          <Link className="font-black text-orange underline underline-offset-4" href="/privacy" rel="noreferrer" target="_blank">
            privacy notice
          </Link>
          .
          {fieldErrors.consentMarketing ? (
            <span className="mt-1 block text-xs font-bold text-red-600">{fieldErrors.consentMarketing}</span>
          ) : null}
        </span>
      </label>

      <TurnstileWidget onTokenChange={handleTurnstileTokenChange} />
      {fieldErrors.turnstileToken ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{fieldErrors.turnstileToken}</p>
      ) : null}

      {formError ? (
        <p aria-live="polite" className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold leading-6 text-red-700" role="alert">
          {formError} Your details are still here so you can retry.
        </p>
      ) : null}

      <button
        className="inline-flex min-h-[3.25rem] items-center justify-center rounded-md bg-orange px-5 py-4 text-sm font-black uppercase text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
        data-currency={currency}
        data-event="waitlist_submitted"
        data-landing-page-id={landingPageId ?? undefined}
        data-landing-slug={landingSlug ?? undefined}
        data-offer-id={offerId ?? undefined}
        data-offer-type={offerType ?? undefined}
        data-price-cents={priceCents ?? undefined}
        data-daypass-quantity={
          typeof trackingProperties.daypass_quantity === "number" ? trackingProperties.daypass_quantity : undefined
        }
        data-total-price-cents={
          typeof trackingProperties.total_price_cents === "number" ? trackingProperties.total_price_cents : undefined
        }
        data-unit-price-cents={
          typeof trackingProperties.unit_price_cents === "number" ? trackingProperties.unit_price_cents : undefined
        }
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading" ? "Joining..." : submitLabel}
      </button>
    </form>
  );
}
