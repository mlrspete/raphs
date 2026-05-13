import { AccessCTA } from "@/components/marketing/AccessCTA";
import { site } from "@/lib/site";

const preferences = ["OG graphics", "Rare reissues", "Vintage decks", "Wall-hangers", "Aussie sellers", "Odd shapes"];

export function PreferencePrompt() {
  return (
    <section className="bg-ink py-16 text-white sm:py-20" id="preferences">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">Access list</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Tell the first version what kind of decks should show up.
          </h2>
          <p className="mt-4 text-lg font-medium leading-8 text-white/70">
            The access-list CTA captures sold-out demand signals now: buyers want a curated place to find skate decks
            without trawling every corner of the internet.
          </p>
          <AccessCTA
            body={site.soldOutModal.body}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-orange px-6 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-white/20 sm:w-auto"
            ctaLabel={site.soldOutModal.ctaLabel}
            currency={site.currency}
            eventContext="homepage_preference_prompt"
            headline={site.soldOutModal.headline}
            offerId={site.offers.previewPass.offerId}
            offerType={site.offers.previewPass.offerType}
            priceCents={site.offers.previewPass.priceCents}
          >
            Unlock access
          </AccessCTA>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {preferences.map((preference) => (
            <div
              className="rounded-md border border-white/10 bg-white/10 px-4 py-5 text-center text-sm font-black uppercase tracking-[0.1em] text-white/80"
              key={preference}
            >
              {preference}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
