import "server-only";

import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AccessGrant } from "@/lib/types/database";

export type ActiveAccessState = {
  grantId: string | null;
  hasAccess: boolean;
  accessType: "daypass" | "ultra" | null;
  startsAt: string | null;
  expiresAt: string | null;
  needsActivation: boolean;
  status: "pending_activation" | "active" | null;
};

const noAccess: ActiveAccessState = {
  accessType: null,
  expiresAt: null,
  grantId: null,
  hasAccess: false,
  needsActivation: false,
  startsAt: null,
  status: null,
};

function isStillActive(grant: AccessGrant, now: number) {
  return grant.status === "active" && (!grant.expires_at || Date.parse(grant.expires_at) > now);
}

function toAccessState(grant: AccessGrant): ActiveAccessState {
  return {
    accessType: grant.access_type === "daypass" ? "daypass" : "ultra",
    expiresAt: grant.expires_at,
    grantId: grant.id,
    hasAccess: true,
    needsActivation: false,
    startsAt: grant.starts_at,
    status: "active",
  };
}

export async function getActiveAccess(memberProfileId?: string): Promise<ActiveAccessState> {
  const resolvedMemberProfileId = memberProfileId ?? (await getCurrentMemberProfile())?.id ?? null;

  if (!resolvedMemberProfileId) {
    return noAccess;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("access_grants")
      .select("*")
      .eq("member_profile_id", resolvedMemberProfileId)
      .in("access_type", ["daypass", "ultra"])
      .in("status", ["pending_activation", "active"])
      .order("expires_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Active access lookup failed: ${error.message}`);
      return noAccess;
    }

    const grants = data ?? [];
    const now = Date.now();
    const activeUltra = grants.find((grant) => grant.access_type === "ultra" && isStillActive(grant, now));

    if (activeUltra) {
      return toAccessState(activeUltra);
    }

    const activeDaypass = grants.find((grant) => grant.access_type === "daypass" && isStillActive(grant, now));

    if (activeDaypass) {
      return toAccessState(activeDaypass);
    }

    const pendingDaypass = grants.find((grant) => {
      return (
        grant.access_type === "daypass" &&
        grant.status === "pending_activation" &&
        !grant.starts_at &&
        !grant.expires_at
      );
    });

    if (pendingDaypass) {
      return {
        ...noAccess,
        accessType: "daypass",
        grantId: pendingDaypass.id,
        needsActivation: true,
        status: "pending_activation",
      };
    }

    return noAccess;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Active access lookup could not run: ${message}`);
    return noAccess;
  }
}
