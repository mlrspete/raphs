import { site } from "@/lib/site";

const deckNotes = ["OG", "rare", "vintage", "interesting"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-cream text-ink">
      <section className="relative flex min-h-screen items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,138,61,0.35),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(125,222,203,0.32),transparent_28%),linear-gradient(135deg,rgba(255,246,225,1)_0%,rgba(255,252,245,1)_48%,rgba(255,224,196,1)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-mint to-lilac" />

        <div className="container relative z-10 mx-auto grid w-full gap-12 px-6 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-10 lg:px-16">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink/70 shadow-soft backdrop-blur">
              {site.market} only | {site.currency}
            </p>
            <h1 className="text-balance text-5xl font-black leading-[0.95] text-ink md:text-7xl lg:text-8xl">
              {site.name}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-xl font-medium leading-8 text-ink/75 md:text-2xl md:leading-9">
              {site.description}
            </p>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm md:max-w-md">
            <div className="absolute inset-6 rotate-6 rounded-lg bg-orange shadow-deck" />
            <div className="absolute inset-0 -rotate-3 rounded-lg border border-ink/10 bg-white/85 p-7 shadow-soft backdrop-blur">
              <div className="flex h-full flex-col justify-between rounded-lg border border-ink/10 bg-gradient-to-br from-white via-peach to-white p-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/60">V0 shell</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight text-ink">Private deck market in setup.</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {deckNotes.map((note) => (
                    <div
                      className="rounded-md border border-ink/10 bg-white/75 px-2 py-4 text-center text-[0.72rem] font-extrabold uppercase leading-none tracking-normal text-ink/70 sm:px-4 sm:text-sm sm:tracking-[0.12em]"
                      key={note}
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
