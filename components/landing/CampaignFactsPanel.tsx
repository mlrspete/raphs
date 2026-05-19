import {
  campaign001PublicContent,
  formatCampaignDateTime,
  type CampaignTimingKey,
} from "@/lib/domain/campaigns/publicContent";

const timingRows: { key: CampaignTimingKey; label: string }[] = [
  { key: "starts_at", label: "Campaign starts" },
  { key: "closes_at", label: "Campaign closes" },
  { key: "entries_close_at", label: "Entries close" },
  { key: "draw_lock_at", label: "Draw lock" },
  { key: "draw_at", label: "Planned draw" },
];

export function CampaignFactsPanel() {
  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="landing-card-eyebrow">Campaign Facts</p>
          <h2 className="landing-section-title mt-3">Know the timing before entering.</h2>
          <p className="landing-body mt-4">
            Campaign 001 uses separate timestamps for public close, entry close, attribution lock, and draw timing. Final
            dates must be supplied before launch.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {timingRows.map((row) => (
            <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft" key={row.key}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">{row.label}</p>
              <p className="mt-3 text-sm font-black leading-6 text-ink">
                {formatCampaignDateTime(campaign001PublicContent.timings[row.key])}
              </p>
              <p className="mt-3 text-xs font-semibold leading-5 text-ink/58">
                {campaign001PublicContent.timingDefinitions[row.key]}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
