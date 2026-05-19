import type { LandingPageViewModel } from "@/lib/landing-tests/types";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { CampaignDrawProcessCard } from "@/components/landing/CampaignDrawProcessCard";
import { CampaignFactsPanel } from "@/components/landing/CampaignFactsPanel";
import { CampaignRulesSummary } from "@/components/landing/CampaignRulesSummary";
import { LandingDaypassOfferSection } from "@/components/landing/LandingDaypassOfferSection";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFinalCTA } from "@/components/landing/LandingFinalCTA";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMediaGrid } from "@/components/landing/LandingMediaGrid";
import { PrizeProofSection } from "@/components/landing/PrizeProofSection";
import { MembershipPreviewBlock } from "@/components/preview/MembershipPreviewBlock";
import { campaign001Slug } from "@/lib/domain/campaigns/config";

type LandingPageRendererProps = {
  page: LandingPageViewModel;
};

const educationCards = [
  {
    eyebrow: "LOW COMMITMENT",
    title: "Try the private deck market before going monthly.",
    body: "The Daypass gives you a short look inside Monroes so you can browse private listings, check the deck mix, and decide whether Ultra is worth it.",
    bullets: ["12-hour preview access", "One-time purchase", "No hidden fees"],
  },
  {
    eyebrow: "DECK FOCUS",
    title: "Built for boards with better stories.",
    body: "Monroes is for OG graphics, rare shapes, wall-hangers, reissues, oddball cruisers, and decks that feel harder to find twice.",
    bullets: ["OG graphics", "Rare reissues", "Vintage decks", "Odd shapes and wall-hangers"],
  },
];

export function LandingPageRenderer({ page }: LandingPageRendererProps) {
  const isCampaign001 = page.slug === campaign001Slug;

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
      {isCampaign001 ? <PrizeProofSection /> : null}
      {isCampaign001 ? <CampaignFactsPanel /> : null}
      <LandingDaypassOfferSection page={page} />
      <MembershipPreviewBlock ctaHref="#daypass-offer" ctaLabel="Choose Daypass" surface="landing" />
      {isCampaign001 ? <CampaignRulesSummary /> : null}

      <LandingMediaGrid />

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="landing-card-eyebrow">WHY GET A DAYPASS?</p>
            <h2 className="landing-section-title mt-3">
              Try out Monroes before going Ultra.
            </h2>
            <p className="landing-body mt-4 max-w-2xl">
              A simple way to browse the private deck market first, without starting a monthly membership.
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
      {isCampaign001 ? <CampaignDrawProcessCard /> : null}
      <LandingFinalCTA />
    </main>
  );
}
