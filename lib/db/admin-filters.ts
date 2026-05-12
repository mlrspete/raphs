import "server-only";

export type AdminDateRangeKey = "7d" | "30d" | "all";

export const adminRangeLabels: Record<AdminDateRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

export function normalizeAdminDateRange(range: string | string[] | undefined): AdminDateRangeKey {
  const value = Array.isArray(range) ? range[0] : range;

  if (value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "30d";
}

export function getAdminRangeStartIso(range: AdminDateRangeKey) {
  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 7 : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start.toISOString();
}

export function readParam(value: string | string[] | undefined) {
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved?.trim() || null;
}
