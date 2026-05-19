"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { trackEvent } from "@/lib/analytics/trackEvent";

export type ListingFilterState = {
  brand: string;
  era: string;
  condition: string;
  priceRange: string;
};

type ListingsFilterBarProps = {
  filters: ListingFilterState;
};

const brandOptions = [
  "Powell Peralta",
  "Santa Cruz",
  "Blind",
  "World Industries",
  "Alien Workshop",
  "Girl",
  "Chocolate",
  "Zero",
  "Element",
  "Enjoi",
];
const eraOptions = ["80s", "90s", "2000s", "2010s", "2020s"];
const conditionOptions = [
  "Display grade",
  "Light storage marks",
  "Collector grade",
  "Good wall-hanger",
  "Clean top sheet",
  "Light shelf wear",
  "Near new",
  "Clean storage condition",
  "Odd shape / display ready",
];
const priceOptions = [
  { label: "Under $250", value: "under-250" },
  { label: "$250-$350", value: "250-350" },
  { label: "$350+", value: "350-plus" },
  { label: "POA", value: "poa" },
];

export function ListingsFilterBar({ filters }: ListingsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilter(name: keyof ListingFilterState, value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value) {
      nextParams.set(name, value);
    } else {
      nextParams.delete(name);
    }

    trackEvent("listing_filter_changed", {
      filter_name: name,
      filter_value: value || null,
      surface: "member_listings",
    });

    startTransition(() => {
      const nextQuery = nextParams.toString();
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    });
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-black uppercase tracking-[0.1em] text-ink/58">
          Brand
          <select
            className="rounded-md border border-ink/10 bg-cream px-3 py-3 text-sm font-bold normal-case tracking-normal text-ink"
            onChange={(event) => updateFilter("brand", event.target.value)}
            value={filters.brand}
          >
            <option value="">All brands</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black uppercase tracking-[0.1em] text-ink/58">
          Era
          <select
            className="rounded-md border border-ink/10 bg-cream px-3 py-3 text-sm font-bold normal-case tracking-normal text-ink"
            onChange={(event) => updateFilter("era", event.target.value)}
            value={filters.era}
          >
            <option value="">All eras</option>
            {eraOptions.map((era) => (
              <option key={era} value={era}>
                {era}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black uppercase tracking-[0.1em] text-ink/58">
          Condition
          <select
            className="rounded-md border border-ink/10 bg-cream px-3 py-3 text-sm font-bold normal-case tracking-normal text-ink"
            onChange={(event) => updateFilter("condition", event.target.value)}
            value={filters.condition}
          >
            <option value="">All conditions</option>
            {conditionOptions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-black uppercase tracking-[0.1em] text-ink/58">
          Price
          <select
            className="rounded-md border border-ink/10 bg-cream px-3 py-3 text-sm font-bold normal-case tracking-normal text-ink"
            onChange={(event) => updateFilter("priceRange", event.target.value)}
            value={filters.priceRange}
          >
            <option value="">All prices</option>
            {priceOptions.map((price) => (
              <option key={price.value} value={price.value}>
                {price.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold leading-6 text-ink/58">
          {isPending ? "Updating filters..." : "Filters update the server-rendered listing set."}
        </p>
        <Link className="text-sm font-black uppercase tracking-[0.1em] text-orange hover:text-orange-hover" href="/member/listings">
          Clear filters
        </Link>
      </div>
    </div>
  );
}
