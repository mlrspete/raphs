import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import { getAdminAuthState } from "@/lib/auth/admin";
import {
  getAdminEntriesReport,
  normalizeAdminV1Filters,
  type AdminEntryReportRow,
  type AdminV1Filters,
} from "@/lib/db/admin-v1-reports";
import { formatDateTime, formatInteger, shortenId } from "@/lib/utils/format";

type AdminEntriesPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    status?: string | string[];
    campaign?: string | string[];
    campaignSlug?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

const entryStatuses = ["active", "winner", "refunded", "cancelled", "void", "disqualified"];

export default async function AdminEntriesPage({ searchParams }: AdminEntriesPageProps) {
  const authState = await getAdminAuthState();

  if (authState.status !== "admin") {
    return null;
  }

  const params = await searchParams;
  const filters = normalizeAdminV1Filters(params);
  const entries = await getAdminEntriesReport(filters);
  const activeEntries = entries.filter((entry) => entry.status === "active" || entry.status === "winner").length;
  const excludedEntries = entries.filter((entry) =>
    ["refunded", "cancelled", "void", "disqualified"].includes(entry.status),
  ).length;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Entries</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Promo entry ledger</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Internal entry numbers, public aliases, current holders, friend-code attribution, and draw-workflow status.
          </p>
        </div>
        <DateRangeFilter currentRange={filters.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard helper="Rows matching current filters" label="Entries in view" value={formatInteger(entries.length)} />
        <MetricCard helper="Active or winner status" label="Potential draw pool" value={formatInteger(activeEntries)} />
        <MetricCard
          helper="Refunded, cancelled, void, or disqualified"
          label="Flagged entries"
          value={formatInteger(excludedEntries)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminFilterPills
          label="Status"
          options={[
            { active: !filters.status, href: adminHref("/admin/entries", filters, { status: null }), label: "All" },
            ...entryStatuses.map((status) => ({
              active: filters.status === status,
              href: adminHref("/admin/entries", filters, { status }),
              label: status.replaceAll("_", " "),
            })),
          ]}
        />
        <AdminFilterPills
          label="Campaign"
          options={campaignOptions("/admin/entries", filters, entries.map((entry) => entry.campaignSlug))}
        />
      </div>

      <div className="flex justify-end">
        <CsvExportButton
          label="Export entries"
          params={{ campaignSlug: filters.campaignSlug, range: filters.range, status: filters.status }}
          type="entries"
        />
      </div>

      <p className="rounded-lg border border-orange/25 bg-orange/10 p-4 text-sm font-semibold leading-6 text-ink/70">
        Draw exports include cancelled/refunded/void statuses for review. The operator must apply the final legal rule
        before excluding entries from a public draw snapshot.
      </p>

      {entries.length === 0 ? (
        <EmptyState
          description="No promo entries match this filter yet. Fulfilled Daypass orders issue entries through the webhook flow."
          title="No entries found"
        />
      ) : (
        <EntriesTable entries={entries} />
      )}
    </section>
  );
}

function campaignOptions(pathname: string, filters: AdminV1Filters, slugs: (string | null)[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean) as string[])];

  return [
    { active: !filters.campaignSlug, href: adminHref(pathname, filters, { campaignSlug: null }), label: "All" },
    ...uniqueSlugs.map((slug) => ({
      active: filters.campaignSlug === slug,
      href: adminHref(pathname, filters, { campaignSlug: slug }),
      label: slug,
    })),
  ];
}

function adminHref(
  pathname: string,
  filters: AdminV1Filters,
  overrides: { status?: string | null; campaignSlug?: string | null },
) {
  const searchParams = new URLSearchParams({ range: filters.range });
  const status = overrides.status !== undefined ? overrides.status : filters.status;
  const campaignSlug =
    overrides.campaignSlug !== undefined ? overrides.campaignSlug : filters.campaignSlug;

  if (status) {
    searchParams.set("status", status);
  }

  if (campaignSlug) {
    searchParams.set("campaignSlug", campaignSlug);
  }

  return `${pathname}?${searchParams.toString()}`;
}

function EntriesTable({ entries }: { entries: AdminEntryReportRow[] }) {
  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/48">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3 text-right">Entry</th>
              <th className="px-4 py-3">Alias</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Current holder</th>
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Locked</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 font-bold text-ink">{entry.campaignSlug ?? "Unknown"}</td>
                <td className="px-4 py-3 text-right font-black text-ink">{formatInteger(entry.entryNumber)}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{entry.displayAlias}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{entry.ownerEmail ?? "Unknown"}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{entry.currentHolderEmail ?? "Original owner"}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{entry.referrerEmail ?? "None"}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/62">
                  {entry.daypassCodeLast4 ? `last4 ${entry.daypassCodeLast4}` : "Purchaser"}
                </td>
                <td className="px-4 py-3 font-black text-ink">{entry.status.replaceAll("_", " ")}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(entry.lockedAt)}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(entry.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/62">{shortenId(entry.orderId) || "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
