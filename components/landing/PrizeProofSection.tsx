import { campaign001PublicContent } from "@/lib/domain/campaigns/publicContent";

export function PrizeProofSection() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-12">
        <div>
          <p className="landing-card-eyebrow">Deck + promo details</p>
          <h2 className="landing-section-title mt-3">Sun God deck promotion details.</h2>
          <p className="landing-body mt-4 max-w-2xl">
            The featured promotion is built around the {campaign001PublicContent.prizeTitle}. Final prize value,
            condition evidence, ownership proof, and launch approval must be confirmed before paid promotion.
          </p>
          <p className="mt-5 rounded-lg border border-orange/25 bg-orange/10 p-4 text-sm font-bold leading-6 text-ink/70">
            {campaign001PublicContent.prizeStatus}. Paid promotion must not launch until final prize proof, value,
            condition, ownership, and campaign rules are approved.
          </p>
        </div>

        <div className="rounded-lg border border-ink/10 bg-cream p-5 shadow-soft">
          <div className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-ink/20 bg-white p-6 text-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange">Prize Proof Pending</p>
              <p className="mt-3 text-3xl font-black leading-tight text-ink">Final deck proof required</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
                Add real, inspectable prize photography before launch. Avoid cropped, atmospheric, or unverifiable prize
                imagery.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {campaign001PublicContent.prizeFacts.map((fact) => (
              <div className="rounded-lg border border-ink/10 bg-white p-4" key={fact.label}>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">{fact.label}</dt>
                <dd className="mt-2 text-sm font-black leading-6 text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
