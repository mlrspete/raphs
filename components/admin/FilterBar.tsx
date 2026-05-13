type FilterOption = {
  label: string;
  value: string;
};

type FilterField = {
  label: string;
  name: string;
  value?: string | null;
  placeholder?: string;
  options?: FilterOption[];
};

type FilterBarProps = {
  fields: FilterField[];
  action: string;
  clearHref: string;
};

const rangeOptions: FilterOption[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
];

export function FilterBar({ fields, action, clearHref }: FilterBarProps) {
  return (
    <form action={action} className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-ink/52">
          Date range
          <select
            className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none focus:ring-4 focus:ring-orange/25"
            defaultValue={fields.find((field) => field.name === "range")?.value ?? "30d"}
            name="range"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {fields
          .filter((field) => field.name !== "range")
          .map((field) => (
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-ink/52" key={field.name}>
              {field.label}
              {field.options ? (
                <select
                  className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none focus:ring-4 focus:ring-orange/25"
                  defaultValue={field.value ?? ""}
                  name={field.name}
                >
                  <option value="">All</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-orange/25"
                  defaultValue={field.value ?? ""}
                  name={field.name}
                  placeholder={field.placeholder}
                  type="text"
                />
              )}
            </label>
          ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-orange px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-ink shadow-soft transition hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/25 sm:w-auto"
          type="submit"
        >
          Apply filters
        </button>
        <a
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-ink/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-ink/64 transition hover:bg-cream hover:text-ink focus:outline-none focus:ring-4 focus:ring-orange/25 sm:w-auto"
          href={clearHref}
        >
          Clear
        </a>
      </div>
    </form>
  );
}
