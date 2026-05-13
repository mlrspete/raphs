import { AccessCTA } from "@/components/marketing/AccessCTA";
import { site } from "@/lib/site";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingHeroProps = {
  page: LandingPageViewModel;
};

export function LandingHero({ page }: LandingHeroProps) {
  return (
    <section className="relative min-h-[86svh] border-b border-ink/10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,252,245,0.98)_0%,rgba(255,238,218,0.9)_48%,rgba(255,138,61,0.62)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(125,222,203,0.38),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(201,182,255,0.34),transparent_27%)]" />
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-mint to-lilac" />

      <div className="relative mx-auto grid min-h-[86svh] max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-12">
        <div>
          <p className="mb-5 inline-flex max-w-full flex-wrap rounded-md border border-ink/10 bg-white/70 px-3 py-2 text-xs font-extrabold uppercase leading-5 tracking-[0.12em] text-ink/70 shadow-soft backdrop-blur sm:text-sm sm:tracking-[0.16em]">
            {site.market}-only | {page.currency} | {page.categoryFocus ?? "private deck access"}
          </p>
          <h1 className="max-w-4xl text-balance text-4xl font-black leading-[0.98] text-ink sm:text-6xl sm:leading-[0.94] lg:text-7xl">
            {page.headline}
          </h1>
          {page.subheadline ? (
            <p className="mt-6 max-w-2xl text-pretty text-lg font-semibold leading-8 text-ink/75 sm:text-xl md:text-2xl md:leading-9">
              {page.subheadline}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AccessCTA
              body={page.modalBody ?? site.soldOutModal.body}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-6 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
              ctaLabel={page.waitlistCta ?? site.soldOutModal.ctaLabel}
              currency={page.currency}
              eventContext="landing_hero_primary"
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
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-ink/15 bg-white/75 px-6 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-ink shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-mint/35 sm:w-auto"
              ctaLabel={page.waitlistCta ?? site.soldOutModal.ctaLabel}
              currency={page.currency}
              eventContext="landing_hero_secondary"
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
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm sm:max-w-md">
          <div className="absolute inset-6 rotate-6 rounded-lg bg-orange shadow-deck" />
          <div className="absolute inset-0 -rotate-3 rounded-lg border border-ink/10 bg-white/85 p-5 shadow-soft backdrop-blur">
            <div
              className="flex h-full flex-col justify-between rounded-md border border-ink/10 bg-gradient-to-br from-white via-peach to-mint p-6"
              style={page.heroImageUrl ? { backgroundImage: `url(${page.heroImageUrl})`, backgroundSize: "cover" } : undefined}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/60">{page.priceDisplay}</p>
              <div className="rounded-md border border-white/60 bg-white/70 p-4 shadow-soft backdrop-blur">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-orange">Access test</p>
                <p className="mt-2 text-2xl font-black leading-tight text-ink">{site.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
