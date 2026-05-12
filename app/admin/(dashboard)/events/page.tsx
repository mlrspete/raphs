import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { EventsTable } from "@/components/admin/EventsTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { getAdminEvents } from "@/lib/db/admin-events";

type AdminEventsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    eventName?: string | string[];
    landingPageId?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const filters = await searchParams;
  const data = await getAdminEvents(filters);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Events</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Raw event stream</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Browse selected Supabase event logs with landing, offer, campaign, session, and properties context.
          </p>
        </div>
        <CsvExportButton
          label="Export events CSV"
          params={{
            eventName: data.filters.eventName,
            landingPageId: data.filters.landingPageId,
            range: data.filters.range,
          }}
          type="events"
        />
      </div>

      <FilterBar
        action="/admin/events"
        clearHref="/admin/events"
        fields={[
          { label: "Date range", name: "range", value: data.filters.range },
          {
            label: "Event name",
            name: "eventName",
            options: data.eventNames.map((name) => ({ label: name, value: name })),
            value: data.filters.eventName,
          },
          {
            label: "Landing page",
            name: "landingPageId",
            options: data.landingTests.map((test) => ({ label: `${test.internal_name} /${test.slug}`, value: test.id })),
            value: data.filters.landingPageId,
          },
        ]}
      />

      <EventsTable events={data.events} />
    </section>
  );
}
