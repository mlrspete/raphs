const decks = [
  {
    title: "Sun-faded pool shape",
    meta: "Vintage feel | clean rails",
    tone: "from-orange via-peach to-white",
  },
  {
    title: "Rare shop wall find",
    meta: "Small batch | Australia",
    tone: "from-mint via-white to-lilac",
  },
  {
    title: "Graphic-era reissue",
    meta: "OG energy | display ready",
    tone: "from-lilac via-peach to-orange",
  },
  {
    title: "Oddball cruiser deck",
    meta: "Interesting shape | tidy finish",
    tone: "from-white via-mint to-peach",
  },
];

export function MarketplacePreview() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">Marketplace energy</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
              Built for decks with a story, not endless product grids.
            </h2>
            <p className="mt-4 text-lg font-medium leading-8 text-ink/70">
              The early experience should feel curated, colourful, and quick to browse: a tighter members market for
              people who notice old graphics, rare shapes, clean wall-hangers, and decks that are simply interesting.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {decks.map((deck) => (
              <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft" key={deck.title}>
                <div className={`aspect-[5/3] rounded-md bg-gradient-to-br ${deck.tone} p-4`}>
                  <div className="flex h-full items-center justify-center rounded-md border border-white/65 bg-white/25">
                    <div className="h-24 w-14 rotate-6 rounded-md border border-ink/10 bg-white/70 shadow-soft" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-black leading-tight text-ink">{deck.title}</h3>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-ink/60">{deck.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
