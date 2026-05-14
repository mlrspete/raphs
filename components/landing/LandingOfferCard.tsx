import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingOfferCardProps = {
  page: LandingPageViewModel;
};

const offerLabels: Record<string, string> = {
  preview_pass: "1-Day Preview Pass",
  monthly_pass: "Monthly Marketplace Pass",
  upgrade_pass: "Preview Upgrade",
};

export function LandingOfferCard({ page }: LandingOfferCardProps) {
  const offerLabel = page.offerType ? (offerLabels[page.offerType] ?? page.offerType) : "Access Pass";

  return (
    <article className="rounded-lg border border-border bg-whitecard p-6 shadow-soft sm:p-8">
      <p className="landing-card-eyebrow">Access offer</p>
      <h2 className="mt-3 text-3xl font-black leading-[1.05] text-ink sm:text-4xl">
        {page.categoryFocus ?? "Private deck access"}
      </h2>
      <p className="landing-body mt-4">
        A focused Monroes access angle for Australian deck hunters who want a tighter, more curated way to discover
        boards worth checking first.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-cream p-4">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.22em] text-muted">Pass style</p>
          <p className="mt-2 text-lg font-black text-ink">{offerLabel}</p>
        </div>
        <div className="rounded-md border border-border bg-cream p-4">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.22em] text-muted">Market</p>
          <p className="mt-2 text-lg font-black text-ink">Australia only</p>
        </div>
      </div>
    </article>
  );
}
