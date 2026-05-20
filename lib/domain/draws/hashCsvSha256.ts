import "server-only";

import { createHash } from "crypto";

export function hashCsvSha256(csv: string) {
  return createHash("sha256").update(csv, "utf8").digest("hex");
}
