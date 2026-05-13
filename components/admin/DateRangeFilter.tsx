import Link from "next/link";

import type { AdminDateRangeKey } from "@/lib/db/admin-metrics";

const rangeOptions: { href: string; label: string; value: AdminDateRangeKey }[] = [
  { href: "?range=7d", label: "Last 7 days", value: "7d" },
  { href: "?range=30d", label: "Last 30 days", value: "30d" },
  { href: "?range=all", label: "All time", value: "all" },
];

type DateRangeFilterProps = {
  currentRange: AdminDateRangeKey;
};

export function DateRangeFilter({ currentRange }: DateRangeFilterProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3" aria-label="Date range">
      {rangeOptions.map((option) => {
        const active = option.value === currentRange;

        return (
          <Link
            aria-current={active ? "true" : undefined}
            className={`rounded-md border px-3 py-2 text-center text-xs font-black uppercase tracking-[0.12em] transition focus:outline-none focus:ring-4 focus:ring-orange/25 ${
              active ? "border-orange bg-orange text-ink" : "border-ink/10 bg-white text-ink/62 hover:text-ink"
            }`}
            href={option.href}
            key={option.value}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
