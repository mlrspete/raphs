import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import { getAdminAuthState } from "@/lib/auth/admin";
import {
  getAdminV1Overview,
  type AdminOutboundEmailReportRow,
  type AdminWebhookEventReportRow,
} from "@/lib/db/admin-v1-reports";
import { formatCurrencyFromCents, formatDateTime, formatInteger, shortenId } from "@/lib/utils/format";
import type { ReactNode } from "react";

type AdminCampaignsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage({ searchParams }: AdminCampaignsPageProps) {
  const authState = await getAdminAuthState();

  if (authState.status !== "admin") {
    return null;
  }

  const { range } = await searchParams;
  const overview = await getAdminV1Overview(range);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Campaigns</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Campaign 001 summary</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Lean V1 operating view for revenue, Daypass access, promo entries, code redemptions, and fulfilment diagnostics.
          </p>
        </div>
        <DateRangeFilter currentRange={overview.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={overview.rangeLabel} label="Paid orders" value={formatInteger(overview.paidOrders)} />
        <MetricCard
          helper="Paid and fulfilled order totals"
          label="Revenue"
          value={formatCurrencyFromCents(overview.revenueCents, overview.currency)}
        />
        <MetricCard helper="Quantity across paid Daypass order items" label="Daypasses sold" value={formatInteger(overview.daypassesSold)} />
        <MetricCard helper="Currently active access grants" label="Active access" value={formatInteger(overview.activeAccessGrants)} />
        <MetricCard helper="Orders with fulfilled status" label="Fulfilled orders" value={formatInteger(overview.fulfilledOrders)} />
        <MetricCard helper="Refunded orders" label="Refunded" value={formatInteger(overview.refundedOrders)} />
        <MetricCard helper="Cancelled orders" label="Cancelled" value={formatInteger(overview.cancelledOrders)} />
        <MetricCard helper="Created / redeemed" label="Codes" value={`${formatInteger(overview.codesCreated)} / ${formatInteger(overview.codesRedeemed)}`} />
        <MetricCard helper="All issued promo entries" label="Entries issued" value={formatInteger(overview.entriesIssued)} />
        <MetricCard helper="Active or winner status" label="Draw pool review" value={formatInteger(overview.activeEntries)} />
        <MetricCard helper="Refunded or cancelled entries" label="Refund/cancel flags" value={formatInteger(overview.refundedEntries + overview.cancelledEntries)} />
        <MetricCard helper="Void or disqualified entries" label="Void flags" value={formatInteger(overview.voidEntries)} />
      </div>

      <div className="grid gap-4 rounded-lg border border-orange/25 bg-orange/10 p-5 text-sm font-semibold leading-6 text-ink/70 md:grid-cols-2">
        <p>
          Refund and revocation rules are not automated here. Before a draw, the operator must define whether refunded
          Daypasses revoke member access and whether related promo entries are cancelled, void, or retained.
        </p>
        <p>
          Use the entries export as the internal draw ledger. Public draw/result materials must omit private purchaser
          details, Stripe identifiers, internal notes, and friend-code recovery data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ExportCard
          body="Internal order, member, and status context for access operations."
          button={<CsvExportButton label="Export access grants" params={{ range: overview.range }} type="access-grants" />}
          title="Access grants"
        />
        <ExportCard
          body="Webhook receipt, processing status, related order, and sanitized error diagnostics."
          button={<CsvExportButton label="Export webhooks" params={{ range: overview.range }} type="webhook-events" />}
          title="Webhook events"
        />
        <ExportCard
          body="Transactional email status, recipient, template, idempotency key, and sanitized provider errors."
          button={<CsvExportButton label="Export emails" params={{ range: overview.range }} type="outbound-emails" />}
          title="Outbound emails"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DiagnosticsTable
          emptyDescription="No Stripe webhook rows match this date range."
          rows={overview.recentWebhookEvents}
          title="Recent webhooks"
          type="webhooks"
        />
        <DiagnosticsTable
          emptyDescription="No outbound email rows match this date range."
          rows={overview.recentOutboundEmails}
          title="Recent outbound emails"
          type="emails"
        />
      </div>
    </section>
  );
}

function ExportCard({ body, button, title }: { body: string; button: ReactNode; title: string }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <h3 className="text-xl font-black leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-ink/62">{body}</p>
      <div className="mt-5">{button}</div>
    </article>
  );
}

function DiagnosticsTable({
  emptyDescription,
  rows,
  title,
  type,
}: {
  emptyDescription: string;
  rows: AdminWebhookEventReportRow[] | AdminOutboundEmailReportRow[];
  title: string;
  type: "webhooks" | "emails";
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="border-b border-ink/8 p-5">
        <h3 className="text-lg font-black leading-tight text-ink">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState description={emptyDescription} title="No diagnostics yet" />
        </div>
      ) : type === "webhooks" ? (
        <WebhookRows rows={rows as AdminWebhookEventReportRow[]} />
      ) : (
        <EmailRows rows={rows as AdminOutboundEmailReportRow[]} />
      )}
    </article>
  );
}

function WebhookRows({ rows }: { rows: AdminWebhookEventReportRow[] }) {
  return (
    <>
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="min-w-[760px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/48">
            <tr>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(row.receivedAt)}</td>
                <td className="px-4 py-3 font-bold text-ink">{row.eventType}</td>
                <td className="px-4 py-3 font-black text-ink">{row.processingStatus}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/62">{shortenId(row.relatedOrderId) || "None"}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{row.errorMessage ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EmailRows({ rows }: { rows: AdminOutboundEmailReportRow[] }) {
  return (
    <>
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="min-w-[760px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/48">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(row.createdAt)}</td>
                <td className="px-4 py-3 font-bold text-ink">{row.templateKey}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{row.recipientEmail}</td>
                <td className="px-4 py-3 font-black text-ink">{row.status}</td>
                <td className="px-4 py-3 font-semibold text-ink/70">{row.errorMessage ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
