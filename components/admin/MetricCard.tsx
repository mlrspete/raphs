type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">{label}</p>
      <p className="mt-3 text-3xl font-black leading-none text-ink sm:text-4xl">{value}</p>
      {helper ? <p className="mt-3 text-sm font-semibold leading-6 text-ink/58">{helper}</p> : null}
    </article>
  );
}
