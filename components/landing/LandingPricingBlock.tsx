import { CTAImpressionTracker } from "@/components/analytics/CTAImpressionTracker";
import { AccessCTA } from "@/components/marketing/AccessCTA";
import { site } from "@/lib/site";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingPricingBlockProps = {
  page: LandingPageViewModel;
};

export function LandingPricingBlock({ page }: LandingPricingBlockProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-ink p-6 text-white shadow-soft">
      <CTAImpressionTracker
        eventName="pricing_viewed"
        properties={{
          currency: page.currency,
          landing_page_id: page.id,
          landing_slug: page.slug,
          offer_id: page.offerId,
          offer_type: page.offerType,
          price_cents: page.priceCents,
          surface: "landing_pricing_block",
        }}
      />
      <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Access pricing</p>
      <p className="mt-4 text-5xl font-black leading-none sm:text-6xl">{page.priceDisplay ?? `${page.currency} offer`}</p>
      <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/70">
        Pricing is shown in {page.currency}. The CTA marks access intent for this private-market offer.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <AccessCTA
          body={page.modalBody ?? site.soldOutModal.body}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-white/20"
          ctaLabel={page.waitlistCta ?? site.soldOutModal.ctaLabel}
          currency={page.currency}
          eventContext="landing_pricing_primary"
          headline={page.modalHeadline ?? site.soldOutModal.headline}
          landingPageId={page.id}
          landingSlug={page.slug}
          offerId={page.offerId}
          offerType={page.offerType}
          priceCents={page.priceCents}
        >
          {page.ctaPrimary}
        </AccessCTA>
        <AccessCTA
          body={page.modalBody ?? site.soldOutModal.body}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/15 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
          ctaLabel={page.waitlistCta ?? site.soldOutModal.ctaLabel}
          currency={page.currency}
          eventContext="landing_pricing_secondary"
          headline={page.modalHeadline ?? site.soldOutModal.headline}
          landingPageId={page.id}
          landingSlug={page.slug}
          offerId={page.offerId}
          offerType={page.offerType}
          priceCents={page.priceCents}
        >
          {page.ctaSecondary}
        </AccessCTA>
      </div>
    </article>
  );
}
