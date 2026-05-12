import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { FilterBar } from "@/components/admin/FilterBar";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { getAdminLeads } from "@/lib/db/admin-leads";

type AdminLeadsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    landingPageId?: string | string[];
    utmSource?: string | string[];
    utmCampaign?: string | string[];
    budget?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const filters = await searchParams;
  const data = await getAdminLeads(filters);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Leads</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Waitlist leads</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Inspect captured emails, source context, campaign attribution, and buying preference signals.
          </p>
        </div>
        <CsvExportButton
          label="Export leads CSV"
          params={{
            budget: data.filters.budget,
            landingPageId: data.filters.landingPageId,
            range: data.filters.range,
            utmCampaign: data.filters.utmCampaign,
            utmSource: data.filters.utmSource,
          }}
          type="leads"
        />
      </div>

      <FilterBar
        action="/admin/leads"
        clearHref="/admin/leads"
        fields={[
          { label: "Date range", name: "range", value: data.filters.range },
          {
            label: "Landing page",
            name: "landingPageId",
            options: data.landingTests.map((test) => ({ label: `${test.internal_name} /${test.slug}`, value: test.id })),
            value: data.filters.landingPageId,
          },
          {
            label: "UTM source",
            name: "utmSource",
            options: data.utmSources.map((source) => ({ label: source, value: source })),
            value: data.filters.utmSource,
          },
          {
            label: "UTM campaign",
            name: "utmCampaign",
            options: data.utmCampaigns.map((campaign) => ({ label: campaign, value: campaign })),
            value: data.filters.utmCampaign,
          },
          {
            label: "Budget",
            name: "budget",
            options: data.budgets.map((budget) => ({ label: budget, value: budget })),
            value: data.filters.budget,
          },
        ]}
      />

      <LeadsTable leads={data.leads} />
    </section>
  );
}
