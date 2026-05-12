import "server-only";

import type { User } from "@supabase/supabase-js";

import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { AdminProfile } from "@/lib/types/database";

export type AdminAuthState =
  | {
      status: "unauthenticated";
      user: null;
      profile: null;
    }
  | {
      status: "denied";
      user: User;
      profile: null;
    }
  | {
      status: "admin";
      user: User;
      profile: AdminProfile;
    };

export async function getAdminAuthState(): Promise<AdminAuthState> {
  let supabase: Awaited<ReturnType<typeof createServerSupabaseAuthClient>>;

  try {
    supabase = await createServerSupabaseAuthClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Admin auth client could not be created: ${message}`);

    return {
      status: "unauthenticated",
      user: null,
      profile: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "unauthenticated",
      user: null,
      profile: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    if (profileError) {
      console.error(`Admin profile lookup failed for ${user.id}: ${profileError.message}`);
    }

    return {
      status: "denied",
      user,
      profile: null,
    };
  }

  return {
    status: "admin",
    user,
    profile,
  };
}
