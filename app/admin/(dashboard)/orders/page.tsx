import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import { getAdminAuthState } from "@/lib/auth/admin";
import {
  getAdminOrdersReport,
  normalizeAdminV1Filters,
  type AdminOrderReportRow,
  type AdminV1Filters,
} from "@/lib/db/admin-v1-reports";
import { formatCurrencyFromCents, formatDateTime, formatInteger, shortenId } from "@/lib/utils/format";

type AdminOrdersPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    status?: string | string[];
    campaign?: string | string[];
    campaignSlug?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

const orderStatuses = ["pending", "paid", "fulfilled", "payment_failed", "cancelled", "refunded"];

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const authState = await getAdminAuthState();

  if (authState.status !== "admin") {
    return null;
  }

  const params = await searchParams;
  const filters = normalizeAdminV1Filters(params);
  const orders = await getAdminOrdersReport(filters);
  const totalRevenue = orders
    .filter((order) => order.status === "paid" || order.status === "fulfilled")
    .reduce((total, order) => total + order.totalCents, 0);
  const daypasses = orders.reduce((total, order) => total + order.quantity, 0);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Orders</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Campaign order operations</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Internal reconciliation for Daypass checkout sessions, payment status, fulfilment status, and campaign source.
          </p>
        </div>
        <DateRangeFilter currentRange={filters.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Orders in view" value={formatInteger(orders.length)} />
        <SummaryCard label="Daypasses in view" value={formatInteger(daypasses)} />
        <SummaryCard
          label="Paid / fulfilled revenue"
          value={formatCurrencyFromCents(totalRevenue, orders[0]?.currency ?? "AUD")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminFilterPills
          label="Status"
          options={[
            { active: !filters.status, href: ordersHref(filters, { status: null }), label: "All" },
            ...orderStatuses.map((status) => ({
              active: filters.status === status,
              href: ordersHref(filters, { status }),
              label: status.replaceAll("_", " "),
            })),
          ]}
        />
        <AdminFilterPills
          label="Campaign"
          options={campaignOptions("/admin/orders", filters, orders.map((order) => order.campaignSlug))}
        />
      </div>

      <div className="flex justify-end">
        <CsvExportButton
          label="Export orders"
          params={{ campaignSlug: filters.campaignSlug, range: filters.range, status: filters.status }}
          type="orders"
        />
      </div>

      <p className="rounded-lg border border-orange/25 bg-orange/10 p-4 text-sm font-semibold leading-6 text-ink/70">
        Refund, cancellation, and manual review handling remains operator-defined. Refunded or cancelled orders are
        visible here so access and promo-entry consequences can be reviewed before any draw workflow.
      </p>

      {orders.length === 0 ? (
        <EmptyState
          description="No V1 orders match this filter yet. Completed Stripe checkouts will appear after webhook processing."
          title="No orders found"
        />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/48">{label}</p>
      <p className="mt-3 text-3xl font-black leading-none text-ink sm:text-4xl">{value}</p>
    </article>
  );
}

function ordersHref(filters: AdminV1Filters, overrides: { status?: string | null; campaignSlug?: string | null }) {
  return adminHref("/admin/orders", filters, overrides);
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

function OrdersTable({ orders }: { orders: AdminOrderReportRow[] }) {
  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="min-w-[980px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/48">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Purchaser</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Stripe session</th>
              <th className="px-4 py-3">Fulfilled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-bold text-ink">{formatDateTime(order.createdAt)}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{order.purchaserEmail ?? "Pending email"}</td>
                <td className="px-4 py-3 font-black text-ink">{order.status.replaceAll("_", " ")}</td>
                <td className="px-4 py-3 text-right font-black text-ink">
                  {formatCurrencyFromCents(order.totalCents, order.currency)}
                </td>
                <td className="px-4 py-3 text-right font-black text-ink">{formatInteger(order.quantity)}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{order.campaignSlug ?? order.sourceSlug ?? "Unknown"}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/62">
                  {shortenId(order.stripeCheckoutSessionId) || "Not created"}
                </td>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(order.fulfilledAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
