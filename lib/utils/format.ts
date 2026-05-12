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

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function shortenId(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}
