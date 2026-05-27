"use client";

/* eslint-disable @next/next/no-img-element -- Listing image URLs may come from manual inventory data outside Next image config. */

import { useState } from "react";

import { trackEvent } from "@/lib/analytics/trackEvent";
import type { Json } from "@/lib/types/database";

export type ListingCardViewModel = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  deckYear: number | null;
  era: string | null;
  conditionLabel: string | null;
  priceCents: number | null;
  currency: string;
  locationRegion: string | null;
  primaryImageUrl: string | null;
  factsJson: Json;
};

type ListingCardProps = {
  listing: ListingCardViewModel;
};

function formatMoney(cents: number | null, currency: string) {
  if (cents === null) {
    return "POA";
  }

  return new Intl.NumberFormat("en-AU", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function getFactsRecord(factsJson: Json) {
  if (!factsJson || typeof factsJson !== "object" || Array.isArray(factsJson)) {
    return null;
  }

  return factsJson;
}

function getStringArrayProperty(factsJson: Record<string, Json | undefined>, key: string) {
  const value = factsJson[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function uniqueImageUrls(urls: string[]) {
  return Array.from(new Set(urls.filter((url) => url.trim().length > 0)));
}

function getListingImageUrls(listing: ListingCardViewModel) {
  const factsJson = getFactsRecord(listing.factsJson);
  const configuredImageUrls = factsJson
    ? [
        ...getStringArrayProperty(factsJson, "displayImageUrls"),
        ...getStringArrayProperty(factsJson, "localImageUrls"),
        ...getStringArrayProperty(factsJson, "placeholderImageUrls"),
      ]
    : [];

  return uniqueImageUrls([...configuredImageUrls, listing.primaryImageUrl ?? ""]);
}

function getFactsHighlights(factsJson: Json) {
  const factsRecord = getFactsRecord(factsJson);

  if (!factsRecord) {
    return [];
  }

  const notes = factsRecord.notes;

  if (!Array.isArray(notes)) {
    return [];
  }

  return notes.filter((note): note is string => typeof note === "string").slice(0, 2);
}

function getSupplyTypeLabel(factsJson: Json) {
  const factsRecord = getFactsRecord(factsJson);
  const supplyTypeLabel = factsRecord?.supplyTypeLabel;

  if (typeof supplyTypeLabel === "string" && supplyTypeLabel.trim().length > 0) {
    return supplyTypeLabel.trim();
  }

  return "Monroes-owned";
}

export function ListingCard({ listing }: ListingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const highlights = getFactsHighlights(listing.factsJson);
  const imageUrls = getListingImageUrls(listing);
  const activeImageUrl = imageUrls[imageIndex] ?? imageUrls[0] ?? null;
  const supplyTypeLabel = getSupplyTypeLabel(listing.factsJson);
  const yearOrEra = listing.deckYear ? String(listing.deckYear) : listing.era;

  function showPreviousImage() {
    setImageIndex((currentIndex) => (currentIndex - 1 + imageUrls.length) % imageUrls.length);
  }

  function showNextImage() {
    setImageIndex((currentIndex) => (currentIndex + 1) % imageUrls.length);
  }

  function toggleExpanded() {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded) {
      trackEvent("listing_viewed", {
        listing_id: listing.id,
        listing_slug: listing.slug,
        surface: "member_listings",
      });
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="bg-cream p-5">
        <div className="grid aspect-square place-items-center">
          {activeImageUrl ? (
            <img alt="" className="h-full max-h-56 w-auto object-contain" src={activeImageUrl} />
          ) : (
            <div className="h-36 w-24 rounded-md border border-ink/10 bg-white shadow-soft" />
          )}
        </div>

        {imageUrls.length > 1 ? (
          <div className="mt-3 grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
            <button
              aria-label="Previous listing image"
              className="grid aspect-square place-items-center rounded-md border border-ink/10 bg-white text-lg font-black text-ink transition hover:border-orange hover:text-orange"
              onClick={showPreviousImage}
              title="Previous image"
              type="button"
            >
              {"<"}
            </button>
            <div className="flex min-w-0 justify-center gap-2 overflow-x-auto">
              {imageUrls.map((imageUrl, index) => (
                <button
                  aria-current={index === imageIndex ? "true" : undefined}
                  aria-label={`Show listing image ${index + 1}`}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-md border bg-white p-1 transition ${
                    index === imageIndex ? "border-orange" : "border-ink/10 hover:border-orange"
                  }`}
                  key={imageUrl}
                  onClick={() => setImageIndex(index)}
                  type="button"
                >
                  <img alt="" className="h-full w-full object-contain" src={imageUrl} />
                </button>
              ))}
            </div>
            <button
              aria-label="Next listing image"
              className="grid aspect-square place-items-center rounded-md border border-ink/10 bg-white text-lg font-black text-ink transition hover:border-orange hover:text-orange"
              onClick={showNextImage}
              title="Next image"
              type="button"
            >
              {">"}
            </button>
          </div>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-orange">
              {listing.brand ?? "Monroes"}
            </p>
            <h2 className="mt-2 text-xl font-black leading-tight text-ink">{listing.title}</h2>
          </div>
          <p className="shrink-0 text-base font-black leading-tight text-ink">
            {formatMoney(listing.priceCents, listing.currency)}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="font-black uppercase tracking-[0.1em] text-ink/42">Year/era</dt>
            <dd className="mt-1 font-semibold text-ink/70">{yearOrEra ?? "TBC"}</dd>
          </div>
          <div>
            <dt className="font-black uppercase tracking-[0.1em] text-ink/42">Condition</dt>
            <dd className="mt-1 font-semibold text-ink/70">{listing.conditionLabel ?? "TBC"}</dd>
          </div>
          <div>
            <dt className="font-black uppercase tracking-[0.1em] text-ink/42">Region</dt>
            <dd className="mt-1 font-semibold text-ink/70">{listing.locationRegion ?? "Australia"}</dd>
          </div>
          <div>
            <dt className="font-black uppercase tracking-[0.1em] text-ink/42">Type</dt>
            <dd className="mt-1 font-semibold text-ink/70">{supplyTypeLabel}</dd>
          </div>
        </dl>

        {highlights.length > 0 ? (
          <div className="mt-4">
            <button
              aria-expanded={isExpanded}
              className="rounded-md border border-ink/10 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-ink transition hover:border-orange hover:text-orange"
              onClick={toggleExpanded}
              type="button"
            >
              {isExpanded ? "Hide notes" : "View notes"}
            </button>
            {isExpanded ? (
              <ul className="mt-3 grid gap-2">
                {highlights.map((highlight) => (
                  <li className="rounded-md bg-cream px-3 py-2 text-sm font-semibold leading-6 text-ink/68" key={highlight}>
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
