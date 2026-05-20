type CsvExportButtonProps = {
  type:
    | "leads"
    | "events"
    | "landing-tests"
    | "orders"
    | "entries"
    | "codes"
    | "access-grants"
    | "webhook-events"
    | "outbound-emails";
  label: string;
  params?: Record<string, string | null | undefined>;
};

export function CsvExportButton({ type, label, params = {} }: CsvExportButtonProps) {
  const searchParams = new URLSearchParams({ type });

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  return (
    <a
      className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25 sm:w-auto"
      href={`/api/admin/export?${searchParams.toString()}`}
    >
      {label}
    </a>
  );
}
