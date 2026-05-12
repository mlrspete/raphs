import { site } from "@/lib/site";

const offers = [
  {
    eyebrow: "Taste test",
    ...site.offers.previewPass,
    highlight: "Low-friction access for ad traffic and curious buyers.",
  },
  {
    eyebrow: "Main pass",
    ...site.offers.monthlyPass,
    highlight: "For people who want the first proper private-market experience.",
  },
  {
    eyebrow: "Upgrade path",
    ...site.offers.previewUpgrade,
    highlight: "Keeps the preview useful without double-charging early interest.",
  },
];

export function OfferCards() {
  return (
    <section className="bg-white py-16 sm:py-20" id="access">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">Access concept</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            Paid access that tests real intent before the market expands.
          </h2>
          <p className="mt-4 text-lg font-medium leading-8 text-ink/70">
            These are the demand-validation offers for a future private marketplace: a quick preview, a monthly pass,
            and a simple upgrade path for people who want to stay close.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {offers.map((offer, index) => (
            <article
              className="rounded-lg border border-ink/10 bg-cream p-6 shadow-soft"
              key={offer.name}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/60">{offer.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-black leading-tight text-ink">{offer.name}</h3>
              <p className="mt-5 text-4xl font-black leading-none text-ink">{offer.price}</p>
              <p className="mt-5 text-base font-semibold leading-7 text-ink/70">{offer.note}</p>
              <div className="mt-6 h-2 rounded-sm bg-gradient-to-r from-orange via-mint to-lilac" />
              <p className="mt-5 text-sm font-bold leading-6 text-ink/60">{offer.highlight}</p>
              <span className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-black text-orange shadow-soft">
                0{index + 1}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
