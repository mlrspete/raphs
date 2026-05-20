import Link from "next/link";

import { getDrawResultByCampaign } from "@/lib/domain/draws/getDrawResultByCampaign";
import { formatDateTime, formatInteger } from "@/lib/utils/format";

type DrawResultPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DrawResultPage({ params }: DrawResultPageProps) {
  const { slug } = await params;
  const result = await getDrawResultByCampaign(slug);

  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-10">
      <section className="mx-auto grid max-w-5xl gap-6">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Draw results</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            {result?.campaignName ?? "Campaign result pending"}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Public draw information is limited to audit-safe details: snapshot hash, eligible entry count, winning
            entry number, public alias, and draw method.
          </p>
        </div>

        {!result ? (
          <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black leading-tight">No result has been published yet</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">
              The Monroes team will publish the result after the manual draw has been completed and recorded.
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25"
              href={`/promo-rules/${slug}`}
            >
              View promo rules
            </Link>
          </article>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PublicMetric label="Eligible entries" value={formatInteger(result.entryCount)} />
              <PublicMetric label="Entry range" value={formatRange(result.entryRange.first, result.entryRange.last)} />
              <PublicMetric label="Winning entry" value={formatInteger(result.winningEntryNumber)} />
              <PublicMetric label="Winner alias" value={result.winnerAlias} />
            </div>

            <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-black leading-tight">Audit details</h2>
              <dl className="mt-5 grid gap-3">
                <Detail label="Snapshot created" value={formatDateTime(result.snapshotCreatedAt)} />
                <Detail label="Snapshot SHA-256" value={result.snapshotSha256} />
                <Detail label="Draw method" value={result.drawMethod} />
                <Detail label="Public notes" value={result.publicNotes ?? "None"} />
              </dl>
            </article>

            <p className="rounded-lg border border-ink/10 bg-white p-4 text-sm font-semibold leading-6 text-ink/65 shadow-soft">
              Public results do not include entrant emails, full names, Daypass codes, code hashes, encrypted code data,
              Stripe identifiers, or private purchaser information.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function PublicMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">{label}</p>
      <p className="mt-3 break-words text-2xl font-black leading-tight text-ink sm:text-3xl">{value}</p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/8 bg-cream p-4">
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">{label}</dt>
      <dd className="mt-2 break-words text-sm font-black text-ink">{value}</dd>
    </div>
  );
}

function formatRange(first: number | null, last: number | null) {
  if (!first || !last) {
    return "Pending";
  }

  return `${formatInteger(first)}-${formatInteger(last)}`;
}
