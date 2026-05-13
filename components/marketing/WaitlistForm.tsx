"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { getAttributionContext } from "@/lib/analytics/attribution";
import type { TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";
import type { WaitlistApiResponse } from "@/lib/types/waitlist";
import {
  budgetRangeOptions,
  buyerSellerIntentOptions,
  likelihoodToBuyOptions,
  preferredCategoryOptions,
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

function firstError(fieldErrors: Record<string, string[]> | undefined, field: string) {
  return fieldErrors?.[field]?.[0] ?? null;
}

function toSingleFieldErrors(fieldErrors: Record<string, string[]> | undefined) {
  return Object.fromEntries(
    Object.entries(fieldErrors ?? {}).map(([field, messages]) => [field, messages[0] ?? "Invalid value."]),
  ) as Record<string, string>;
}

function selectClassName(hasError: boolean) {
  return [
    "min-h-11 rounded-md border bg-white px-3 text-sm font-bold text-ink outline-none focus:ring-4 focus:ring-orange/25",
    hasError ? "border-red-500" : "border-ink/12",
  ].join(" ");
}

export function WaitlistForm({
  ctaLabel,
  offerId,
  offerType,
  priceCents,
  currency,
  landingPageId,
  landingSlug,
}: WaitlistFormProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const startedRef = useRef(false);
  const lastBrandsTrackedRef = useRef("");
  const trackingProperties = useMemo<TrackEventProperties>(
    () => ({
      currency,
      landing_page_id: landingPageId ?? null,
      landing_slug: landingSlug ?? null,
      offer_id: offerId ?? null,
      offer_type: offerType ?? null,
      price_cents: priceCents ?? null,
    }),
    [currency, landingPageId, landingSlug, offerId, offerType, priceCents],
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
      <div className="mt-5 rounded-lg border border-mint/50 bg-mint/20 p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">You are on the list</p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-ink">Thanks, we saved your access request.</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">
          We will email you when the next Raph&apos;s Market access window opens. No payment has been taken.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-5 grid gap-4 rounded-lg border border-ink/10 bg-white/75 p-4" onFocusCapture={() => markStarted("form_focus")} onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-ink sm:col-span-2">
          Email address *
          <input
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
            className={`min-h-12 rounded-md border bg-white px-4 text-base font-semibold text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25 ${
              fieldErrors.email ? "border-red-500" : "border-ink/12"
            }`}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={formState.email}
          />
          {fieldErrors.email ? <span className="text-xs font-bold text-red-600">{fieldErrors.email}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-black text-ink">
          First name
          <input
            autoComplete="given-name"
            className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm font-bold text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25"
            onChange={(event) => updateField("firstName", event.target.value)}
            placeholder="Raph"
            type="text"
            value={formState.firstName}
          />
        </label>

        <label className="grid gap-2 text-sm font-black text-ink">
          Budget range
          <select
            className={selectClassName(Boolean(fieldErrors.budgetRange))}
            onChange={(event) => {
              updateField("budgetRange", event.target.value);
              if (event.target.value) {
                trackEvent("budget_selected", {
                  ...trackingProperties,
                  budget_range: event.target.value,
                });
              }
            }}
            value={formState.budgetRange}
          >
            <option value="">Pick a range</option>
            {budgetRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-ink">
          Preferred era/category
          <select
            className={selectClassName(Boolean(fieldErrors.preferredCategory))}
            onChange={(event) => {
              updateField("preferredCategory", event.target.value);
              if (event.target.value) {
                trackEvent("category_selected", {
                  ...trackingProperties,
                  preferred_category: event.target.value,
                });
              }
            }}
            value={formState.preferredCategory}
          >
            <option value="">Pick a lane</option>
            {preferredCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-ink">
          Buyer/seller intent
          <select
            className={selectClassName(Boolean(fieldErrors.buyerSellerIntent))}
            onChange={(event) => updateField("buyerSellerIntent", event.target.value)}
            value={formState.buyerSellerIntent}
          >
            <option value="">Pick one</option>
            {buyerSellerIntentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-ink">
          Likelihood to buy access
          <select
            className={selectClassName(Boolean(fieldErrors.likelihoodToBuy))}
            onChange={(event) => updateField("likelihoodToBuy", event.target.value)}
            value={formState.likelihoodToBuy}
          >
            <option value="">Pick one</option>
            {likelihoodToBuyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black text-ink sm:col-span-2">
          Favourite brands
          <input
            className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm font-bold text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25"
            onBlur={() => {
              const trimmedBrands = formState.favouriteBrands.trim();

              if (trimmedBrands && trimmedBrands !== lastBrandsTrackedRef.current) {
                lastBrandsTrackedRef.current = trimmedBrands;
                trackEvent("brand_interest_added", {
                  ...trackingProperties,
                  brand_count: trimmedBrands.split(",").filter(Boolean).length,
                });
              }
            }}
            onChange={(event) => updateField("favouriteBrands", event.target.value)}
            placeholder="Girl, Chocolate, Alien Workshop"
            type="text"
            value={formState.favouriteBrands}
          />
        </label>
      </div>

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

      <label className="flex gap-3 rounded-md border border-ink/10 bg-cream/70 p-3 text-sm font-semibold leading-6 text-ink/70">
        <input
          checked={formState.consentMarketing}
          className="mt-1 h-4 w-4 accent-orange"
          onChange={(event) => updateField("consentMarketing", event.target.checked)}
          type="checkbox"
        />
        <span>
          I agree to receive emails about Raph&apos;s Market access windows and understand no payment is being processed.
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

      {formError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{formError}</p> : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
        data-currency={currency}
        data-event="waitlist_submitted"
        data-landing-page-id={landingPageId ?? undefined}
        data-landing-slug={landingSlug ?? undefined}
        data-offer-id={offerId ?? undefined}
        data-offer-type={offerType ?? undefined}
        data-price-cents={priceCents ?? undefined}
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading" ? "Joining..." : ctaLabel}
      </button>
    </form>
  );
}
