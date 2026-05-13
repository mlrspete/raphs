import Link from "next/link";

import { EmptyState } from "@/components/admin/EmptyState";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import type { AdminFunnelRow } from "@/lib/db/admin-funnels";
import type { AdminDateRangeKey } from "@/lib/db/admin-metrics";
import { formatInteger } from "@/lib/utils/format";
import { formatPercent } from "@/lib/utils/rates";

type FunnelTableProps = {
  rows: AdminFunnelRow[];
  range: AdminDateRangeKey;
};

export function FunnelTable({ rows, range }: FunnelTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        actionHref="/admin/tests"
        actionLabel="Review tests"
        description="Seed landing-page tests and capture events to compare funnels by landing page. The seeded demo data script can populate local or staging dashboards."
        title="No funnel data yet"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/54">
            <tr>
              <th className="px-4 py-3">Landing page</th>
              {rows[0].steps.map((step) => (
                <th className="px-4 py-3 text-right" key={step.key}>
                  {step.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {rows.map((row) => (
              <tr className="align-top" key={row.landingPageId}>
                <td className="px-4 py-4">
                  <Link
                    className="font-black text-ink underline decoration-orange/50 underline-offset-4 hover:decoration-orange"
                    href={`/admin/tests/${row.landingPageId}/results?range=${range}`}
                  >
                    {row.internalName}
                  </Link>
                  <p className="mt-1 font-semibold text-ink/52">
                    /{row.landingSlug} - {row.offerType ?? "No offer"} - {row.priceDisplay ?? "No price"}
                  </p>
                </td>
                {row.steps.map((step) => (
                  <td className="px-4 py-4 text-right" key={step.key}>
                    <p className="text-lg font-black text-ink">{formatInteger(step.count)}</p>
                    <p className="mt-1 text-xs font-bold text-ink/54">
                      {formatPercent(step.conversionFromPrevious)} prev
                    </p>
                    <p className="mt-1 text-xs font-bold text-ink/44">
                      {formatPercent(step.conversionFromFirst)} first - {formatPercent(step.dropOffFromPrevious)} drop
                    </p>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
