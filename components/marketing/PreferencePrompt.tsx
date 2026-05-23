"use client";

import { useEffect, useState } from "react";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const voteStorageKey = "monroes-your-say-vote";
const preferences = [
  "More OG graphics",
  "More Aussie sellers",
  "More rare reissues",
  "More vintage decks",
  "More wall-hangers",
  "More odd shapes",
];

function tileClassName(isSelected: boolean) {
  return [
    "relative flex aspect-square min-h-28 flex-col justify-between overflow-hidden rounded-lg border p-4 text-left transition",
    "focus:outline-none focus:ring-4 focus:ring-orange/35",
    isSelected
      ? "border-orange bg-orange text-ink shadow-deck"
      : "border-white/10 bg-white/10 text-white hover:-translate-y-1 hover:border-orange/70 hover:bg-white/20",
  ].join(" ");
}

export function PreferencePrompt() {
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedVote = window.localStorage.getItem(voteStorageKey);

      if (savedVote && preferences.includes(savedVote)) {
        setSelectedVote(savedVote);
      }
    } catch {
      setSelectedVote(null);
    }
  }, []);

  function submitVote(preference: string) {
    setSelectedVote(preference);

    try {
      window.localStorage.setItem(voteStorageKey, preference);
    } catch {
      // localStorage can be unavailable in private or locked-down browsers.
    }
  }

  return (
    <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20" id="preferences">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange/70 to-transparent" />
      <div className="absolute -right-16 top-12 h-52 w-80 rotate-6 rounded-lg bg-orange/30 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-32 w-72 -rotate-6 rounded-lg bg-peach/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-12">
        <ScrollReveal>
          <p className="text-sm font-black uppercase text-orange">Your say</p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
            <span className="lg:block">MEMBERS</span> <span className="lg:block">SHAPE WHAT</span>{" "}
            <span className="lg:block">MONROES BECOMES NEXT.</span>
          </h2>
          <a
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-orange px-7 py-3 text-center text-sm font-black uppercase text-ink shadow-deck transition hover:-translate-y-0.5 hover:bg-peach focus:outline-none focus:ring-4 focus:ring-white/20 sm:w-auto"
            href="#access"
          >
            See packages
          </a>
          {selectedVote ? (
            <p aria-live="polite" className="mt-4 text-sm font-bold text-white/64">
              Your vote: {selectedVote}
            </p>
          ) : null}
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-2 gap-3 sm:grid-cols-3" stagger={0.07}>
          {preferences.map((preference) => {
            const isSelected = selectedVote === preference;

            return (
              <button
                aria-pressed={isSelected}
                className={tileClassName(isSelected)}
                data-scroll-reveal-item
                key={preference}
                onClick={() => submitVote(preference)}
                type="button"
              >
                <span className="text-xs font-black uppercase opacity-60">{isSelected ? "+1" : "Vote"}</span>
                <span className="text-pretty text-base font-black uppercase leading-tight sm:text-lg">{preference}</span>
                <span className="text-xs font-black uppercase opacity-70">
                  {isSelected ? "Selected" : "Tap to choose"}
                </span>
              </button>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
