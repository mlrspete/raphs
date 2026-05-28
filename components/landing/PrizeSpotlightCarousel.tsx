/* eslint-disable @next/next/no-img-element -- Placeholder prize images are static SVGs until final prize photography exists. */

"use client";

import { useState } from "react";

const slides = [
  {
    imageUrl: "/images/listings/placeholder-deck.svg",
    label: "Full deck",
    title: "Purple pearlescent finish",
    tone: "bg-mint",
  },
  {
    imageUrl: "/images/listings/placeholder-deck-side.svg",
    label: "Side profile",
    title: "Old-school pool shape",
    tone: "bg-lilac",
  },
  {
    imageUrl: "/images/listings/placeholder-deck-detail.svg",
    label: "Detail view",
    title: "Collector condition",
    tone: "bg-peach",
  },
];

export function PrizeSpotlightCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] ?? slides[0];

  function showPrevious() {
    setActiveIndex((currentIndex) => (currentIndex === 0 ? slides.length - 1 : currentIndex - 1));
  }

  function showNext() {
    setActiveIndex((currentIndex) => (currentIndex === slides.length - 1 ? 0 : currentIndex + 1));
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="relative overflow-hidden rounded-lg border-[6px] border-white bg-ink shadow-[0_28px_80px_rgba(23,23,23,0.28)]">
        <div className={`grid aspect-[4/3] place-items-center ${activeSlide.tone} p-8 sm:aspect-[16/10] sm:p-12`}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_36%),repeating-linear-gradient(90deg,rgba(23,23,23,0.08)_0_1px,transparent_1px_22px)]" />
          <img
            alt={`${activeSlide.title} placeholder`}
            className="relative h-full max-h-[34rem] w-auto max-w-full object-contain drop-shadow-[0_28px_42px_rgba(23,23,23,0.32)]"
            src={activeSlide.imageUrl}
          />
          <div className="absolute left-4 top-4 rounded-md bg-ink px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-soft">
            {activeSlide.label}
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 flex items-center px-3">
          <button
            aria-label="Show previous prize image"
            className="rounded-md border border-white/25 bg-ink/80 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-white hover:text-ink focus:outline-none focus:ring-4 focus:ring-white/35"
            onClick={showPrevious}
            type="button"
          >
            Prev
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center px-3">
          <button
            aria-label="Show next prize image"
            className="rounded-md border border-white/25 bg-ink/80 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-white hover:text-ink focus:outline-none focus:ring-4 focus:ring-white/35"
            onClick={showNext}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              aria-label={`Show ${slide.label.toLowerCase()} prize image`}
              className={`grid aspect-[5/2] place-items-center overflow-hidden rounded-md border-2 p-2 transition ${
                isActive ? "border-white bg-white shadow-soft" : "border-white/45 bg-white/15 hover:bg-white/25"
              }`}
              key={slide.label}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img alt="" className="h-full w-full object-contain" src={slide.imageUrl} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
