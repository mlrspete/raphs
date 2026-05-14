import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingOfferCardProps = {
  page: LandingPageViewModel;
};

export function LandingOfferCard({ page }: LandingOfferCardProps) {
  const checklist = [
    "24-hour access to members-only marketplace listings",
    "Browse private deck listings before public release",
    "No buyer account commitment beyond the Daypass window",
    `${page.bonusEntryLabel} for eligible Daypass members`,
  ];

  return (
    <article className="rounded-[22px] border border-border bg-whitecard p-6 shadow-soft sm:p-8">
      <p className="landing-card-eyebrow">MEMBER PREVIEW</p>
      <h2 className="mt-3 text-3xl font-black leading-[1.05] text-ink sm:text-4xl lg:text-[2.625rem]">
        OG, rare, vintage and interesting skate decks --- behind one private door.
      </h2>
      <p className="landing-body mt-5">
        A one-day look inside Monroes Market for buyers who want to browse the private deck market before committing to
        full membership.
      </p>

      <div className="mt-7 grid gap-3">
        {checklist.map((item) => (
          <div className="flex gap-3 rounded-[14px] border border-border bg-cream px-4 py-3" key={item}>
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-black text-ink"
            >
              &#10003;
            </span>
            <p className="text-sm font-bold leading-6 text-muted">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.22em] text-muted">Pass type</p>
          <p className="mt-2 text-base font-black text-ink">1-Day Daypass</p>
        </div>
        <div>
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.22em] text-muted">Market</p>
          <p className="mt-2 text-base font-black text-ink">Australia only</p>
        </div>
      </div>
    </article>
  );
}
