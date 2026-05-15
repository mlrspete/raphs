import type { LandingPageViewModel } from "@/lib/landing-tests/types";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { LandingDaypassOfferSection } from "@/components/landing/LandingDaypassOfferSection";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFinalCTA } from "@/components/landing/LandingFinalCTA";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMediaGrid } from "@/components/landing/LandingMediaGrid";

type LandingPageRendererProps = {
  page: LandingPageViewModel;
};

const educationCards = [
  {
    eyebrow: "LOW COMMITMENT",
    title: "Try the private deck market before going monthly.",
    body: "The Daypass is for buyers who want a quick look first: browse what is inside, see whether the listings feel right, then decide if Monroes Ultra makes sense.",
    bullets: ["24-hour preview access", "$4.99 AUD Daypass", "No monthly commitment in this wave"],
  },
  {
    eyebrow: "DECK FOCUS",
    title: "Built for boards with better stories than stock listings.",
    body: "Monroes is for OG graphics, rare shapes, wall-hangers, reissues, oddball cruisers, and decks that feel harder to find twice.",
    bullets: ["OG graphics", "Rare reissues", "Vintage decks", "Odd shapes and wall-hangers"],
  },
];

export function LandingPageRenderer({ page }: LandingPageRendererProps) {
  return (
    <main className="overflow-hidden bg-cream text-ink">
      <PageViewTracker
        eventName="landing_viewed"
        properties={{
          currency: page.currency,
          landing_page_id: page.id,
          landing_slug: page.slug,
          offer_id: page.offerId,
          offer_type: page.offerType,
          price_cents: page.priceCents,
        }}
      />
      <LandingHero page={page} />
      <LandingDaypassOfferSection page={page} />

      <LandingMediaGrid />

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <h2 className="landing-section-title">WHY TRY THE DAYPASS?</h2>
            <p className="landing-body mt-4 max-w-2xl">
              A quick way to see whether Monroes has the kind of private deck market you would actually come back to.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {educationCards.map((card) => (
              <article className="rounded-[22px] border border-border bg-whitecard p-6 shadow-soft sm:p-7" key={card.eyebrow}>
                <p className="landing-card-eyebrow">{card.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{card.title}</h3>
                <p className="landing-body mt-4">{card.body}</p>
                <div className="mt-6 grid gap-2">
                  {card.bullets.map((bullet) => (
                    <p
                      className="rounded-[12px] border border-border bg-cream px-3 py-2 text-sm font-bold text-muted"
                      key={bullet}
                    >
                      {bullet}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingFAQ page={page} />
      <LandingFinalCTA />
    </main>
  );
}
