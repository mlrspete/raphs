"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getAttributionContext } from "@/lib/analytics/attribution";
import type { TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { campaign001Slug } from "@/lib/domain/campaigns/config";

type CampaignDaypassCheckoutButtonProps = {
  children: string;
  className: string;
  currency: "AUD";
  daypassQuantity: number;
  landingPageId: string;
  landingSlug: string;
  offerId: string | null;
  offerType: string | null;
  totalPriceCents: number;
  unitPriceCents: number;
  extraTrackingProperties?: TrackEventProperties;
};

type CheckoutResponse =
  | {
      success: true;
      url: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export function CampaignDaypassCheckoutButton({
  children,
  className,
  currency,
  daypassQuantity,
  extraTrackingProperties = {},
  landingPageId,
  landingSlug,
  offerId,
  offerType,
  totalPriceCents,
  unitPriceCents,
}: CampaignDaypassCheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const impressionTrackedRef = useRef(false);
  const trackingProperties = useMemo<TrackEventProperties>(
    () => ({
      currency,
      cta_label: children,
      daypass_quantity: daypassQuantity,
      event_context: "campaign_001_checkout",
      landing_page_id: landingPageId,
      landing_slug: landingSlug,
      offer_id: offerId,
      offer_type: offerType,
      price_cents: unitPriceCents,
      total_price_cents: totalPriceCents,
      unit_price_cents: unitPriceCents,
      ...extraTrackingProperties,
    }),
    [
      children,
      currency,
      daypassQuantity,
      extraTrackingProperties,
      landingPageId,
      landingSlug,
      offerId,
      offerType,
      totalPriceCents,
      unitPriceCents,
    ],
  );

  useEffect(() => {
    const button = buttonRef.current;

    if (!button || impressionTrackedRef.current) {
      return;
    }

    function trackImpression() {
      if (impressionTrackedRef.current) {
        return;
      }

      impressionTrackedRef.current = true;
      trackEvent("cta_impression", trackingProperties);
    }

    if (!("IntersectionObserver" in window)) {
      trackImpression();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          trackImpression();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(button);

    return () => observer.disconnect();
  }, [trackingProperties]);

  async function startCheckout() {
    if (isLoading) {
      return;
    }

    const attribution = getAttributionContext();
    setError(null);
    setIsLoading(true);

    trackEvent("paid_intent_clicked", trackingProperties);
    trackEvent("offer_intent_clicked", trackingProperties);
    trackEvent("checkout_started", trackingProperties);

    try {
      const response = await fetch("/api/checkout/daypass", {
        body: JSON.stringify({
          attribution,
          campaign_slug: campaign001Slug,
          quantity: daypassQuantity,
          source_landing_page_id: landingPageId,
          source_slug: landingSlug,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        throw new Error(body.success ? "Checkout could not be started." : body.error);
      }

      if (!body.success) {
        throw new Error(body.error);
      }

      trackEvent("checkout_redirected", trackingProperties);
      window.location.assign(body.url);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Checkout could not be started.";
      setError(message);
      setIsLoading(false);
      trackEvent("checkout_failed", {
        ...trackingProperties,
        checkout_error: message,
      });
    }
  }

  return (
    <div>
      <button className={className} disabled={isLoading} onClick={startCheckout} ref={buttonRef} type="button">
        {isLoading ? "Opening checkout..." : children}
      </button>
      {error ? <p className="mt-3 text-center text-sm font-bold leading-6 text-[#FFD6C7]">{error}</p> : null}
    </div>
  );
}
