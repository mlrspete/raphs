import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { FunnelTable } from "@/components/admin/FunnelTable";
import { getAdminFunnels } from "@/lib/db/admin-funnels";

type AdminFunnelsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminFunnelsPage({ searchParams }: AdminFunnelsPageProps) {
  const { range } = await searchParams;
  const data = await getAdminFunnels(range);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Funnels</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Landing-page funnel comparison</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Compare each landing page across view, paid intent, modal open, form start, and waitlist submission steps.
          </p>
        </div>
        <DateRangeFilter currentRange={data.range} />
      </div>

      <FunnelTable range={data.range} rows={data.rows} />
    </section>
  );
}
