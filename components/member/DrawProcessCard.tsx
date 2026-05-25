import Link from "next/link";

type DrawProcessCardProps = {
  campaignName: string;
  drawAt: string | null;
  drawLockAt: string | null;
  entriesCloseAt: string | null;
  rulesHref: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function DrawProcessCard({ campaignName, drawAt, drawLockAt, entriesCloseAt, rulesHref }: DrawProcessCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">Draw</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-ink">{campaignName}</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/46">Entries close</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-ink/68">{formatDateTime(entriesCloseAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/46">Attribution lock</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-ink/68">{formatDateTime(drawLockAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/46">Planned draw</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-ink/68">{formatDateTime(drawAt)}</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm font-semibold leading-6 text-ink/68">
        What happens next: Monroes confirms eligible entries, locks friend Daypass code attribution, creates a draw
        snapshot, then publishes the result after the draw.
      </p>
      {rulesHref ? (
        <Link className="mt-4 inline-flex text-sm font-black text-orange hover:text-orange-hover" href={rulesHref}>
          View promo rules
        </Link>
      ) : null}
    </article>
  );
}
