import { notFound } from "next/navigation";

import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { getLandingTestResults } from "@/lib/db/admin-metrics";
import { formatCurrencyFromCents, formatInteger } from "@/lib/utils/format";
import { formatPercent } from "@/lib/utils/rates";

type TestResultsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function TestResultsPage({ params, searchParams }: TestResultsPageProps) {
  const [{ id }, { range }] = await Promise.all([params, searchParams]);
  const results = await getLandingTestResults(id, range);

  if (!results.test) {
    notFound();
  }

  const test = results.test;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Test results</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">{test.internal_name}</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            /{test.slug} - {test.status} - {test.offer_type ?? "No offer"} -{" "}
            {test.price_display ?? formatCurrencyFromCents(test.price_cents, test.currency)}
          </p>
        </div>
        <DateRangeFilter currentRange={results.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          helper={results.rangeLabel}
          label="Landing views"
          value={formatInteger(results.metrics.landingViews)}
        />
        <MetricCard
          helper="Unique anonymous IDs seen on test events"
          label="Visitors"
          value={formatInteger(results.metrics.uniqueVisitors)}
        />
        <MetricCard
          helper="Paid-access CTA clicks"
          label="Paid intent"
          value={formatInteger(results.metrics.paidIntentClicks)}
        />
        <MetricCard
          helper="Sold-out modal opens"
          label="Modal opens"
          value={formatInteger(results.metrics.modalOpens)}
        />
        <MetricCard
          helper="Saved waitlist leads"
          label="Waitlist leads"
          value={formatInteger(results.metrics.waitlistSubmissions)}
        />
        <MetricCard
          helper="Waitlist leads / landing views"
          label="Overall conversion"
          value={formatPercent(results.metrics.overallWaitlistConversion)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h3 className="text-lg font-black leading-tight text-ink">Funnel breakdown</h3>
          <div className="mt-5 grid gap-3">
            {results.funnel.map((step, index) => (
              <div className="rounded-lg border border-ink/10 bg-cream p-4" key={step.label}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">Step {index + 1}</p>
                    <p className="mt-1 text-base font-black text-ink">{step.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-ink">{formatInteger(step.value)}</p>
                    <p className="mt-1 text-xs font-bold text-ink/52">{formatPercent(step.rateFromPrevious)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <BreakdownTable rows={results.topSources} title="Top UTM sources" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownTable rows={results.topCampaigns} title="Top UTM campaigns" />
        <PreferenceSummary rows={results.preferenceSummary} />
      </div>
    </section>
  );
}

function BreakdownTable({
  rows,
  title,
}: {
  rows: { label: string; landingViews: number; paidIntentClicks: number; waitlistSubmissions: number; conversionRate: number }[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h3 className="text-lg font-black leading-tight text-ink">{title}</h3>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState description="No attribution data exists for this test and date range yet." title="No data yet" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">
              <tr>
                <th className="py-2 pr-3">Segment</th>
                <th className="px-3 py-2 text-right">Views</th>
                <th className="px-3 py-2 text-right">Intent</th>
                <th className="px-3 py-2 text-right">Leads</th>
                <th className="py-2 pl-3 text-right">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="py-3 pr-3 font-bold text-ink">{row.label}</td>
                  <td className="px-3 py-3 text-right font-black">{formatInteger(row.landingViews)}</td>
                  <td className="px-3 py-3 text-right font-black">{formatInteger(row.paidIntentClicks)}</td>
                  <td className="px-3 py-3 text-right font-black">{formatInteger(row.waitlistSubmissions)}</td>
                  <td className="py-3 pl-3 text-right font-black">{formatPercent(row.conversionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function PreferenceSummary({ rows }: { rows: { label: string; value: string; count: number }[] }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h3 className="text-lg font-black leading-tight text-ink">Preference summary</h3>
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState description="Preference data will appear after waitlist leads include optional answers." title="No preferences yet" />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-cream p-4" key={`${row.label}:${row.value}`}>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">{row.label}</p>
                <p className="mt-1 text-sm font-black text-ink">{row.value}</p>
              </div>
              <p className="text-2xl font-black text-ink">{formatInteger(row.count)}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
