import "server-only";

import { createServerSupabaseAuthClient } from "@/lib/supabase/server";
import type { MemberProfile } from "@/lib/types/database";
import { upsertMemberProfileForAuthUser } from "@/lib/domain/members/upsertMemberProfileForAuthUser";

export async function getCurrentMemberProfile(): Promise<MemberProfile | null> {
  let supabase: Awaited<ReturnType<typeof createServerSupabaseAuthClient>>;

  try {
    supabase = await createServerSupabaseAuthClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Member auth client could not be created: ${message}`);
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  try {
    return await upsertMemberProfileForAuthUser(user);
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
    console.error(`Member profile could not be created or linked for ${user.id}: ${message}`);
    return null;
  }
}
