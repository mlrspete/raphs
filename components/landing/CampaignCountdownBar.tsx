"use client";

import { useEffect, useState } from "react";

import { getCampaignCountdownState } from "@/lib/domain/campaigns/countdown";

type CampaignCountdownBarProps = {
  baseCloseAt: string;
  entryCount: number | null;
  entryLimit: number | null;
  renderedAt: string;
};

const countdownUnits = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
] as const;

function parseTime(value: string) {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

function formatCountdownValue(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

export function CampaignCountdownBar({ baseCloseAt, entryCount, entryLimit, renderedAt }: CampaignCountdownBarProps) {
  const [nowMs, setNowMs] = useState(() => parseTime(renderedAt));
  const countdown = getCampaignCountdownState({
    baseCloseAt,
    entryCount,
    entryLimit,
    now: new Date(nowMs),
  });

  useEffect(() => {
    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!countdown) {
    return null;
  }

  return (
    <section className="bg-orange px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-[0.9fr_1.4fr] md:items-center">
        <h2 className="mx-auto max-w-[18rem] text-center text-4xl font-black uppercase leading-[0.95] text-white sm:text-5xl md:mx-0 md:justify-self-end md:text-right lg:text-6xl">
          HURRY! DRAW CLOSES IN...
        </h2>

        <div aria-live="polite" className="grid grid-cols-4 gap-2 text-center sm:gap-3 lg:gap-5">
          {countdownUnits.map((unit) => (
            <div className="grid min-w-0 justify-items-center gap-2" key={unit.key}>
              <div className="grid h-16 w-full min-w-0 max-w-20 place-items-center rounded-lg bg-white px-2 text-3xl font-black leading-none text-ink shadow-soft sm:h-20 sm:max-w-24 sm:text-5xl lg:h-24 lg:max-w-28 lg:text-6xl">
                <span className="tabular-nums">{formatCountdownValue(countdown[unit.key])}</span>
              </div>
              <p className="text-[0.68rem] font-black leading-none text-white sm:text-sm">{unit.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
