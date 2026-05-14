import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingFAQProps = {
  page: LandingPageViewModel;
};

export function LandingFAQ({ page }: LandingFAQProps) {
  if (page.faqItems.length === 0) {
    return null;
  }

  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <p className="landing-card-eyebrow">FAQ</p>
        <h2 className="landing-section-title mt-3">Quick answers for this access test.</h2>
        <div className="mt-10 divide-y divide-ink/10 rounded-lg border border-border bg-whitecard shadow-soft">
          {page.faqItems.map((item) => (
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
