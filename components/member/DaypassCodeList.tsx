import type { MemberCodeSummary } from "@/lib/domain/members/summaries";

type DaypassCodeListProps = {
  codes: MemberCodeSummary[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "No expiry set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function DaypassCodeList({ codes }: DaypassCodeListProps) {
  const availableCount = codes.filter((code) => code.status === "available").length;
  const redeemedCount = codes.filter((code) => code.status === "redeemed").length;

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">Friend codes</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-ink">Daypass codes</h2>

      {codes.length === 0 ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-ink/68">
          Friend codes appear here when you buy more than one Daypass.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold leading-6 text-ink/68">
            {availableCount} available, {redeemedCount} redeemed. Only status and last four characters are shown here.
          </p>
          <div className="mt-5 divide-y divide-border">
            {codes.slice(0, 6).map((code) => (
              <div className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center" key={code.id}>
                <div>
                  <p className="text-sm font-black leading-6 text-ink">Ends in {code.codeLast4}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/46">
                    {formatStatus(code.status)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink/62">
                  {code.redeemedAt ? `Redeemed ${formatDate(code.redeemedAt)}` : formatDate(code.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
