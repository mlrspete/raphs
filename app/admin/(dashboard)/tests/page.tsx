import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { TestsTable } from "@/components/admin/TestsTable";
import { getLandingTestMetrics } from "@/lib/db/admin-metrics";

type AdminTestsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTestsPage({ searchParams }: AdminTestsPageProps) {
  const { range } = await searchParams;
  const metrics = await getLandingTestMetrics(range);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Landing Tests</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Compare seeded tests</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Review views, paid intent, sold-out modal opens, and waitlist conversion for each code-seeded landing page.
          </p>
        </div>
        <DateRangeFilter currentRange={metrics.range} />
      </div>

      <TestsTable range={metrics.range} tests={metrics.tests} />
    </section>
  );
}
