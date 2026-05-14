export function LandingMediaGrid() {
  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <div className="relative mx-auto flex min-h-[220px] max-w-[900px] items-center justify-center overflow-hidden rounded-[28px] border border-ink/10 bg-gradient-to-br from-peach via-mint to-lilac p-6 text-center shadow-soft sm:min-h-[320px]">
          <div className="landing-topography absolute inset-0 opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,122,61,0.22),transparent_32%),radial-gradient(circle_at_86%_26%,rgba(255,253,247,0.45),transparent_28%)]" />
          <div className="relative">
            <p className="text-[2.75rem] font-black uppercase leading-none text-ink sm:text-6xl lg:text-7xl">
              COMING SOON
            </p>
            <p className="mt-4 text-[0.6875rem] font-black uppercase leading-5 tracking-[0.24em] text-muted sm:text-xs">
              Private listing preview
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
