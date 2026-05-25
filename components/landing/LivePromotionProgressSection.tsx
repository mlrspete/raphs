import Link from "next/link";

import { campaign001PublicContent } from "@/lib/domain/campaigns/publicContent";
import type { PublicCampaignProgress } from "@/lib/domain/campaigns/publicProgress";

const timelineSteps = [
  {
    body: "Eligible Daypasses create free promotional entries.",
    title: "Entries open",
  },
  {
    body: "Monroes freezes the eligible entry list and records a draw snapshot hash.",
    title: "Snapshot locked",
  },
  {
    body: "A transparent random draw selects one winning entry from the locked entry range.",
    title: "Live draw",
  },
  {
    body: "After claim confirmation, the deck is express shipped to the winner at no extra cost.",
    title: "Winner shipped",
  },
];

function nonNegativeInteger(value: number | null) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function positiveInteger(value: number | null) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function LivePromotionProgressSection({ progress }: { progress: PublicCampaignProgress }) {
  const entryLimit = positiveInteger(progress.entryLimit);
  const entryCount = nonNegativeInteger(progress.entryCount);
  const liveProgress =
    entryLimit !== null && entryCount !== null
      ? {
          entriesRemaining: Math.max(entryLimit - entryCount, 0),
          entryCount,
          entryLimit,
          progressPercent: Math.min((entryCount / entryLimit) * 100, 100),
        }
      : null;

  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="landing-card-eyebrow">Live promotion progress</p>
          <h2 className="landing-section-title mt-3">When the entries fill, the draw goes live.</h2>
          <p className="landing-body mt-4">
            {entryLimit
              ? `This promotion is capped at ${entryLimit} eligible entries. Once entries close, Monroes locks the eligible entry snapshot, runs a transparent live draw, and ships the deck free to the winner after claim confirmation.`
              : "This promotion has a limited number of eligible entries. Once entries close, Monroes locks the eligible entry snapshot, runs a transparent live draw, and ships the deck free to the winner after claim confirmation."}
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
          {liveProgress ? (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-xl font-black leading-tight text-ink">
                  {liveProgress.entryCount} / {liveProgress.entryLimit} entries allocated
                </p>
                <p className="text-sm font-black leading-6 text-orange">
                  {liveProgress.entriesRemaining} entries remaining
                </p>
              </div>
              <div
                aria-label={`${liveProgress.entryCount} of ${liveProgress.entryLimit} entries allocated`}
                aria-valuemax={liveProgress.entryLimit}
                aria-valuemin={0}
                aria-valuenow={liveProgress.entryCount}
                className="mt-5 h-3 overflow-hidden rounded-full bg-cream"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-orange" style={{ width: `${liveProgress.progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold leading-6 text-ink/68">
              Entry count will appear here once the campaign is live.
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {timelineSteps.map((step, index) => (
            <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft" key={step.title}>
              <p className="text-xs font-black uppercase leading-5 tracking-[0.14em] text-orange">
                Step {index + 1}
              </p>
              <h3 className="mt-3 text-xl font-black leading-tight text-ink">{step.title}</h3>
              <p className="mt-3 text-sm font-bold leading-6 text-ink/68">{step.body}</p>
            </article>
          ))}
        </div>

        <Link
          className="landing-button mt-8 inline-flex rounded-[10px] bg-ink px-5 py-3 text-white hover:bg-orange"
          href={`${campaign001PublicContent.rulesUrl}#provably-fair`}
        >
          How the draw is kept fair
        </Link>
      </div>
    </section>
  );
}
