import { site } from "@/lib/site";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingHeroProps = {
  page: LandingPageViewModel;
};

export function LandingHero({ page }: LandingHeroProps) {
  const bonusEntryLabel = page.bonusEntryLabel.replace(/\.$/, "");

  return (
    <section className="relative isolate border-b border-border bg-cream">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,253,247,0.98)_0%,rgba(255,246,236,0.94)_42%,rgba(255,224,196,0.84)_70%,rgba(216,200,255,0.5)_100%)]" />
      <div className="landing-topography absolute inset-y-0 left-0 w-full opacity-75 lg:w-[68%]" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange via-mint to-lilac" />

      <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:min-h-[84svh] lg:grid-cols-[1fr_0.86fr] lg:items-center lg:px-10">
        <div className="relative z-10 max-w-3xl">
          <p className="landing-hero-eyebrow mb-5 max-w-2xl">
            AUSTRALIA-ONLY PRIVATE DECK ACCESS
          </p>
          <h1 className="landing-hero-title max-w-[760px] uppercase text-balance">
            <span className="block">
              GET A <span className="bg-gradient-to-r from-orange to-orange-hover bg-clip-text text-transparent">ONE-DAY</span>
            </span>
            <span className="block">LOOK INSIDE</span>
            <span className="block">
              <span>MONROES</span>
              <span className="block sm:inline"> MARKET.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base font-semibold leading-[1.65] text-muted sm:text-lg">
            A low-friction Daypass for Australian deck hunters who want to see what a private members-only market could
            look like before going monthly.
          </p>
          <div className="mt-8 grid gap-3 sm:max-w-2xl">
            <p className="inline-flex w-fit max-w-full rounded-[10px] bg-ink px-4 py-3 text-[0.6875rem] font-black uppercase leading-5 tracking-[0.18em] text-white shadow-soft">
              First {page.campaignLimit} Daypass members get{" "}
              <span className="text-orange">{bonusEntryLabel}</span>.
            </p>
            <p className="text-sm font-semibold leading-6 text-muted">
              Limited to eligible new Daypass members in this access wave.
            </p>
          </div>
          <div className="mt-7">
            <a
              className="landing-button inline-flex min-h-[3rem] w-full items-center justify-center rounded-[10px] bg-ink px-7 py-3 text-center text-white transition hover:-translate-y-0.5 hover:bg-orange hover:shadow-[0_16px_45px_rgba(255,122,61,0.34)] focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
              href="#daypass-offer"
            >
              GET DAYPASS
            </a>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[440px] justify-center lg:justify-end">
          <div className="absolute inset-x-8 bottom-0 top-10 rounded-[28px] bg-orange/24 blur-2xl" />
          <div
            aria-label="Future campaign graphic placeholder"
            className="relative flex aspect-[0.84] w-full max-w-[440px] overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-whitecard via-peach to-mint p-5 shadow-[0_28px_80px_rgba(23,23,23,0.14)] sm:min-h-[420px] lg:min-h-[500px]"
            role="img"
            style={
              page.heroImageUrl
                ? { backgroundImage: `url(${page.heroImageUrl})`, backgroundPosition: "center", backgroundSize: "cover" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,122,61,0.28),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(216,200,255,0.36),transparent_30%),radial-gradient(circle_at_76%_82%,rgba(191,246,232,0.42),transparent_34%)]" />
            <div className="landing-topography absolute inset-0 opacity-30" />
            <div className="relative flex w-full flex-col justify-between rounded-[18px] border border-white/70 bg-white/22 p-5 backdrop-blur-[1px]">
              <p className="landing-card-eyebrow text-ink/60">{site.name}</p>
              <div>
                <div className="mb-4 h-24 w-16 rotate-3 rounded-xl border border-ink/10 bg-white/70 shadow-soft" />
                <p className="text-[0.625rem] font-black uppercase leading-4 tracking-[0.22em] text-muted">
                  CAMPAIGN GRAPHIC
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
