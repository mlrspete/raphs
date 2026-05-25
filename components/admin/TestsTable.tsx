import Link from "next/link";

import { ConversionRate } from "@/components/admin/ConversionRate";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import type { AdminDateRangeKey, AdminLandingTestMetric } from "@/lib/db/admin-metrics";
import { formatInteger } from "@/lib/utils/format";

type TestsTableProps = {
  tests: AdminLandingTestMetric[];
  range: AdminDateRangeKey;
};

export function TestsTable({ tests, range }: TestsTableProps) {
  if (tests.length === 0) {
    return (
      <EmptyState
        actionHref="/admin"
        actionLabel="Back to overview"
        description="Seed landing-page tests into the database, then this table will show live demand signals by test."
        title="No landing tests found"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <TableScrollHint />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/54">
            <tr>
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-right">Visitors</th>
              <th className="px-4 py-3 text-right">Intent</th>
              <th className="px-4 py-3 text-right">Modal opens</th>
              <th className="px-4 py-3 text-right">Waitlist</th>
              <th className="px-4 py-3 text-right">CTA rate</th>
              <th className="px-4 py-3 text-right">Modal to waitlist</th>
              <th className="px-4 py-3 text-right">Overall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {tests.map((test) => (
              <tr className="align-top" key={test.id}>
                <td className="px-4 py-4">
                  <Link
                    className="font-black text-ink underline decoration-orange/50 underline-offset-4 hover:decoration-orange"
                    href={`/admin/tests/${test.id}/results?range=${range}`}
                  >
                    {test.internal_name}
                  </Link>
                  <p className="mt-1 font-semibold text-ink/52">/{test.slug}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-md bg-cream px-2 py-1 text-xs font-black uppercase tracking-[0.1em] text-ink/62">
                    {test.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-black text-ink">{test.offer_type ?? "No offer"}</p>
                  <p className="mt-1 font-semibold text-ink/52">{test.price_display ?? "No price"}</p>
                </td>
                <td className="px-4 py-4 text-right font-black">{formatInteger(test.landingViews)}</td>
                <td className="px-4 py-4 text-right font-black">{formatInteger(test.uniqueVisitors)}</td>
                <td className="px-4 py-4 text-right font-black">{formatInteger(test.paidIntentClicks)}</td>
                <td className="px-4 py-4 text-right font-black">{formatInteger(test.modalOpens)}</td>
                <td className="px-4 py-4 text-right font-black">{formatInteger(test.waitlistSubmissions)}</td>
                <td className="px-4 py-4 text-right">
                  <ConversionRate value={test.ctaClickRate} />
                </td>
                <td className="px-4 py-4 text-right">
                  <ConversionRate value={test.modalToWaitlistConversion} />
                </td>
                <td className="px-4 py-4 text-right">
                  <ConversionRate value={test.overallWaitlistConversion} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
