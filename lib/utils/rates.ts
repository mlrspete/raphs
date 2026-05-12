export function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: value > 0 && value < 0.01 ? 2 : 1,
    minimumFractionDigits: 0,
    style: "percent",
  }).format(value);
}
