/* eslint-disable @next/next/no-img-element -- Preview images are static placeholders shared across public and member surfaces. */

import Link from "next/link";

import { membershipPreviewConfig } from "@/lib/domain/listings/marketplacePreviewConfig";

type MembershipPreviewBlockProps = {
  ctaHref?: string;
  ctaLabel?: string;
  surface?: "homepage" | "landing" | "member";
};

const toneClasses = {
  lilac: "bg-lilac/45",
  mint: "bg-mint/55",
  orange: "bg-peach/80",
} as const;

export function MembershipPreviewBlock({ ctaHref, ctaLabel, surface = "homepage" }: MembershipPreviewBlockProps) {
  const isMemberSurface = surface === "member";

  return (
    <section className={isMemberSurface ? "bg-cream py-6" : "bg-cream py-14 sm:py-20"}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">
              {membershipPreviewConfig.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
              {membershipPreviewConfig.title}
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-ink/70 sm:text-lg">
              {membershipPreviewConfig.body}
            </p>
            {ctaHref && ctaLabel ? (
              <Link
                className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
                href={ctaHref}
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="grid gap-3 sm:col-span-2">
              {membershipPreviewConfig.tiles.map((tile) => (
                <article
                  className="grid aspect-square overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft"
                  key={tile.title}
                >
                  <div className={`grid place-items-center ${toneClasses[tile.tone]} p-5`}>
                    <img alt={tile.alt} className="h-full max-h-44 w-auto object-contain" src={tile.imageUrl} />
                  </div>
                  <div className="self-end p-4">
                    <h3 className="text-lg font-black leading-tight text-ink">{tile.title}</h3>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-ink/55">{tile.meta}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              {membershipPreviewConfig.stats.map((stat) => (
                <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft" key={stat.label}>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black leading-none text-ink">{stat.value}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
