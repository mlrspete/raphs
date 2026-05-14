"use client";

import { useMemo, useState } from "react";

import { CTAImpressionTracker } from "@/components/analytics/CTAImpressionTracker";
import { AccessCTA } from "@/components/marketing/AccessCTA";
import type { TrackEventProperties } from "@/lib/analytics/types";
import { site } from "@/lib/site";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingPricingBlockProps = {
  page: LandingPageViewModel;
};

const daypassUnitPriceCents = 499;
const minQuantity = 1;
const maxQuantity = 10;

function formatAud(cents: number) {
  return `$${(cents / 100).toFixed(2)} AUD`;
}

export function LandingPricingBlock({ page }: LandingPricingBlockProps) {
  const [quantity, setQuantity] = useState(minQuantity);
  const totalPriceCents = quantity * daypassUnitPriceCents;
  const campaignBonusEntryLabel = page.bonusEntryLabel;
  const trackingContext = useMemo<TrackEventProperties>(
    () => ({
      campaign_bonus_entry: true,
      campaign_bonus_entry_label: campaignBonusEntryLabel,
      campaign_limit: page.campaignLimit,
      currency: page.currency,
      daypass_quantity: quantity,
      total_price_cents: totalPriceCents,
      unit_price_cents: daypassUnitPriceCents,
    }),
    [campaignBonusEntryLabel, page.campaignLimit, page.currency, quantity, totalPriceCents],
  );

  function decrementQuantity() {
    setQuantity((current) => Math.max(minQuantity, current - 1));
  }

  function incrementQuantity() {
    setQuantity((current) => Math.min(maxQuantity, current + 1));
  }

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-dark-card/50 bg-dark p-6 text-white shadow-soft sm:p-8">
      <div className="landing-topography absolute inset-0 opacity-10" />
      <CTAImpressionTracker
        eventName="pricing_viewed"
        properties={{
          campaign_bonus_entry: true,
          campaign_bonus_entry_label: campaignBonusEntryLabel,
          campaign_limit: page.campaignLimit,
          currency: page.currency,
          daypass_quantity: minQuantity,
          landing_page_id: page.id,
          landing_slug: page.slug,
          offer_id: page.offerId,
          offer_type: page.offerType,
          price_cents: daypassUnitPriceCents,
          surface: "landing_pricing_block",
          total_price_cents: daypassUnitPriceCents,
          unit_price_cents: daypassUnitPriceCents,
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <p className="landing-card-eyebrow">DAYPASS</p>
          <p className="rounded-full border border-orange/20 bg-orange/10 px-3 py-2 text-[0.625rem] font-black uppercase leading-4 tracking-[0.18em] text-[#D93A1A] shadow-[0_0_28px_rgba(255,122,61,0.22)] motion-safe:animate-pulse">
            Limited wave passes remaining
          </p>
        </div>
        <p className="mt-5 break-words text-[2.5rem] font-black leading-none text-white sm:text-5xl">
          {formatAud(daypassUnitPriceCents)}
        </p>
        <p className="mt-4 max-w-xl text-base font-semibold leading-[1.65] text-white/70">
          24-hour Monroes Market preview access.
        </p>

        <div className="mt-8 rounded-[18px] border border-white/[0.12] bg-white/[0.08] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-white/70">Daypasses</p>
            <div className="flex items-center gap-3">
              <button
                aria-label="Decrease Daypass quantity"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-35"
                disabled={quantity === minQuantity}
                onClick={decrementQuantity}
                type="button"
              >
                -
              </button>
              <span className="min-w-8 text-center text-2xl font-black text-orange" aria-live="polite">
                {quantity}
              </span>
              <button
                aria-label="Increase Daypass quantity"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-35"
                disabled={quantity === maxQuantity}
                onClick={incrementQuantity}
                type="button"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-white/70">
            Selected intent: <span className="text-orange">{formatAud(totalPriceCents)}</span>
          </p>
        </div>

        <AccessCTA
          body={page.modalBody ?? site.soldOutModal.body}
          className="landing-button mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] bg-orange px-6 py-3 text-center text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-orange-hover hover:text-white focus:outline-none focus:ring-4 focus:ring-white/20"
          ctaLabel={page.waitlistCta ?? site.soldOutModal.ctaLabel}
          currency={page.currency}
          eventContext="landing_pricing_primary"
          extraTrackingProperties={trackingContext}
          headline={page.modalHeadline ?? site.soldOutModal.headline}
          landingPageId={page.id}
          landingSlug={page.slug}
          offerId={page.offerId}
          offerType={page.offerType}
          priceCents={daypassUnitPriceCents}
        >
          GET DAYPASS
        </AccessCTA>
        <p className="mt-3 text-center text-xs font-semibold leading-5 text-white/60">
          No payment is processed in this V0 access test.
        </p>
      </div>
    </article>
  );
}
