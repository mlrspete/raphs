import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingFAQProps = {
  page: LandingPageViewModel;
};

const promoFaqItems = [
  {
    question: "What happens when I press Get Daypass?",
    answer:
      "Because this V0 does not process payments, the current access window is shown as sold out. Join the list and we will email you when the next Daypass wave opens.",
  },
  {
    question: "Does the Daypass include promo entry?",
    answer:
      "This campaign simulates a Daypass wave where eligible new Daypass members receive 1 free entry into the featured promo item. Final campaign terms will be shown before any real paid launch.",
  },
];

export function LandingFAQ({ page }: LandingFAQProps) {
  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <p className="landing-card-eyebrow">FAQ</p>
        <h2 className="landing-section-title mt-3">Quick answers before the next wave.</h2>
        <div className="mt-10 divide-y divide-ink/10 rounded-lg border border-border bg-whitecard shadow-soft">
          {promoFaqItems.map((item) => (
            <TrackedFAQItem
              answer={item.answer}
              key={item.question}
              location="landing_faq"
              properties={{
                currency: page.currency,
                landing_page_id: page.id,
                landing_slug: page.slug,
                offer_id: page.offerId,
                offer_type: page.offerType,
                price_cents: page.priceCents,
              }}
              question={item.question}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
