import { z } from "zod";

export const waitlistPrivacyVersion = "waitlist-v0-2026-05-12";

export const preferredCategoryValues = [
  "80s_90s",
  "2000s",
  "2010s",
  "artist_graphics",
  "brand_archives",
  "not_sure",
] as const;

export const budgetRangeValues = ["under_150", "150_300", "300_600", "600_plus", "not_sure"] as const;

export const buyerSellerIntentValues = ["buyer", "seller", "both", "not_sure"] as const;

export const likelihoodToBuyValues = ["very_likely", "likely", "unsure", "unlikely"] as const;

export const preferredCategoryOptions = [
  { value: "80s_90s", label: "80s / 90s classics" },
  { value: "2000s", label: "2000s era decks" },
  { value: "2010s", label: "2010s and newer" },
  { value: "artist_graphics", label: "Artist graphics" },
  { value: "brand_archives", label: "Brand archives" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export const budgetRangeOptions = [
  { value: "under_150", label: "Under $150" },
  { value: "150_300", label: "$150 - $300" },
  { value: "300_600", label: "$300 - $600" },
  { value: "600_plus", label: "$600+" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export const buyerSellerIntentOptions = [
  { value: "buyer", label: "Mostly buying" },
  { value: "seller", label: "Mostly selling later" },
  { value: "both", label: "Buying and selling" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export const likelihoodToBuyOptions = [
  { value: "very_likely", label: "Very likely" },
  { value: "likely", label: "Likely" },
  { value: "unsure", label: "Still deciding" },
  { value: "unlikely", label: "Unlikely" },
] as const;

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

export const waitlistContextSchema = z.object({
  landingPageId: optionalUuid,
  landingSlug: optionalTrimmedString(120),
  offerId: optionalTrimmedString(120),
  offerType: optionalTrimmedString(80),
  priceCents: optionalInteger,
  currency: z.preprocess((value) => value || "AUD", z.literal("AUD")),
});

export const waitlistAttributionSchema = z.object({
  anonymous_id: optionalTrimmedString(160),
  session_id: optionalTrimmedString(160),
  path: optionalTrimmedString(1000),
  referrer: optionalTrimmedString(1000),
  device_type: optionalEnum(["desktop", "mobile", "tablet", "unknown"] as const),
  utm_source: optionalTrimmedString(200),
  utm_medium: optionalTrimmedString(200),
  utm_campaign: optionalTrimmedString(300),
  utm_content: optionalTrimmedString(300),
  utm_term: optionalTrimmedString(300),
  fbclid: optionalTrimmedString(500),
  meta_campaign_id: optionalTrimmedString(200),
  meta_adset_id: optionalTrimmedString(200),
  meta_ad_id: optionalTrimmedString(200),
  timestamp: optionalTrimmedString(80),
});

export const waitlistSubmissionSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1, "Email is required.").email("Enter a valid email address.").max(254),
  ),
  firstName: optionalTrimmedString(80),
  favouriteBrands: optionalTrimmedString(300),
  preferredCategory: optionalEnum(preferredCategoryValues),
  budgetRange: optionalEnum(budgetRangeValues),
  buyerSellerIntent: optionalEnum(buyerSellerIntentValues),
  likelihoodToBuy: optionalEnum(likelihoodToBuyValues),
  consentMarketing: z.boolean().refine((value) => value, {
    message: "Marketing consent is required.",
  }),
  privacyVersion: optionalTrimmedString(80),
  website: optionalTrimmedString(200),
  context: waitlistContextSchema,
  attribution: waitlistAttributionSchema,
});

export type WaitlistSubmission = z.infer<typeof waitlistSubmissionSchema>;
export type WaitlistSubmissionInput = z.input<typeof waitlistSubmissionSchema>;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function splitFavouriteBrands(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((brand) => brand.trim())
    .filter(Boolean)
    .slice(0, 12);
}
