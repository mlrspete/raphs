import "server-only";

import { createHash } from "crypto";

export function normalizeDaypassCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashDaypassCode(code: string) {
  return createHash("sha256").update(normalizeDaypassCode(code), "utf8").digest("hex");
}
