"use client";

import { useEffect, useId, useRef } from "react";

import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import type { TrackEventProperties } from "@/lib/analytics/types";

export type SoldOutAccessModalCloseReason = "backdrop" | "close_button" | "escape";

export type SoldOutAccessModalProps = {
  headline: string;
  body: string;
  ctaLabel: string;
  offerId?: string | null;
  offerType?: string | null;
  priceCents?: number | null;
  currency: string;
  landingPageId?: string | null;
  landingSlug?: string | null;
  extraTrackingProperties?: TrackEventProperties;
  open: boolean;
  onClose: (reason: SoldOutAccessModalCloseReason) => void;
};

export function SoldOutAccessModal({
  ctaLabel,
  offerId,
  offerType,
  priceCents,
  currency,
  landingPageId,
  landingSlug,
  extraTrackingProperties,
  open,
  onClose,
}: SoldOutAccessModalProps) {
  const titleId = useId();
  const bodyId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose("escape");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button
        aria-label="Close sold-out access dialog"
        className="absolute inset-0 cursor-default bg-ink/72 backdrop-blur-sm"
        onClick={() => onClose("backdrop")}
        type="button"
      />
      <div
        aria-describedby={bodyId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative max-h-[94svh] w-full max-w-lg overflow-hidden rounded-t-lg border border-white/55 bg-cream text-ink shadow-deck sm:max-h-[92svh] sm:rounded-lg"
        role="dialog"
      >
        <div className="absolute -right-20 -top-20 h-52 w-72 rotate-6 rounded-lg bg-orange/30 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-peach to-mint" />
        <button
          aria-label="Close dialog"
          className="absolute right-4 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 bg-white/82 text-xl font-black leading-none text-ink shadow-soft transition hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/30"
          onClick={() => onClose("close_button")}
          ref={closeButtonRef}
          type="button"
        >
          x
        </button>

        <div className="relative max-h-[94svh] overflow-y-auto p-5 pt-8 sm:max-h-[92svh] sm:p-8 sm:pt-10">
          <div className="pr-12">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange">WAVE 1 ACCESS</p>
            <h2 className="mt-3 text-6xl font-black uppercase leading-[0.82] text-ink sm:text-7xl" id={titleId}>
              SOLD OUT
            </h2>
            <p className="mt-5 text-base font-semibold leading-7 text-ink/72" id={bodyId}>
              Today&apos;s access passes are sold out. Wave 1 of Monroes Market has reached capacity. Join the list and
              we&apos;ll email you when the next access window opens.
            </p>
            <p className="mt-4 rounded-md border border-ink/10 bg-white/62 px-3 py-2 text-xs font-black uppercase leading-5 text-ink/56">
              Limited daily access passes | Australia | no payment processed
            </p>
          </div>

          <WaitlistForm
            ctaLabel={ctaLabel}
            currency={currency}
            landingPageId={landingPageId}
            landingSlug={landingSlug}
            offerId={offerId}
            offerType={offerType}
            priceCents={priceCents}
            extraTrackingProperties={extraTrackingProperties}
          />
        </div>
      </div>
    </div>
  );
}
