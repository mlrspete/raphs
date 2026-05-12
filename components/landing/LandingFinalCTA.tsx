import { AccessCTA } from "@/components/marketing/AccessCTA";
import { site } from "@/lib/site";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingFinalCTAProps = {
  page: LandingPageViewModel;
};

export function LandingFinalCTA({ page }: LandingFinalCTAProps) {
  return (
    <section className="bg-ink py-16 text-white sm:py-20">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8 lg:px-12">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">{page.priceDisplay}</p>
        <h2 className="mt-3 text-balance text-4xl font-black leading-tight sm:text-6xl">
          Want first access to {site.name}?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-white/70">
          Join the access list signal for this offer and stay close to the next private access window.
        </p>
        <AccessCTA
          body={page.modalBody ?? site.soldOutModal.body}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-white/20"
          ctaLabel={page.waitlistCta ?? site.soldOutModal.ctaLabel}
          currency={page.currency}
          eventContext="landing_final_primary"
          headline={page.modalHeadline ?? site.soldOutModal.headline}
          landingPageId={page.id}
          landingSlug={page.slug}
          offerId={page.offerId}
          offerType={page.offerType}
          priceCents={page.priceCents}
        >
          {page.ctaSecondary}
        </AccessCTA>
      </div>
    </section>
  );
}
