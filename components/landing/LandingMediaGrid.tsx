import type { LandingPageViewModel, LandingTestMediaItem } from "@/lib/landing-tests/types";

type LandingMediaGridProps = {
  page: LandingPageViewModel;
};

const fallbackMedia: LandingTestMediaItem[] = [
  {
    title: "OG graphics",
    label: "Decks with era and story",
    tone: "orange",
  },
  {
    title: "Rare shapes",
    label: "Interesting boards worth a closer look",
    tone: "mint",
  },
  {
    title: "Vintage energy",
    label: "Private-market browse feel",
    tone: "lilac",
  },
];

const toneClassName: Record<NonNullable<LandingTestMediaItem["tone"]>, string> = {
  orange: "from-orange via-peach to-white",
  mint: "from-mint via-white to-lilac",
  lilac: "from-lilac via-peach to-orange",
  peach: "from-white via-peach to-mint",
};

export function LandingMediaGrid({ page }: LandingMediaGridProps) {
  const mediaItems = page.mediaItems.length > 0 ? page.mediaItems : fallbackMedia;

  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">Market preview</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            A bright, curated browse for decks with more character.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {mediaItems.map((item) => (
            <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft" key={`${item.title}-${item.label}`}>
              <div
                className={`aspect-[5/3] rounded-md bg-gradient-to-br ${
                  toneClassName[item.tone && item.tone in toneClassName ? item.tone : "orange"]
                } p-4`}
                style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover" } : undefined}
              >
                <div className="flex h-full items-center justify-center rounded-md border border-white/65 bg-white/25">
                  <div className="h-24 w-14 rotate-6 rounded-md border border-ink/10 bg-white/70 shadow-soft" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-black leading-tight text-ink">{item.title}</h3>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-ink/60">{item.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
