import { z } from "zod";

export const memberEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254);

export function normalizeEmail(email: string) {
  return memberEmailSchema.parse(email).toLowerCase();
}
