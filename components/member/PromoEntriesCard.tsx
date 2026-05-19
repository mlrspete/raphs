import type { MemberEntrySummary } from "@/lib/domain/members/summaries";

type PromoEntriesCardProps = {
  entries: MemberEntrySummary[];
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function PromoEntriesCard({ entries }: PromoEntriesCardProps) {
  const campaignNames = Array.from(new Set(entries.map((entry) => entry.campaignName)));
  const campaignLabel = campaignNames.length === 0 ? "Campaign 001" : campaignNames.join(", ");

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">Promotion</p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-ink">Promo entries</h2>
        </div>
        <p className="text-3xl font-black leading-none text-ink">{entries.length}</p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-ink/68">
          Eligible Daypass purchases receive free entry into the promotion.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold leading-6 text-ink/68">
            Entries currently linked to {campaignLabel}. Entry numbers and public aliases are safe to show here.
          </p>
          <div className="mt-5 divide-y divide-border">
            {entries.slice(0, 8).map((entry) => (
              <div className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center" key={entry.id}>
                <div>
                  <p className="text-sm font-black leading-6 text-ink">
                    #{entry.entryNumber} - {entry.displayAlias}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/46">{entry.campaignName}</p>
                </div>
                <p className="text-sm font-semibold capitalize text-ink/62">{formatStatus(entry.status)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
