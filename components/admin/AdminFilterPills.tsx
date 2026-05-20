import Link from "next/link";

type AdminFilterOption = {
  href: string;
  label: string;
  active: boolean;
};

type AdminFilterPillsProps = {
  label: string;
  options: AdminFilterOption[];
};

export function AdminFilterPills({ label, options }: AdminFilterPillsProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Link
            aria-current={option.active ? "true" : undefined}
            className={`rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition focus:outline-none focus:ring-4 focus:ring-orange/25 ${
              option.active
                ? "border-orange bg-orange text-ink"
                : "border-ink/10 bg-cream text-ink/62 hover:text-ink"
            }`}
            href={option.href}
            key={`${option.label}-${option.href}`}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
