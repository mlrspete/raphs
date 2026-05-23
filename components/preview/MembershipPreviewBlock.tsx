/* eslint-disable @next/next/no-img-element -- Preview images are static placeholders shared across public and member surfaces. */

import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { listingSeeds } from "@/data/listings";
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
  const liveListingCount = listingSeeds.filter((listing) => listing.status === "live").length;
  const moreDecksListedCount = Math.max(0, liveListingCount - membershipPreviewConfig.tiles.length);
  const copyContent = (
    <>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">
        {membershipPreviewConfig.eyebrow}
      </p>
      <h2 className="mt-3 max-w-2xl text-balance text-3xl font-black leading-tight text-ink sm:text-5xl">
        {membershipPreviewConfig.title}
      </h2>
      <p className="mt-4 text-base font-semibold leading-7 text-ink/70 sm:text-lg">{membershipPreviewConfig.body}</p>
      {ctaHref && ctaLabel ? (
        <Link
          className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
          href={ctaHref}
        >
          {ctaLabel}
        </Link>
      ) : null}
    </>
  );
  const previewTiles = (
    <>
      <div className="grid gap-3 sm:col-span-2">
        {membershipPreviewConfig.tiles.map((tile) => (
          <article
            className="grid aspect-square grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft"
            data-scroll-reveal-item
            key={`${tile.brand}-${tile.tone}`}
          >
            <div className={`relative grid min-h-0 place-items-center ${toneClasses[tile.tone]} p-5`}>
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-ink/64 shadow-soft backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available
              </span>
              <img alt={tile.alt} className="h-full max-h-44 w-auto object-contain" src={tile.imageUrl} />
            </div>
            <div className="self-end p-4">
              <h3 className="text-pretty text-base leading-snug sm:text-lg">
                <span className="font-black text-ink/52">{tile.brand}</span>{" "}
                <span className="font-semibold text-ink">{tile.title}</span>
              </h3>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <article
          className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft"
          data-scroll-reveal-item
          key="more-decks-listed"
        >
          <p className="text-5xl font-black leading-none text-ink">+{moreDecksListedCount}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-ink/52">More decks listed</p>
        </article>

        {membershipPreviewConfig.stats.map((stat) => (
          <article
            className={`rounded-lg border border-ink/10 bg-white p-4 shadow-soft ${
              stat.label === "Region" ? "text-center" : ""
            }`}
            data-scroll-reveal-item
            key={stat.label}
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">{stat.label}</p>
            <p
              className={
                stat.label === "Region"
                  ? "mx-auto mt-3 max-w-24 text-balance text-lg font-black uppercase leading-tight text-ink sm:text-xl"
                  : "mt-3 text-3xl font-black leading-none text-ink"
              }
            >
              {stat.value}
            </p>
          </article>
        ))}
      </div>
    </>
  );

  return (
    <section className={isMemberSurface ? "bg-cream py-6" : "bg-cream py-14 sm:py-20"}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          {isMemberSurface ? (
            <div className="max-w-2xl">{copyContent}</div>
          ) : (
            <ScrollReveal className="max-w-2xl">{copyContent}</ScrollReveal>
          )}

          {isMemberSurface ? (
            <div className="grid gap-3 sm:grid-cols-4">{previewTiles}</div>
          ) : (
            <ScrollReveal className="grid gap-3 sm:grid-cols-4" stagger={0.07}>
              {previewTiles}
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
