import type { LandingPageViewModel } from "@/lib/landing-tests/types";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFinalCTA } from "@/components/landing/LandingFinalCTA";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMediaGrid } from "@/components/landing/LandingMediaGrid";
import { LandingOfferCard } from "@/components/landing/LandingOfferCard";
import { LandingPricingBlock } from "@/components/landing/LandingPricingBlock";

type LandingPageRendererProps = {
  page: LandingPageViewModel;
};

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

      <section className="bg-whitecard py-14 sm:py-20" id="daypass-offer">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <LandingOfferCard page={page} />
          <LandingPricingBlock page={page} />
        </div>
      </section>

      <LandingMediaGrid page={page} />

      {page.sections.length > 0 ? (
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="grid gap-4 md:grid-cols-2">
              {page.sections.map((section) => (
                <article className="rounded-lg border border-border bg-whitecard p-6 shadow-soft sm:p-7" key={section.id}>
                  {section.eyebrow ? (
                    <p className="landing-card-eyebrow">{section.eyebrow}</p>
                  ) : null}
                  <h2 className="mt-3 text-2xl font-black leading-tight text-ink sm:text-3xl">
                    {section.title}
                  </h2>
                  <p className="landing-body mt-4">{section.body}</p>
                  {section.bullets?.length ? (
                    <div className="mt-5 grid gap-2">
                      {section.bullets.map((bullet) => (
                        <p
                          className="rounded-md border border-border bg-cream px-3 py-2 text-sm font-bold text-muted"
                          key={bullet}
                        >
                          {bullet}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <LandingFAQ page={page} />
      <LandingFinalCTA page={page} />
    </main>
  );
}
