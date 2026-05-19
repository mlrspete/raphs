import "server-only";

import { normalizeEmail } from "@/lib/domain/members/normalizeEmail";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { MemberProfile } from "@/lib/types/database";

export type GetOrCreateMemberProfileByEmailInput = {
  email: string;
  stripeCustomerId?: string | null;
};

export async function getOrCreateMemberProfileByEmail({
  email,
  stripeCustomerId = null,
}: GetOrCreateMemberProfileByEmailInput): Promise<MemberProfile> {
  const supabase = createAdminSupabaseClient();
  const trimmedEmail = email.trim();
  const emailNormalized = normalizeEmail(trimmedEmail);
  const { data: existingProfile, error: lookupError } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existingProfile) {
    const shouldUpdateStripeCustomer = Boolean(stripeCustomerId && !existingProfile.stripe_customer_id);

    if (!shouldUpdateStripeCustomer && existingProfile.email === trimmedEmail) {
      return existingProfile;
    }

    const { data, error } = await supabase
      .from("member_profiles")
      .update({
        email: trimmedEmail,
        stripe_customer_id: shouldUpdateStripeCustomer ? stripeCustomerId : existingProfile.stripe_customer_id,
      })
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update member profile.");
    }

    return data;
  }

  const { data, error } = await supabase
    .from("member_profiles")
    .insert({
      email: trimmedEmail,
      email_normalized: emailNormalized,
      stripe_customer_id: stripeCustomerId,
      user_id: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create member profile from checkout email.");
  }

  return data;
}
