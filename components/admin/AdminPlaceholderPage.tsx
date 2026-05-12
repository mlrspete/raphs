type AdminPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items?: string[];
};

export function AdminPlaceholderPage({ eyebrow, title, description, items = [] }: AdminPlaceholderPageProps) {
  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div className="rounded-lg border border-ink/10 bg-cream p-4" key={item}>
              <p className="text-sm font-black leading-6 text-ink">{item}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">Coming in a later milestone.</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
