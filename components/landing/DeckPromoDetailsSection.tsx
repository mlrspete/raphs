import { PrizeSpotlightCarousel } from "@/components/landing/PrizeSpotlightCarousel";

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
    <article className="rounded-lg border border-white/30 bg-white p-5 shadow-[0_20px_55px_rgba(23,23,23,0.18)] sm:p-6">
      <h3 className="text-xl font-black uppercase leading-tight text-ink">{title}</h3>
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
    <section className="bg-orange py-14 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-white/78">Prize spotlight</p>
          <h2 className="mt-3 text-5xl font-black uppercase leading-[0.88] text-white sm:text-7xl lg:text-8xl">
            1st prize
          </h2>
          <div className="mx-auto mt-3 w-fit rounded-md bg-ink px-4 py-2 text-2xl font-black uppercase leading-none text-white shadow-soft sm:text-4xl">
            Sun God Reissue
          </div>
          <p className="mt-4 text-xl font-black uppercase leading-tight text-white sm:text-3xl">
            2016 Santa Cruz Jason Jessee
          </p>
        </div>

        <div className="mt-8">
          <PrizeSpotlightCarousel />
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-lg border-2 border-white bg-white/10 p-5 text-center shadow-[0_22px_65px_rgba(23,23,23,0.22)] sm:p-6">
          <p className="text-lg font-black uppercase leading-tight text-white sm:text-2xl">
            Purple pearlescent collector deck. New condition. Old-school shape.
          </p>
          <p className="mt-4 text-base font-bold leading-7 text-white/86">
            A reissue of Jim Phillips&apos; legendary Jason Jessee Sun God pro model from the 80s. This release was the first
            time the deck was reissued in this colourway. Reissue concave, not too steep - a classic 80s-style pool board
            with serious collector appeal.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <FactCard rows={deckDetailRows} title="Deck details" />
          <FactCard rows={dimensionRows} title="Dimensions" />
        </div>
      </div>
    </section>
  );
}
