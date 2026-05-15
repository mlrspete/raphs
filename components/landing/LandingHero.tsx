import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingHeroProps = {
  page: LandingPageViewModel;
};

export function LandingHero({ page }: LandingHeroProps) {
  return (
    <section className="relative isolate border-b border-border bg-cream">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,253,247,0.98)_0%,rgba(255,246,236,0.94)_42%,rgba(255,224,196,0.84)_70%,rgba(216,200,255,0.5)_100%)]" />
      <div className="landing-topography absolute inset-y-0 left-0 w-full opacity-75 lg:w-[68%]" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange via-mint to-lilac" />

      <div className="relative mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:min-h-[84svh] lg:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.72fr)] lg:items-center lg:px-10">
        <div className="landing-hero-column relative z-10 min-w-0">
          <p className="landing-hero-eyebrow mb-5 max-w-2xl">FIRST 100 ELIGIBLE DAYPASSES</p>
          <h1 className="landing-hero-title max-w-[780px] overflow-hidden uppercase">
            <span className="mb-2 block text-[0.48em] leading-[1.02] sm:mb-3">GAIN ENTRY INTO THE</span>
            <span className="block max-w-full bg-gradient-to-r from-orange to-orange-hover bg-clip-text text-[0.64em] leading-[0.95] text-transparent min-[380px]:text-[0.7em] sm:text-[0.82em] lg:text-[0.86em]">
              1988 TONY HAWK
            </span>
            <span className="mt-2 block text-[0.46em] leading-[0.98] min-[380px]:text-[0.52em] sm:text-[0.6em]">
              OG POWELL PERALTA DECK
            </span>
            <span className="mt-2 block text-[0.62em] leading-[0.95] min-[380px]:text-[0.68em] sm:text-[0.78em] lg:text-[0.82em]">
              PROMO GIVEAWAY.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base font-semibold leading-[1.65] text-muted sm:text-lg">
            Get a Monroes Daypass, browse the member-only deck market, and receive 1 free entry with your eligible
            Daypass purchase.
          </p>
          <div className="mt-7">
            <a
              className="landing-button inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] bg-ink px-7 py-3 text-center text-white transition hover:-translate-y-0.5 hover:bg-orange hover:shadow-[0_16px_45px_rgba(255,122,61,0.34)] focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
              href="#daypass-offer"
            >
              GET DAYPASS
            </a>
          </div>
        </div>

        <div className="landing-hero-art relative mx-auto flex min-w-0 justify-center lg:justify-end">
          <div className="absolute inset-x-8 bottom-0 top-10 rounded-[28px] bg-orange/24 blur-2xl" />
          <div
            aria-label="Promo deck placeholder"
            className="relative flex aspect-[0.84] w-full max-w-full overflow-hidden rounded-[24px] border border-[rgba(23,23,23,0.08)] bg-gradient-to-br from-whitecard via-peach to-mint p-5 shadow-[0_28px_80px_rgba(23,23,23,0.14)] sm:min-h-[420px] lg:min-h-[500px]"
            role="img"
            style={
              page.heroImageUrl
                ? { backgroundImage: `url(${page.heroImageUrl})`, backgroundPosition: "center", backgroundSize: "cover" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,122,61,0.28),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(216,200,255,0.36),transparent_30%),radial-gradient(circle_at_76%_82%,rgba(191,246,232,0.42),transparent_34%)]" />
            <div className="landing-topography absolute inset-0 opacity-30" />
            <div className="relative flex w-full flex-col justify-between rounded-[20px] border border-white/70 bg-white/30 p-5 backdrop-blur-[1px]">
              <div className="flex items-start justify-between gap-4">
                <p className="landing-card-eyebrow text-ink/60">PROMO GIVEAWAY</p>
                <p className="rounded-full border border-orange/25 bg-orange/10 px-3 py-1.5 text-[0.625rem] font-black uppercase leading-4 tracking-[0.18em] text-ink">
                  FIRST 100
                </p>
              </div>

              <div className="relative mx-auto my-7 flex min-h-[260px] w-full max-w-[300px] items-center justify-center sm:my-9">
                <div className="absolute h-[74%] w-[56%] -rotate-12 rounded-[22px] border border-ink/10 bg-lilac/55 shadow-soft" />
                <div className="absolute h-[82%] w-[60%] rotate-6 rounded-[24px] border border-ink/10 bg-mint/60 shadow-soft" />
                <div className="relative flex h-[88%] min-h-[250px] w-[66%] rotate-[-4deg] flex-col justify-between overflow-hidden rounded-[24px] border border-[rgba(23,23,23,0.08)] bg-gradient-to-br from-whitecard via-[#fff0e5] to-peach p-5 shadow-[0_22px_55px_rgba(23,23,23,0.16)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_20%,rgba(255,122,61,0.26),transparent_28%),radial-gradient(circle_at_78%_78%,rgba(191,246,232,0.52),transparent_34%)]" />
                  <div className="relative h-20 rounded-[18px] border border-ink/10 bg-white/58" />
                  <div className="relative">
                    <p className="text-[0.625rem] font-black uppercase leading-4 tracking-[0.2em] text-muted">1988</p>
                    <p className="mt-1 text-2xl font-black uppercase leading-none text-ink">Tony Hawk</p>
                    <p className="mt-2 text-[0.625rem] font-black uppercase leading-4 tracking-[0.18em] text-orange">
                      Powell Peralta
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[0.625rem] font-black uppercase leading-4 tracking-[0.22em] text-muted">
                  PROMO DECK PLACEHOLDER
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-gradient-to-r from-orange via-mint to-lilac" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
