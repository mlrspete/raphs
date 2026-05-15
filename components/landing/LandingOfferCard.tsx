type LandingOfferCardProps = {
  quantity: number;
};

const benefits = [
  {
    label: "12-hour access to members-only marketplace listings",
  },
  {
    label: "Browse private deck listings",
  },
  {
    label: "No buyer commitment beyond the Daypass window",
  },
  {
    label: "Free entry into the 1988 Tony Hawk Powell Peralta Deck promo giveaway",
    isPromo: true,
  },
];

export function LandingOfferCard({ quantity }: LandingOfferCardProps) {
  const multiplier = `x${quantity}`;

  return (
    <article className="rounded-[22px] border border-border bg-whitecard p-6 shadow-soft sm:p-8">
      <p className="landing-card-eyebrow">DAYPASS PREVIEW</p>
      <h2 className="mt-3 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-ink sm:text-4xl lg:text-[2.625rem]">
        1-day access to Monroes member-only marketplace.
      </h2>
      <p className="landing-body mt-5">
        OG, vintage and rare skate decks behind one private door. A Daypass gives you a short look inside Monroes before
        joining Ultra — one-time purchase, no hidden fees, no subscription.
      </p>

      <div className="mt-7 grid gap-3">
        {benefits.map((benefit) => (
          <div
            className={`flex gap-3 rounded-[14px] border px-4 py-3 ${
              benefit.isPromo
                ? "border-orange/35 bg-orange/10 shadow-[0_0_36px_rgba(255,122,61,0.18)]"
                : "border-border bg-cream"
            }`}
            key={benefit.label}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 inline-flex h-7 min-w-9 shrink-0 items-center justify-center rounded-full border border-orange/25 bg-orange/10 px-2 text-sm font-black uppercase leading-none text-orange ${
                benefit.isPromo ? "shadow-[0_0_24px_rgba(255,122,61,0.34)]" : ""
              }`}
            >
              {multiplier}
            </span>
            <p className="text-sm font-bold leading-6 text-muted">{benefit.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.22em] text-muted">PASS TYPE</p>
          <p className="mt-2 text-base font-black text-ink">Daypass</p>
        </div>
        <div>
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.22em] text-muted">MARKET</p>
          <p className="mt-2 text-base font-black text-ink">Australia only</p>
        </div>
      </div>
    </article>
  );
}
