import { EmptyState } from "@/components/admin/EmptyState";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import type { AdminLeadRow } from "@/lib/db/admin-leads";
import { formatDateTime } from "@/lib/utils/format";

type LeadsTableProps = {
  leads: AdminLeadRow[];
};

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <EmptyState
        actionHref="/admin/exports"
        actionLabel="Review exports"
        description="Waitlist leads will appear here after visitors submit the sold-out modal form. Clear filters or submit a test lead from a seeded landing page if you expected data."
        title="No leads match these filters"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/54">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">First name</th>
              <th className="px-4 py-3">Landing page</th>
              <th className="px-4 py-3">UTM source</th>
              <th className="px-4 py-3">UTM campaign</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Intent</th>
              <th className="px-4 py-3">Likelihood</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {leads.map((lead) => (
              <tr className="align-top" key={lead.id}>
                <td className="px-4 py-4 font-black text-ink">{lead.email}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{lead.first_name || "Unknown"}</td>
                <td className="px-4 py-4">
                  <p className="font-black text-ink">{lead.landingTest?.internal_name ?? lead.source_slug ?? "Unknown"}</p>
                  <p className="mt-1 font-semibold text-ink/52">{lead.source_slug ? `/${lead.source_slug}` : "No slug"}</p>
                </td>
                <td className="px-4 py-4 font-semibold text-ink/68">{lead.utm_source || "direct / unknown"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{lead.utm_campaign || "no campaign"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{lead.budget_range || "not set"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{lead.buyer_seller_intent || "not set"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{lead.likelihood_to_buy || "not set"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{formatDateTime(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
