type TableScrollHintProps = {
  label?: string;
};

export function TableScrollHint({ label = "Scroll sideways to view all columns." }: TableScrollHintProps) {
  return (
    <div className="border-b border-ink/8 bg-cream/70 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink/52 md:hidden">
      {label}
    </div>
  );
}
