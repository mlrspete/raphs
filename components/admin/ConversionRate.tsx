import { formatPercent } from "@/lib/utils/rates";

type ConversionRateProps = {
  value: number;
  label?: string;
};

export function ConversionRate({ value, label }: ConversionRateProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-black text-ink">{formatPercent(value)}</span>
      {label ? <span className="text-xs font-bold text-ink/48">{label}</span> : null}
    </span>
  );
}
