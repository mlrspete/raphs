import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { TableScrollHint } from "@/components/admin/TableScrollHint";
import { getAdminAuthState } from "@/lib/auth/admin";
import { DRAW_REFUND_RULE_CONFIRMATION } from "@/lib/domain/draws/createDrawSnapshot";
import { getAdminDrawWorkflowState } from "@/lib/domain/draws/getAdminDrawWorkflowState";
import { formatDateTime, formatInteger, shortenId } from "@/lib/utils/format";

type AdminDrawsPageProps = {
  searchParams: Promise<{
    campaign?: string | string[];
    error?: string | string[];
    message?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

function readParam(value: string | string[] | undefined) {
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved?.trim() || null;
}

export default async function AdminDrawsPage({ searchParams }: AdminDrawsPageProps) {
  const authState = await getAdminAuthState();

  if (authState.status !== "admin") {
    return null;
  }

  const params = await searchParams;
  const campaignSlug = readParam(params.campaign) ?? "campaign-001";
  const state = await getAdminDrawWorkflowState(campaignSlug);
  const message = readParam(params.message);
  const error = readParam(params.error);
  const campaign = state.campaign;

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Draw workflow</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">Manual draw snapshot</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/68">
          Lock entries after draw_lock_at, create a deterministic CSV snapshot, record the live draw result, and publish
          only safe winner details.
        </p>
        <form className="mt-5 flex max-w-lg flex-col gap-3 sm:flex-row" method="get">
          <label className="min-w-0 flex-1 text-sm font-bold text-ink/70">
            Campaign slug
            <input
              className="mt-2 w-full rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
              name="campaign"
              type="text"
              defaultValue={campaignSlug}
            />
          </label>
          <button className="inline-flex min-h-10 items-center justify-center self-end rounded-md border border-ink/10 bg-cream px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-ink transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-orange/25">
            Load campaign
          </button>
        </form>
      </div>

      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      {!campaign ? (
        <EmptyState
          description="Campaign 001 has not been seeded or cannot be loaded. Seed campaigns before running the draw workflow."
          title="Campaign not found"
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard helper="All promo_entries rows" label="Total entries" value={formatInteger(state.counts.totalEntries)} />
            <MetricCard helper="Active status only" label="Eligible by default" value={formatInteger(state.counts.activeEligible)} />
            <MetricCard helper="Active entries with locked_at" label="Locked eligible" value={formatInteger(state.counts.lockedEligible)} />
            <MetricCard
              helper="Refunded, cancelled, void, or disqualified"
              label="Excluded flags"
              value={formatInteger(state.counts.excludedTotal)}
            />
          </div>

          <CampaignTimingCard campaign={campaign} />

          <div className="grid gap-4 xl:grid-cols-3">
            <WorkflowCard title="1. Lock eligible entries">
              <p className="text-sm font-semibold leading-6 text-ink/65">
                Sets locked_at on active eligible entries only. Holder attribution is not changed. Redemption after this
                point can grant access but cannot change entry attribution.
              </p>
              <form action="/api/admin/draws/lock" className="mt-5" method="post">
                <input name="campaignSlug" type="hidden" value={campaign.slug} />
                <button className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25">
                  Lock entries
                </button>
              </form>
            </WorkflowCard>

            <WorkflowCard title="2. Create snapshot">
              <p className="text-sm font-semibold leading-6 text-ink/65">
                Excludes refunded, cancelled, void, and disqualified entries by only snapshotting locked active entries.
              </p>
              <form action="/api/admin/draws/snapshot" className="mt-5 grid gap-3" method="post">
                <input name="campaignSlug" type="hidden" value={campaign.slug} />
                <label className="grid gap-2 text-sm font-bold text-ink/70">
                  Notes
                  <textarea
                    className="min-h-24 rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
                    name="notes"
                    placeholder="Operator notes for this snapshot"
                  />
                </label>
                <label className="flex items-start gap-3 rounded-md border border-orange/25 bg-orange/10 p-3 text-sm font-semibold leading-6 text-ink/70">
                  <input
                    className="mt-1 h-4 w-4 accent-orange"
                    name="refundRuleConfirmation"
                    type="checkbox"
                    value={DRAW_REFUND_RULE_CONFIRMATION}
                  />
                  <span>I confirm refunded, cancelled, void, and disqualified entries are excluded from this snapshot.</span>
                </label>
                <button className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25">
                  Create snapshot
                </button>
              </form>
            </WorkflowCard>

            <WorkflowCard title="3. Record result">
              <p className="text-sm font-semibold leading-6 text-ink/65">
                Enter the winning entry number from the manual live draw. The app validates it against the selected
                snapshot and stores the method, notes, and winning entry.
              </p>
              <form action="/api/admin/draws/result" className="mt-5 grid gap-3" method="post">
                <input name="campaignSlug" type="hidden" value={campaign.slug} />
                <label className="grid gap-2 text-sm font-bold text-ink/70">
                  Snapshot
                  <select
                    className="rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
                    name="drawSnapshotId"
                    required
                  >
                    {state.snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {formatDateTime(snapshot.created_at)} / {snapshot.entry_count} entries
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink/70">
                  Winning entry number
                  <input
                    className="rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
                    min={1}
                    name="winningEntryNumber"
                    required
                    type="number"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink/70">
                  Draw method
                  <input
                    className="rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
                    maxLength={160}
                    name="drawMethod"
                    placeholder="Manual live draw method"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink/70">
                  Public notes
                  <textarea
                    className="min-h-20 rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
                    name="publicNotes"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink/70">
                  Internal notes
                  <textarea
                    className="min-h-20 rounded-md border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-orange focus:ring-4 focus:ring-orange/20"
                    name="internalNotes"
                  />
                </label>
                <button
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={state.snapshots.length === 0 || Boolean(state.latestResult)}
                >
                  Record draw result
                </button>
              </form>
            </WorkflowCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SnapshotsTable snapshots={state.snapshots} />
            <ResultCard result={state.latestResult} campaignSlug={campaign.slug} />
          </div>
        </>
      )}
    </section>
  );
}

function Notice({ children, tone }: { children: string; tone: "success" | "error" }) {
  return (
    <div
      className={`rounded-lg border p-4 text-sm font-black leading-6 ${
        tone === "success"
          ? "border-green-600/20 bg-green-50 text-green-900"
          : "border-red-600/20 bg-red-50 text-red-900"
      }`}
    >
      {children}
    </div>
  );
}

function CampaignTimingCard({
  campaign,
}: {
  campaign: {
    closes_at: string | null;
    draw_at: string | null;
    draw_lock_at: string | null;
    entries_close_at: string | null;
    name: string;
    slug: string;
    starts_at: string | null;
    status: string;
  };
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-black leading-tight text-ink">{campaign.name}</h3>
          <p className="mt-2 text-sm font-semibold text-ink/60">
            {campaign.slug} / status: {campaign.status}
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/10 bg-cream px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-ink transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-orange/25"
          href={`/draw-results/${campaign.slug}`}
        >
          Public result
        </Link>
      </div>
      <dl className="mt-5 grid gap-3 md:grid-cols-5">
        <TimingItem label="Starts" value={campaign.starts_at} />
        <TimingItem label="Closes" value={campaign.closes_at} />
        <TimingItem label="Entries close" value={campaign.entries_close_at} />
        <TimingItem label="Draw lock" value={campaign.draw_lock_at} />
        <TimingItem label="Draw time" value={campaign.draw_at} />
      </dl>
    </article>
  );
}

function TimingItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-ink/8 bg-cream p-3">
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">{label}</dt>
      <dd className="mt-2 text-sm font-black text-ink">{formatDateTime(value)}</dd>
    </div>
  );
}

function WorkflowCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h3 className="text-lg font-black leading-tight text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function SnapshotsTable({
  snapshots,
}: {
  snapshots: {
    created_at: string;
    csv_sha256: string;
    downloadHref: string;
    entry_count: number;
    id: string;
    notes: string | null;
  }[];
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="border-b border-ink/8 p-5">
        <h3 className="text-lg font-black leading-tight text-ink">Snapshots</h3>
      </div>
      {snapshots.length === 0 ? (
        <div className="p-5">
          <EmptyState description="No draw snapshot has been created yet." title="No snapshots" />
        </div>
      ) : (
        <>
          <TableScrollHint />
          <div className="overflow-x-auto">
            <table className="min-w-[820px] text-left text-sm">
              <thead className="bg-cream text-xs font-black uppercase tracking-[0.12em] text-ink/48">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Entries</th>
                  <th className="px-4 py-3">SHA-256</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">CSV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td className="px-4 py-3 font-semibold text-ink/70">{formatDateTime(snapshot.created_at)}</td>
                    <td className="px-4 py-3 text-right font-black text-ink">{formatInteger(snapshot.entry_count)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink/62">{snapshot.csv_sha256}</td>
                    <td className="px-4 py-3 font-semibold text-ink/70">{snapshot.notes ?? "None"}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-xs font-black uppercase tracking-[0.12em] text-orange underline-offset-4 hover:underline"
                        href={snapshot.downloadHref}
                      >
                        Download
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}

function ResultCard({
  campaignSlug,
  result,
}: {
  campaignSlug: string;
  result: {
    created_at: string;
    draw_method: string;
    id: string;
    public_notes: string | null;
    winnerAlias: string | null;
    winning_entry_number: number;
  } | null;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h3 className="text-lg font-black leading-tight text-ink">Recorded result</h3>
      {!result ? (
        <div className="mt-4">
          <EmptyState description="No result has been recorded for this campaign." title="No result yet" />
        </div>
      ) : (
        <dl className="mt-4 grid gap-3 text-sm">
          <ResultItem label="Winning entry" value={formatInteger(result.winning_entry_number)} />
          <ResultItem label="Winner alias" value={result.winnerAlias ?? "Winner"} />
          <ResultItem label="Draw method" value={result.draw_method} />
          <ResultItem label="Created" value={formatDateTime(result.created_at)} />
          <ResultItem label="Result ID" value={shortenId(result.id)} />
          <ResultItem label="Public notes" value={result.public_notes ?? "None"} />
          <Link
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25"
            href={`/draw-results/${campaignSlug}`}
          >
            View public result
          </Link>
        </dl>
      )}
    </article>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/8 bg-cream p-3">
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/48">{label}</dt>
      <dd className="mt-2 break-words font-black text-ink">{value}</dd>
    </div>
  );
}
