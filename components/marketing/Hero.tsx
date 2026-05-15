import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative min-h-[88svh] overflow-hidden border-b border-ink/10 bg-cream">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,252,245,0.98)_0%,rgba(255,240,225,0.94)_48%,rgba(255,138,61,0.52)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgba(255,138,61,0.34),transparent_30%),radial-gradient(circle_at_18%_72%,rgba(125,222,203,0.22),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-peach to-mint" />

      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 top-20 h-[34rem] w-[42rem] opacity-60"
          style={{
            backgroundImage:
              "repeating-radial-gradient(ellipse at 28% 42%, rgba(34,34,34,0.14) 0 1px, transparent 1px 24px), repeating-radial-gradient(ellipse at 62% 46%, rgba(255,138,61,0.18) 0 1px, transparent 1px 34px)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[88svh] max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <p className="text-sm font-black uppercase text-ink">{site.name}</p>
        </header>

        <div className="grid flex-1 gap-10 py-16 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:py-10">
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-balance text-6xl font-black uppercase leading-[0.86] text-ink sm:text-7xl lg:text-8xl xl:text-9xl">
              <span className="block">
                Rare <span className="text-orange">Decks.</span>
              </span>
              <span className="mt-3 block text-4xl leading-[0.9] sm:text-5xl lg:text-6xl">Private listings.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg font-semibold leading-8 text-ink/72 sm:text-xl">
              Monroes is a private members-only marketplace for OG, rare, and interesting skateboard decks in Australia.
            </p>
            <a
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-7 py-3 text-center text-sm font-black uppercase text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
              href="#access"
            >
              Preview
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-xl">
            <div className="absolute -inset-5 rounded-lg bg-orange/25 blur-3xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-ink/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.92)_0%,rgba(255,224,196,0.84)_48%,rgba(255,138,61,0.72)_100%)] p-5 shadow-deck">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-55"
                style={{
                  backgroundImage:
                    "repeating-radial-gradient(ellipse at 68% 34%, rgba(34,34,34,0.16) 0 1px, transparent 1px 24px)",
                }}
              />
              <div className="relative flex h-full flex-col justify-between rounded-md border border-white/70 bg-white/28 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-black uppercase text-ink/60">
                  <span>Monroes</span>
                  <span>Private listings preview</span>
                </div>
                <div className="grid gap-3">
                  <div className="h-36 rounded-md border border-ink/10 bg-cream/72 shadow-soft" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 rounded-md border border-ink/10 bg-white/64" />
                    <div className="h-20 rounded-md border border-ink/10 bg-white/64" />
                    <div className="h-20 rounded-md border border-ink/10 bg-white/64" />
                  </div>
                </div>
                <p className="max-w-xs text-2xl font-black uppercase leading-none text-ink">
                  Private listings preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
