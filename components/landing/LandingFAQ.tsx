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
        <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">FAQ</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Quick answers for this access test.</h2>
        <div className="mt-10 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white shadow-soft">
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
