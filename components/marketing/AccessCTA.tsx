"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SoldOutAccessModal } from "@/components/marketing/SoldOutAccessModal";
import type { TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";

export type AccessCTAProps = {
  children: string;
  className: string;
  headline: string;
  body: string;
  ctaLabel: string;
  offerId?: string | null;
  offerType?: string | null;
  priceCents?: number | null;
  currency: string;
  landingPageId?: string | null;
  landingSlug?: string | null;
  eventContext: string;
};

export function AccessCTA({
  children,
  className,
  headline,
  body,
  ctaLabel,
  offerId,
  offerType,
  priceCents,
  currency,
  landingPageId,
  landingSlug,
  eventContext,
}: AccessCTAProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const impressionTrackedRef = useRef(false);
  const modalProps = useMemo(
    () => ({
      headline,
      body,
      ctaLabel,
      offerId,
      offerType,
      priceCents,
      currency,
      landingPageId,
      landingSlug,
    }),
    [body, ctaLabel, currency, headline, landingPageId, landingSlug, offerId, offerType, priceCents],
  );
  const trackingProperties = useMemo<TrackEventProperties>(
    () => ({
      currency,
      cta_label: children,
      event_context: eventContext,
      landing_page_id: landingPageId ?? null,
      landing_slug: landingSlug ?? null,
      offer_id: offerId ?? null,
      offer_type: offerType ?? null,
      price_cents: priceCents ?? null,
    }),
    [children, currency, eventContext, landingPageId, landingSlug, offerId, offerType, priceCents],
  );
  const openModal = useCallback(() => {
    trackEvent("paid_intent_clicked", trackingProperties);

    if (offerId || offerType) {
      trackEvent("offer_intent_clicked", trackingProperties);
    }

    trackEvent("sold_out_modal_opened", trackingProperties);
    setOpen(true);
  }, [offerId, offerType, trackingProperties]);
  const closeModal = useCallback(
    (closeReason: string) => {
      trackEvent("sold_out_modal_closed", {
        ...trackingProperties,
        close_reason: closeReason,
      });
      setOpen(false);
    },
    [trackingProperties],
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

  return (
    <>
      <button
        className={className}
        data-currency={currency}
        data-event="paid_intent_clicked"
        data-event-context={eventContext}
        data-landing-page-id={landingPageId ?? undefined}
        data-landing-slug={landingSlug ?? undefined}
        data-offer-id={offerId ?? undefined}
        data-offer-type={offerType ?? undefined}
        data-price-cents={priceCents ?? undefined}
        onClick={openModal}
        ref={buttonRef}
        type="button"
      >
        {children}
      </button>
      <SoldOutAccessModal {...modalProps} onClose={closeModal} open={open} />
    </>
  );
}
