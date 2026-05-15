const daypassPriceLine = "$4.99 AUD \u00b7 12-HOUR ACCESS";

export function LandingFinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-dark py-16 text-white sm:py-20">
      <div className="landing-topography absolute inset-0 opacity-20" />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange via-mint to-lilac" />
      <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8 lg:px-12">
        <p className="landing-card-eyebrow">DAYPASS ACCESS</p>
        <p className="mt-3 text-[0.6875rem] font-black uppercase leading-5 tracking-[0.24em] text-white/70">
          {daypassPriceLine}
        </p>
        <h2 className="landing-section-title mt-3 text-balance text-white">
          Want inside Monroes?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-[1.65] text-white/70 sm:text-lg">
          Get a Daypass, browse the private deck market, and see what is available before you join Ultra.
        </p>
        <a
          className="landing-button mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] bg-orange px-6 py-3 text-center text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-orange-hover hover:text-white focus:outline-none focus:ring-4 focus:ring-white/20 sm:w-auto"
          href="#daypass-offer"
        >
          GET DAYPASS
        </a>
      </div>
    </section>
  );
}
