import { CTAImpressionTracker } from "@/components/analytics/CTAImpressionTracker";
import { AccessCTA } from "@/components/marketing/AccessCTA";
import { site } from "@/lib/site";

const offers = [
  {
    eyebrow: "24-hour look",
    name: "PREVIEW DAYPASS",
    price: site.offers.previewPass.price,
    note: "A one-day look inside Monroes. Browse private deck listings and decide whether the full membership belongs in your rotation.",
    bullets: ["Private deck listings", "Collector-led deck mix", "Members-only entry"],
    buttonLabel: "Get preview access",
    offerId: site.offers.previewPass.offerId,
    offerType: site.offers.previewPass.offerType,
    priceCents: site.offers.previewPass.priceCents,
  },
  {
    eyebrow: "Full access",
    name: "MONROES ULTRA",
    price: site.offers.monthlyPass.price,
    note: "Full unrestricted Monroes access for members who want ongoing access to private listings, drops, and seller opportunities.",
    bullets: ["Ongoing member access", "Early drops and seller opportunities", "No sale fees for selected sellers"],
    buttonLabel: "Join Ultra",
    offerId: site.offers.monthlyPass.offerId,
    offerType: site.offers.monthlyPass.offerType,
    priceCents: site.offers.monthlyPass.priceCents,
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
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-orange">Packages</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none text-ink sm:text-6xl">
              Choose your access.
            </h2>
          </div>
          <p className="max-w-2xl text-lg font-semibold leading-8 text-ink/70 lg:justify-self-end">
            Monroes is a members-only private skateboard marketplace. Listings stay behind the gate, members are let in
            gradually, and selected sellers pay no sale fees while the community grows.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {offers.map((offer, index) => (
            <article
              className="group relative overflow-hidden rounded-lg border border-ink/10 bg-cream p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-deck sm:p-8"
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
                  <AccessCTA
                    body={site.soldOutModal.body}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 py-3 text-center text-sm font-black uppercase text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
                    ctaLabel={site.soldOutModal.ctaLabel}
                    currency={site.currency}
                    eventContext={`homepage_offer_${offer.offerType}`}
                    headline={site.soldOutModal.headline}
                    offerId={offer.offerId}
                    offerType={offer.offerType}
                    priceCents={offer.priceCents}
                  >
                    {offer.buttonLabel}
                  </AccessCTA>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-ink/10 bg-cream px-5 py-4">
          <p className="text-sm font-bold leading-6 text-ink/65">
            Access opens gradually. Joining the list means we will email you when more member places become available;
            no payment is processed at this stage.
          </p>
        </div>
      </div>
    </section>
  );
}
