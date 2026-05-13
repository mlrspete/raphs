import { EmptyState } from "@/components/admin/EmptyState";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import type { AdminEventRow } from "@/lib/db/admin-events";
import { formatCurrencyFromCents, formatDateTime, shortenId } from "@/lib/utils/format";

type EventsTableProps = {
  events: AdminEventRow[];
};

export function EventsTable({ events }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        actionHref="/admin/funnels"
        actionLabel="Review funnels"
        description="Selected analytics events will appear here after public pages receive tracked traffic. Clear filters, open a seeded landing page, and click a sold-out CTA if you expected rows."
        title="No events match these filters"
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
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Landing</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">UTM source</th>
              <th className="px-4 py-3">UTM campaign</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Anonymous</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Properties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {events.map((event) => (
              <tr className="align-top" key={event.id}>
                <td className="px-4 py-4 font-black text-ink">{event.event_name}</td>
                <td className="px-4 py-4">
                  <p className="font-black text-ink">{event.landingTest?.internal_name ?? event.landing_slug ?? "Unknown"}</p>
                  <p className="mt-1 font-semibold text-ink/52">{event.landing_slug ? `/${event.landing_slug}` : "No slug"}</p>
                </td>
                <td className="px-4 py-4 font-semibold text-ink/68">{event.offer_type || "not set"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">
                  {formatCurrencyFromCents(event.price_cents, event.currency ?? "AUD")}
                </td>
                <td className="px-4 py-4 font-semibold text-ink/68">{event.utm_source || "direct / unknown"}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{event.utm_campaign || "no campaign"}</td>
                <td className="px-4 py-4 font-mono text-xs font-bold text-ink/62">{shortenId(event.session_id)}</td>
                <td className="px-4 py-4 font-mono text-xs font-bold text-ink/62">{shortenId(event.anonymous_id)}</td>
                <td className="px-4 py-4 font-semibold text-ink/68">{formatDateTime(event.created_at)}</td>
                <td className="px-4 py-4">
                  <details className="max-w-sm">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.1em] text-orange">
                      JSON
                    </summary>
                    <pre className="mt-2 max-h-44 overflow-auto rounded-md bg-ink p-3 text-xs font-semibold text-white">
                      {JSON.stringify(event.properties, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
