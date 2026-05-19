import "server-only";

import type { User } from "@supabase/supabase-js";

import { normalizeEmail } from "@/lib/domain/members/normalizeEmail";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { MemberProfile } from "@/lib/types/database";

function getDisplayName(user: User) {
  const value = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function upsertMemberProfileForAuthUser(user: User): Promise<MemberProfile> {
  if (!user.email) {
    throw new Error("Authenticated member is missing an email address.");
  }

  const supabase = createAdminSupabaseClient();
  const email = user.email.trim();
  const emailNormalized = normalizeEmail(email);
  const displayName = getDisplayName(user);
  const { data: existingProfile, error: lookupError } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existingProfile) {
    if (existingProfile.user_id && existingProfile.user_id !== user.id) {
      throw new Error("A different authenticated user is already linked to this member email.");
    }

    const { data, error } = await supabase
      .from("member_profiles")
      .update({
        display_name: existingProfile.display_name ?? displayName,
        email,
        user_id: user.id,
      })
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to link member profile.");
    }

    return data;
  }

  const { data, error } = await supabase
    .from("member_profiles")
    .insert({
      display_name: displayName,
      email,
      email_normalized: emailNormalized,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create member profile.");
  }

  return data;
}
