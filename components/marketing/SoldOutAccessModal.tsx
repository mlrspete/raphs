"use client";

import { useEffect, useId, useRef } from "react";

import { WaitlistForm } from "@/components/marketing/WaitlistForm";

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
  open: boolean;
  onClose: (reason: SoldOutAccessModalCloseReason) => void;
};

export function SoldOutAccessModal({
  headline,
  body,
  ctaLabel,
  offerId,
  offerType,
  priceCents,
  currency,
  landingPageId,
  landingSlug,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        aria-label="Close sold-out access dialog"
        className="absolute inset-0 cursor-default bg-ink/65 backdrop-blur-sm"
        onClick={() => onClose("backdrop")}
        type="button"
      />
      <div
        aria-describedby={bodyId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-lg border border-ink/10 bg-cream p-5 text-ink shadow-deck sm:p-7"
        role="dialog"
      >
        <button
          aria-label="Close dialog"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 bg-white text-2xl font-black leading-none text-ink shadow-soft transition hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/30"
          onClick={() => onClose("close_button")}
          ref={closeButtonRef}
          type="button"
        >
          x
        </button>

        <div className="pr-12">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Access window</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl" id={titleId}>
            {headline}
          </h2>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/72" id={bodyId}>
            {body}
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-lg border border-ink/10 bg-white p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/55">Offer</p>
            <p className="mt-1 text-sm font-black text-ink">{offerType ?? "access_pass"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/55">Price</p>
            <p className="mt-1 text-sm font-black text-ink">
              {typeof priceCents === "number" ? `${currency} ${(priceCents / 100).toFixed(2)}` : currency}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/55">Market</p>
            <p className="mt-1 text-sm font-black text-ink">Australia</p>
          </div>
        </div>

        <WaitlistForm
          ctaLabel={ctaLabel}
          currency={currency}
          landingPageId={landingPageId}
          landingSlug={landingSlug}
          offerId={offerId}
          offerType={offerType}
          priceCents={priceCents}
        />
      </div>
    </div>
  );
}
