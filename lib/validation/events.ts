import { z } from "zod";

import { supabaseLoggedEventNames } from "@/lib/analytics/types";

const optionalTrimmedString = (maxLength: number) =>
  z
    .preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().max(maxLength).optional().nullable())
    .transform((value) => value || null);

const optionalUuid = z
  .preprocess((value) => (value === "" ? null : value), z.string().uuid().optional().nullable())
  .transform((value) => value ?? null);

const optionalInteger = z
  .number()
  .int()
  .nonnegative()
  .optional()
  .nullable()
  .transform((value) => value ?? null);

function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .preprocess((value) => (value === "" ? undefined : value), z.enum(values).optional().nullable())
    .transform((value) => value ?? null);
}

export const eventPayloadSchema = z.object({
  event_name: z.enum(supabaseLoggedEventNames),
  anonymous_id: optionalTrimmedString(160),
  session_id: optionalTrimmedString(160),
  lead_id: optionalUuid,
  landing_page_id: optionalUuid,
  landing_slug: optionalTrimmedString(120),
  offer_id: optionalTrimmedString(120),
  offer_type: optionalTrimmedString(80),
  price_cents: optionalInteger,
  currency: z.preprocess((value) => value || "AUD", z.literal("AUD")),
  path: optionalTrimmedString(1000),
  url: optionalTrimmedString(1200),
  referrer: optionalTrimmedString(1000),
  utm_source: optionalTrimmedString(200),
  utm_medium: optionalTrimmedString(200),
  utm_campaign: optionalTrimmedString(300),
  utm_content: optionalTrimmedString(300),
  utm_term: optionalTrimmedString(300),
  fbclid: optionalTrimmedString(500),
  meta_campaign_id: optionalTrimmedString(200),
  meta_adset_id: optionalTrimmedString(200),
  meta_ad_id: optionalTrimmedString(200),
  device_type: optionalEnum(["desktop", "mobile", "tablet", "unknown"] as const),
  timestamp: optionalTrimmedString(80),
  properties: z.record(z.string(), z.unknown()).default({}),
});

export type EventPayloadInput = z.input<typeof eventPayloadSchema>;
export type EventPayload = z.infer<typeof eventPayloadSchema>;
