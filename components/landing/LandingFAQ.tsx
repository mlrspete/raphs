import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingFAQProps = {
  page: LandingPageViewModel;
};

const promoFaqItems = [
  {
    question: "What do I get with a Daypass?",
    answer:
      "A Daypass gives you 12-hour access to the Monroes members market, so you can browse members-only Monroes listings before deciding whether to join Monroes Ultra. It is a one-time purchase, not a subscription.",
  },
  {
    question: "Does the Daypass include promo entry?",
    answer:
      "Yes. Eligible Daypass purchases receive free entry into the promotion, limited to the first 100 eligible Daypass purchases unless final rules say otherwise.",
  },
];

export function LandingFAQ({ page }: LandingFAQProps) {
  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <p className="landing-card-eyebrow">FAQ</p>
        <h2 className="landing-section-title mt-3">Quick answers before you get a Daypass.</h2>
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
