export function formatInteger(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFromCents(value: number | null | undefined, currency = "AUD") {
  if (typeof value !== "number") {
    return currency;
  }

  return new Intl.NumberFormat("en-AU", {
    currency,
    style: "currency",
  }).format(value / 100);
}
