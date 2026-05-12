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
    <article className="rounded-lg border border-ink/10 bg-cream p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Access offer</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-ink">{page.categoryFocus ?? "Private deck access"}</h2>
      <p className="mt-4 text-base font-medium leading-7 text-ink/70">
        A focused access angle for Australian deck hunters who want a tighter, more curated way to discover boards worth
        checking first.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">Pass style</p>
          <p className="mt-2 text-lg font-black text-ink">{offerLabel}</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">Market</p>
          <p className="mt-2 text-lg font-black text-ink">Australia only</p>
        </div>
      </div>
    </article>
  );
}
