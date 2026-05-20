import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import { getAdminAuthState } from "@/lib/auth/admin";
import {
  getAdminCodesReport,
  normalizeAdminV1Filters,
  type AdminCodeReportRow,
  type AdminV1Filters,
} from "@/lib/db/admin-v1-reports";
import { formatDateTime, formatInteger, shortenId } from "@/lib/utils/format";

type AdminCodesPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    status?: string | string[];
    campaign?: string | string[];
    campaignSlug?: string | string[];
    redeemed?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

const codeStatuses = ["available", "redeemed", "expired", "revoked"];

export default async function AdminCodesPage({ searchParams }: AdminCodesPageProps) {
  const authState = await getAdminAuthState();

  if (authState.status !== "admin") {
    return null;
  }

  const params = await searchParams;
  const filters = normalizeAdminV1Filters(params);
  const codes = await getAdminCodesReport(filters);
  const redeemedCount = codes.filter((code) => code.status === "redeemed").length;
  const availableCount = codes.filter((code) => code.status === "available").length;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Codes</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Friend Daypass codes</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Safe code status reporting with purchaser, redemption, campaign, and last-four support context only.
          </p>
        </div>
        <DateRangeFilter currentRange={filters.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard helper="Rows matching current filters" label="Codes in view" value={formatInteger(codes.length)} />
        <MetricCard helper="Available for friend redemption" label="Available" value={formatInteger(availableCount)} />
        <MetricCard helper="Already redeemed" label="Redeemed" value={formatInteger(redeemedCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminFilterPills
          label="Status"
          options={[
            { active: !filters.status, href: adminHref("/admin/codes", filters, { status: null }), label: "All" },
            ...codeStatuses.map((status) => ({
              active: filters.status === status,
              href: adminHref("/admin/codes", filters, { status }),
              label: status,
            })),
          ]}
        />
        <AdminFilterPills
          label="Redemption"
          options={[
            { active: !filters.redeemed, href: adminHref("/admin/codes", filters, { redeemed: null }), label: "All" },
            {
              active: filters.redeemed === "redeemed",
              href: adminHref("/admin/codes", filters, { redeemed: "redeemed" }),
              label: "Redeemed",
            },
            {
              active: filters.redeemed === "unredeemed",
              href: adminHref("/admin/codes", filters, { redeemed: "unredeemed" }),
              label: "Unredeemed",
            },
          ]}
        />
        <AdminFilterPills
          label="Campaign"
          options={campaignOptions("/admin/codes", filters, codes.map((code) => code.campaignSlug))}
        />
      </div>

      <div className="flex justify-end">
        <CsvExportButton
          label="Export codes"
          params={{
            campaignSlug: filters.campaignSlug,
            range: filters.range,
            redeemed: filters.redeemed,
            status: filters.status,
          }}
          type="codes"
        />
      </div>

      <p className="rounded-lg border border-ink/10 bg-white p-4 text-sm font-semibold leading-6 text-ink/70 shadow-soft">
        Admin reporting shows only code status and the last four characters. Full usable codes are not revealed here and
        are not included in CSV exports.
      </p>

      {codes.length === 0 ? (
        <EmptyState
          description="No friend Daypass codes match this filter yet. Codes are created only for Daypass quantities above one."
          title="No codes found"
        />
      ) : (
        <CodesTable codes={codes} />
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
  overrides: { status?: string | null; campaignSlug?: string | null; redeemed?: string | null },
) {
  const searchParams = new URLSearchParams({ range: filters.range });
  const status = overrides.status !== undefined ? overrides.status : filters.status;
  const campaignSlug =
    overrides.campaignSlug !== undefined ? overrides.campaignSlug : filters.campaignSlug;
  const redeemed = overrides.redeemed !== undefined ? overrides.redeemed : filters.redeemed;

  if (status) {
    searchParams.set("status", status);
  }

  if (campaignSlug) {
    searchParams.set("campaignSlug", campaignSlug);
  }

  if (redeemed) {
    searchParams.set("redeemed", redeemed);
  }

  return `${pathname}?${searchParams.toString()}`;
}

function CodesTable({ codes }: { codes: AdminCodeReportRow[] }) {
  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/48">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Purchaser</th>
              <th className="px-4 py-3">Last 4</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Redeemed by</th>
              <th className="px-4 py-3">Redeemed</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {codes.map((code) => (
              <tr key={code.id}>
                <td className="px-4 py-3 font-bold text-ink">{code.campaignSlug ?? "Unknown"}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/62">{shortenId(code.orderId) || "None"}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">
                  {code.purchaserEmail ?? code.purchaserEmailNormalized}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-black text-ink">{code.codeLast4}</td>
                <td className="px-4 py-3 font-black text-ink">{code.status}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{code.redeemedByEmail ?? "Not redeemed"}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(code.redeemedAt)}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(code.createdAt)}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(code.expiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
