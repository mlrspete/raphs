const deckDetailRows = [
  { label: "Model", value: "Jason Jessee Sun God" },
  { label: "Colour", value: "Purple Pearlescent" },
  { label: "Year of release", value: "2016" },
  { label: "Shape", value: "Old School" },
  { label: "Condition", value: "New" },
];

const dimensionRows = [
  { label: "Width", value: "9.9 in" },
  { label: "Length", value: "29.7 in" },
  { label: "Wheelbase", value: "14.75 in" },
  { label: "Tail", value: "6.9 in" },
  { label: "Nose", value: "3.85 in" },
];

function FactCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <h3 className="text-xl font-black leading-tight text-ink">{title}</h3>
      <dl className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div
            aria-label={`${row.label}: ${row.value}`}
            className="grid grid-cols-[minmax(7rem,0.55fr)_minmax(0,1fr)] gap-4"
            key={row.label}
          >
            <dt className="text-sm font-black leading-6 text-orange">{row.label}: </dt>
            <dd className="text-sm font-bold leading-6 text-ink/72">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function DeckPromoDetailsSection() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="landing-card-eyebrow">Deck + promo details</p>
          <h2 className="landing-section-title mt-3">2016 Santa Cruz Jason Jessee Sun God Reissue.</h2>
          <p className="landing-body mt-4">
            A reissue of Jim Phillips’ legendary Jason Jessee Sun God pro model from the ’80s. This release was the
            first time the deck was reissued in this colourway. Reissue concave, not too steep — a classic ’80s-style
            pool board with serious collector appeal.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <FactCard rows={deckDetailRows} title="Deck details" />
          <FactCard rows={dimensionRows} title="Dimensions" />
        </div>
      </div>
    </section>
  );
}
