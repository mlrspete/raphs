import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { TestsTable } from "@/components/admin/TestsTable";
import { getAdminOverviewMetrics } from "@/lib/db/admin-metrics";
import { formatInteger } from "@/lib/utils/format";
import { formatPercent } from "@/lib/utils/rates";

type AdminOverviewPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({ searchParams }: AdminOverviewPageProps) {
  const { range } = await searchParams;
  const metrics = await getAdminOverviewMetrics(range);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Overview</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Demand signals</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Admin analytics for landing views, paid intent, sold-out modal opens, and waitlist conversion.
          </p>
        </div>
        <DateRangeFilter currentRange={metrics.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          helper={metrics.rangeLabel}
          label="Landing views"
          value={formatInteger(metrics.totals.landingViews)}
        />
        <MetricCard
          helper="Paid-access CTA clicks"
          label="Paid-intent clicks"
          value={formatInteger(metrics.totals.paidIntentClicks)}
        />
        <MetricCard
          helper="Sold-out modal opens"
          label="Modal opens"
          value={formatInteger(metrics.totals.modalOpens)}
        />
        <MetricCard
          helper="Saved waitlist leads"
          label="Waitlist leads"
          value={formatInteger(metrics.totals.waitlistSubmissions)}
        />
        <MetricCard
          helper="Paid intent clicks / landing views"
          label="CTA click rate"
          value={formatPercent(metrics.totals.ctaClickRate)}
        />
        <MetricCard
          helper="Waitlist leads / landing views"
          label="Waitlist conversion"
          value={formatPercent(metrics.totals.overallWaitlistConversion)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard rows={metrics.topSources} title="Top UTM sources / campaigns" />
        <BreakdownCard rows={metrics.topOffers} title="Offer / price point conversion" />
      </div>

      <div className="grid gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Landing tests</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-ink">Test comparison</h3>
        </div>
        <TestsTable range={metrics.range} tests={metrics.tests} />
      </div>
    </section>
  );
}

function BreakdownCard({
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
          <EmptyState description="No matching events or leads exist for this date range yet." title="No data yet" />
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
