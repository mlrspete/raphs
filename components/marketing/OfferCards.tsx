import { CTAImpressionTracker } from "@/components/analytics/CTAImpressionTracker";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { site } from "@/lib/site";

const offers = [
  {
    eyebrow: "12-hour look",
    name: "DAYPASS",
    price: site.offers.previewPass.price,
    note: "Try out Monroes for a day. Browse private listings and decide whether you want to go Monroes Ultra.",
    bullets: ["Private listings preview", "12-hour look inside Monroes", "One-time purchase, no hidden fees"],
    buttonLabel: "GET DAYPASS",
  },
  {
    eyebrow: "Full membership",
    name: "MONROES ULTRA",
    price: site.offers.monthlyPass.price,
    note: "Full unrestricted access to Monroes private listings.",
    bullets: ["Ongoing member access", "Access to the most sought-after decks in Australia.", "No hidden fees."],
    buttonLabel: "JOIN ULTRA",
  },
];

export function OfferCards() {
  return (
    <section className="relative bg-white py-16 sm:py-20" id="access">
      <CTAImpressionTracker
        eventName="pricing_viewed"
        properties={{
          currency: site.currency,
          surface: "homepage_offer_cards",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <ScrollReveal className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-orange">Packages</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none text-ink sm:text-6xl">
              Join Monroes.
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-10 grid gap-5 lg:grid-cols-2" stagger={0.08}>
          {offers.map((offer, index) => (
            <article
              className="group relative overflow-hidden rounded-lg border border-ink/10 bg-cream p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-deck sm:p-8"
              data-scroll-reveal-item
              key={offer.name}
            >
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-peach to-mint" />
              <div className="absolute -right-16 -top-16 h-44 w-72 rotate-6 rounded-lg bg-orange/18 blur-3xl transition group-hover:bg-orange/28" />
              <div className="relative flex h-full flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="rounded-md border border-ink/10 bg-white/70 px-3 py-2 text-xs font-black uppercase text-ink/65">
                    {offer.eyebrow}
                  </p>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-black text-orange shadow-soft">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-7 text-3xl font-black uppercase leading-none text-ink sm:text-4xl">{offer.name}</h3>
                <p className="mt-5 text-4xl font-black leading-none text-ink sm:text-5xl">{offer.price}</p>
                <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-ink/70">{offer.note}</p>

                <ul className="mt-6 grid gap-3">
                  {offer.bullets.map((bullet) => (
                    <li className="flex items-center gap-3 text-sm font-black uppercase text-ink/68" key={bullet}>
                      <span className="h-2 w-2 rounded-full bg-orange" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 text-center text-sm font-black uppercase text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
                    type="button"
                  >
                    {offer.buttonLabel}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
