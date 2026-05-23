import { ScrollReveal } from "@/components/marketing/ScrollReveal";

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
        <div className="grid flex-1 gap-10 py-16 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:py-10">
          <ScrollReveal className="relative z-10 max-w-3xl" y={18}>
            <h1 className="sr-only">Monroes members-only skateboard marketplace</h1>
            <div
              aria-hidden="true"
              className="h-32 w-full max-w-[45rem] rounded-md bg-ink shadow-deck sm:h-40 lg:h-52 xl:h-56"
            />
            <p className="mt-6 max-w-xl text-pretty text-lg font-semibold leading-8 text-ink/72 sm:text-xl">
              Monroes is a private members-only marketplace for OG, rare and interesting skateboard decks in Australia.
            </p>
            <a
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-7 py-3 text-center text-sm font-black uppercase text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
              href="#access"
            >
              SIGN UP
            </a>
          </ScrollReveal>

          <ScrollReveal className="relative mx-auto w-full max-w-md lg:max-w-xl" delay={0.08} y={20}>
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
              <div className="relative h-full rounded-md border border-white/70 bg-white/28 p-5 backdrop-blur-sm">
                <div className="h-full rounded-md bg-orange shadow-soft" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
