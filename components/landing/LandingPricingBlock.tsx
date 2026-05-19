"use client";

import { useMemo } from "react";

import { CTAImpressionTracker } from "@/components/analytics/CTAImpressionTracker";
import { CampaignDaypassCheckoutButton } from "@/components/landing/CampaignDaypassCheckoutButton";
import { AccessCTA } from "@/components/marketing/AccessCTA";
import type { TrackEventProperties } from "@/lib/analytics/types";
import { campaign001Slug } from "@/lib/domain/campaigns/config";
import { site } from "@/lib/site";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingPricingBlockProps = {
  page: LandingPageViewModel;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPriceCents: number;
  onQuantityChange: (quantity: number) => void;
};

const promoItem = "1988 Tony Hawk Powell Peralta Deck";
const campaignBonusEntryLabel = "1 free entry into the 1988 Tony Hawk Powell Peralta Deck promo giveaway";

function formatAud(cents: number) {
  return `$${(cents / 100).toFixed(2)} AUD`;
}

export function LandingPricingBlock({
  page,
  quantity,
  minQuantity,
  maxQuantity,
  unitPriceCents,
  onQuantityChange,
}: LandingPricingBlockProps) {
  const totalPriceCents = quantity * unitPriceCents;
  const isCampaign001 = page.slug === campaign001Slug;
  const trackingContext = useMemo<TrackEventProperties>(
    () => ({
      campaign_bonus_entry: true,
      campaign_bonus_entry_label: campaignBonusEntryLabel,
      campaign_limit: page.campaignLimit,
      currency: page.currency,
      daypass_quantity: quantity,
      promo_item: promoItem,
      total_price_cents: totalPriceCents,
      unit_price_cents: unitPriceCents,
    }),
    [page.campaignLimit, page.currency, quantity, totalPriceCents, unitPriceCents],
  );

  function decrementQuantity() {
    onQuantityChange(Math.max(minQuantity, quantity - 1));
  }

  function incrementQuantity() {
    onQuantityChange(Math.min(maxQuantity, quantity + 1));
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
          daypass_quantity: quantity,
          landing_page_id: page.id,
          landing_slug: page.slug,
          offer_id: page.offerId,
          offer_type: page.offerType,
          price_cents: unitPriceCents,
          promo_item: promoItem,
          surface: "landing_pricing_block",
          total_price_cents: totalPriceCents,
          unit_price_cents: unitPriceCents,
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <p className="landing-card-eyebrow">DAYPASS</p>
          <p className="rounded-full border border-orange/25 bg-orange/10 px-3 py-2 text-[0.625rem] font-black uppercase leading-4 tracking-[0.2em] text-[#D93A1A] shadow-[0_0_28px_rgba(255,122,61,0.22)] motion-safe:animate-pulse">
            LIMITED PASSES REMAINING
          </p>
        </div>
        <p className="mt-5 break-words text-[2.5rem] font-black leading-none text-white sm:text-5xl">
          {formatAud(unitPriceCents)}
        </p>
        <p className="mt-4 max-w-xl text-base font-semibold leading-[1.65] text-white/70">
          12-hour Monroes preview access.
        </p>

        <div className="mt-8 rounded-[18px] border border-white/[0.12] bg-white/[0.08] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-white/70">Daypasses</p>
            <div className="flex items-center gap-3">
              <button
                aria-label="Decrease Daypass quantity"
                className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-35"
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
                className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-35"
                disabled={quantity === maxQuantity}
                onClick={incrementQuantity}
                type="button"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-white/70">
            Total: <span className="text-orange">{formatAud(totalPriceCents)}</span>
          </p>
        </div>

        {isCampaign001 ? (
          <CampaignDaypassCheckoutButton
            className="landing-button mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] bg-orange px-6 py-3 text-center text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-orange-hover hover:text-white focus:outline-none focus:ring-4 focus:ring-white/20 disabled:cursor-wait disabled:opacity-70"
            currency={page.currency}
            daypassQuantity={quantity}
            extraTrackingProperties={trackingContext}
            landingPageId={page.id}
            landingSlug={page.slug}
            offerId={page.offerId}
            offerType={page.offerType}
            totalPriceCents={totalPriceCents}
            unitPriceCents={unitPriceCents}
          >
            GET DAYPASS
          </CampaignDaypassCheckoutButton>
        ) : (
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
            priceCents={unitPriceCents}
          >
            GET DAYPASS
          </AccessCTA>
        )}
        <p className="mt-3 text-center text-xs font-semibold leading-5 text-white/60">
          One-time purchase, no hidden fees.
        </p>
      </div>
    </article>
  );
}
