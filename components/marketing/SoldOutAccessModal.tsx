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

function readPositiveNumber(properties: TrackEventProperties | undefined, key: string) {
  const value = properties?.[key];

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
}

function formatCurrencyFromCents(cents: number, currency: string) {
  return `$${(cents / 100).toFixed(2)} ${currency}`;
}

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
  const selectedQuantity = readPositiveNumber(extraTrackingProperties, "daypass_quantity");
  const selectedTotalPriceCents = readPositiveNumber(extraTrackingProperties, "total_price_cents");
  const selectedTotalSummary =
    selectedQuantity && selectedTotalPriceCents
      ? `Total: ${selectedQuantity} Daypass${
          selectedQuantity === 1 ? "" : "es"
        } - ${formatCurrencyFromCents(selectedTotalPriceCents, currency)}`
      : null;

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
        className="relative max-h-[94svh] w-full max-w-xl overflow-hidden rounded-t-[24px] border border-white/60 bg-[#FFFDF7] text-ink shadow-[0_30px_90px_rgba(23,23,23,0.28),0_0_70px_rgba(255,122,61,0.18)] sm:max-h-[92svh] sm:rounded-[26px]"
        role="dialog"
      >
        <div className="absolute -right-20 -top-20 h-52 w-72 rotate-6 rounded-[32px] bg-orange/25 blur-3xl" />
        <div className="absolute -left-24 bottom-12 h-48 w-64 rounded-full bg-mint/25 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-peach to-mint" />
        <button
          aria-label="Close dialog"
          className="absolute right-4 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-ink/10 bg-white/85 text-xl font-black leading-none text-ink shadow-soft transition hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/30"
          onClick={() => onClose("close_button")}
          ref={closeButtonRef}
          type="button"
        >
          x
        </button>

        <div className="relative max-h-[94svh] overflow-y-auto p-5 pt-8 sm:max-h-[92svh] sm:p-8 sm:pt-10">
          <div className="pr-12">
            <p className="text-[0.6875rem] font-black uppercase tracking-[0.24em] text-orange">WAVE 1 ACCESS</p>
            <h2
              className="mt-3 text-[2.75rem] font-black uppercase leading-[0.88] tracking-[-0.04em] text-[#171717] sm:text-6xl"
              id={titleId}
            >
              SOLD OUT
            </h2>
            <p className="mt-5 text-base font-semibold leading-[1.6] text-[#333333]" id={bodyId}>
              This promotion has sold out. Wave 1 of Monroes Market reached capacity for today. Thanks for the support
              --- join the list and we will email you when the next Daypass wave opens.
            </p>
            {selectedTotalSummary ? (
              <p className="mt-4 rounded-[14px] border border-ink/10 bg-white/70 px-4 py-3 text-sm font-black leading-6 text-[#171717] shadow-soft">
                {selectedTotalSummary}
              </p>
            ) : null}
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
