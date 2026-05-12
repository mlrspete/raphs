import { AccessCTA } from "@/components/marketing/AccessCTA";
import { site } from "@/lib/site";

const deckTags = ["OG reissues", "90s graphics", "shop decks", "rare shapes"];

export function Hero() {
  return (
    <section className="relative min-h-[92svh] border-b border-ink/10 bg-cream">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,252,245,0.96)_0%,rgba(255,238,218,0.9)_46%,rgba(255,138,61,0.64)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(125,222,203,0.42),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(201,182,255,0.34),transparent_26%),radial-gradient(circle_at_70%_82%,rgba(255,176,103,0.45),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-mint to-lilac" />

      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-12 top-20 h-72 w-44 rotate-12 rounded-lg border border-ink/10 bg-white/70 shadow-deck backdrop-blur md:right-20 md:h-96 md:w-60">
          <div className="m-4 h-[calc(100%-2rem)] rounded-md bg-gradient-to-br from-orange via-peach to-mint p-4">
            <div className="h-full rounded-md border border-white/60 bg-white/25" />
          </div>
        </div>
        <div className="absolute bottom-10 left-8 hidden h-80 w-52 -rotate-6 rounded-lg border border-ink/10 bg-white/65 shadow-soft backdrop-blur md:block">
          <div className="m-4 grid h-[calc(100%-2rem)] grid-rows-[1fr_auto] rounded-md bg-gradient-to-br from-lilac via-white to-mint p-4">
            <div className="rounded-md border border-ink/10 bg-white/45" />
            <p className="pt-4 text-center text-sm font-black uppercase tracking-[0.16em] text-ink/70">
              curated
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-center px-5 py-24 sm:px-8 lg:px-12">
        <div className="max-w-4xl">
          <p className="mb-5 inline-flex rounded-md border border-ink/10 bg-white/70 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-ink/70 shadow-soft backdrop-blur sm:text-sm">
            Australia-only private deck access
          </p>
          <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.94] text-ink sm:text-6xl md:text-7xl lg:text-8xl">
            {site.name} is a curated private market for decks worth chasing.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg font-semibold leading-8 text-ink/75 sm:text-xl md:text-2xl md:leading-9">
            {site.description} Test the vibe with a paid preview, then choose whether the full monthly pass is for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AccessCTA
              body={site.soldOutModal.body}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-orange/35"
              ctaLabel={site.soldOutModal.ctaLabel}
              currency={site.currency}
              eventContext="homepage_hero_primary"
              headline={site.soldOutModal.headline}
              offerId={site.offers.previewPass.offerId}
              offerType={site.offers.previewPass.offerType}
              priceCents={site.offers.previewPass.priceCents}
            >
              Get preview access
            </AccessCTA>
            <AccessCTA
              body={site.soldOutModal.body}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-ink/15 bg-white/75 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-mint/35"
              ctaLabel={site.soldOutModal.ctaLabel}
              currency={site.currency}
              eventContext="homepage_hero_secondary"
              headline={site.soldOutModal.headline}
              offerId={site.offers.monthlyPass.offerId}
              offerType={site.offers.monthlyPass.offerType}
              priceCents={site.offers.monthlyPass.priceCents}
            >
              Join monthly pass
            </AccessCTA>
          </div>
        </div>

        <div className="mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {deckTags.map((tag) => (
            <div
              className="rounded-md border border-ink/10 bg-white/65 px-3 py-3 text-center text-xs font-extrabold uppercase tracking-[0.1em] text-ink/70 shadow-soft backdrop-blur"
              key={tag}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
