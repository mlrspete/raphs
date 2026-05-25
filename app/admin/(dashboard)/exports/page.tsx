import { CsvExportButton } from "@/components/admin/CsvExportButton";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { normalizeAdminDateRange } from "@/lib/db/admin-filters";
import type { ReactNode } from "react";

type AdminExportsPageProps = {
  searchParams: Promise<{
    range?: string | string[];
  }>;
};

export default async function AdminExportsPage({ searchParams }: AdminExportsPageProps) {
  const { range } = await searchParams;
  const currentRange = normalizeAdminDateRange(range);

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Exports</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">CSV exports</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
            Download simple CSV files for practical V0 analysis and Campaign 001 operations. Export actions are logged to
            the internal event log when available.
          </p>
        </div>
        <DateRangeFilter currentRange={currentRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ExportCard
          body="Emails, landing attribution, campaign fields, preferences, offer context, and capture timestamp."
          button={<CsvExportButton label="Download leads" params={{ range: currentRange }} type="leads" />}
          title="Leads CSV"
        />
        <ExportCard
          body="Selected raw event logs with landing, offer, price, UTM, session, anonymous ID, and properties JSON."
          button={<CsvExportButton label="Download events" params={{ range: currentRange }} type="events" />}
          title="Events CSV"
        />
        <ExportCard
          body="Landing test rows with core demand metrics and conversion rates for quick comparison."
          button={<CsvExportButton label="Download tests" params={{ range: currentRange }} type="landing-tests" />}
          title="Landing-test summary"
        />
        <ExportCard
          body="Order status, purchaser email, totals, quantity, campaign, payment reconciliation IDs, and fulfilment timestamp."
          button={<CsvExportButton label="Download orders" params={{ range: currentRange }} type="orders" />}
          title="Orders CSV"
        />
        <ExportCard
          body="Promo entry numbers, aliases, owner/current-holder context, status, code last four, and draw-review flags."
          button={<CsvExportButton label="Download entries" params={{ range: currentRange }} type="entries" />}
          title="Entries CSV"
        />
        <ExportCard
          body="Friend Daypass code status, purchaser, redemption status, last four only, and campaign/order context."
          button={<CsvExportButton label="Download codes" params={{ range: currentRange }} type="codes" />}
          title="Codes CSV"
        />
        <ExportCard
          body="Member access status, linked order/code last four, activation windows, expiry, and revocation timestamp."
          button={<CsvExportButton label="Download access" params={{ range: currentRange }} type="access-grants" />}
          title="Access grants CSV"
        />
        <ExportCard
          body="Webhook event IDs, event type, checkout session, processing status, related order, and sanitized errors."
          button={<CsvExportButton label="Download webhooks" params={{ range: currentRange }} type="webhook-events" />}
          title="Webhook diagnostics"
        />
        <ExportCard
          body="Transactional email recipient, template, idempotency key, provider status, and sanitized delivery error."
          button={<CsvExportButton label="Download emails" params={{ range: currentRange }} type="outbound-emails" />}
          title="Email diagnostics"
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
