import "server-only";

import { rowsToCsv, type CsvRow } from "@/lib/csv/export";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { MemberProfile, PromoEntry } from "@/lib/types/database";

const eligibleStatuses = ["active"] as const;
const snapshotHeaders = [
  "campaign_slug",
  "campaign_name",
  "entry_id",
  "entry_number",
  "display_alias",
  "owner_member_profile_id",
  "owner_email",
  "current_holder_member_profile_id",
  "current_holder_email",
  "referrer_member_profile_id",
  "referrer_email",
  "daypass_code_id",
  "daypass_code_last4",
  "status",
  "locked_at",
] as const;

type SafeDaypassCode = {
  id: string;
  code_last4: string;
};

export type EligibleDrawEntry = {
  campaignSlug: string;
  campaignName: string;
  entryId: string;
  entryNumber: number;
  displayAlias: string;
  ownerMemberProfileId: string | null;
  ownerEmail: string | null;
  currentHolderMemberProfileId: string | null;
  currentHolderEmail: string | null;
  referrerMemberProfileId: string | null;
  referrerEmail: string | null;
  daypassCodeId: string | null;
  daypassCodeLast4: string | null;
  status: string;
  lockedAt: string | null;
};

export type EligibleEntriesCsv = {
  csv: string;
  entries: EligibleDrawEntry[];
  headers: readonly string[];
};

function indexById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function memberEmail(memberId: string | null, membersById: Map<string, MemberProfile>) {
  return memberId ? membersById.get(memberId)?.email ?? null : null;
}

function toCsvRows(entries: EligibleDrawEntry[]): CsvRow[] {
  return entries.map((entry) => ({
    campaign_slug: entry.campaignSlug,
    campaign_name: entry.campaignName,
    entry_id: entry.entryId,
    entry_number: entry.entryNumber,
    display_alias: entry.displayAlias,
    owner_member_profile_id: entry.ownerMemberProfileId,
    owner_email: entry.ownerEmail,
    current_holder_member_profile_id: entry.currentHolderMemberProfileId,
    current_holder_email: entry.currentHolderEmail,
    referrer_member_profile_id: entry.referrerMemberProfileId,
    referrer_email: entry.referrerEmail,
    daypass_code_id: entry.daypassCodeId,
    daypass_code_last4: entry.daypassCodeLast4,
    status: entry.status,
    locked_at: entry.lockedAt,
  }));
}

export async function buildEligibleEntriesCsv({
  campaignId,
  campaignName,
  campaignSlug,
  requireLocked = true,
}: {
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  requireLocked?: boolean;
}): Promise<EligibleEntriesCsv> {
  const supabase = createAdminSupabaseClient();
  let entriesQuery = supabase
    .from("promo_entries")
    .select("*")
    .eq("campaign_id", campaignId)
    .in("status", [...eligibleStatuses])
    .order("entry_number", { ascending: true })
    .limit(10000);

  if (requireLocked) {
    entriesQuery = entriesQuery.not("locked_at", "is", null);
  }

  const { data: entries, error: entriesError } = await entriesQuery;

  if (entriesError) {
    throw new Error(`Eligible entries could not be loaded: ${entriesError.message}`);
  }

  const memberIds = [
    ...new Set(
      (entries ?? [])
        .flatMap((entry) => [
          entry.owner_member_profile_id,
          entry.current_holder_member_profile_id,
          entry.referrer_member_profile_id,
        ])
        .filter(Boolean) as string[],
    ),
  ];
  const codeIds = [
    ...new Set((entries ?? []).map((entry) => entry.daypass_code_id).filter(Boolean) as string[]),
  ];

  const [membersResult, codesResult] = await Promise.all([
    memberIds.length > 0
      ? supabase.from("member_profiles").select("*").in("id", memberIds).limit(10000)
      : Promise.resolve({ data: [] as MemberProfile[], error: null }),
    codeIds.length > 0
      ? supabase.from("daypass_codes").select("id,code_last4").in("id", codeIds).limit(10000)
      : Promise.resolve({ data: [] as SafeDaypassCode[], error: null }),
  ]);

  if (membersResult.error) {
    throw new Error(`Draw member context could not be loaded: ${membersResult.error.message}`);
  }

  if (codesResult.error) {
    throw new Error(`Draw code context could not be loaded: ${codesResult.error.message}`);
  }

  const membersById = indexById((membersResult.data ?? []) as MemberProfile[]);
  const codesById = indexById((codesResult.data ?? []) as SafeDaypassCode[]);
  const mappedEntries = ((entries ?? []) as PromoEntry[]).map((entry) => {
    const code = entry.daypass_code_id ? codesById.get(entry.daypass_code_id) ?? null : null;

    return {
      campaignName,
      campaignSlug,
      currentHolderEmail: memberEmail(entry.current_holder_member_profile_id, membersById),
      currentHolderMemberProfileId: entry.current_holder_member_profile_id,
      daypassCodeId: entry.daypass_code_id,
      daypassCodeLast4: code?.code_last4 ?? null,
      displayAlias: entry.display_alias,
      entryId: entry.id,
      entryNumber: entry.entry_number,
      lockedAt: entry.locked_at,
      ownerEmail: memberEmail(entry.owner_member_profile_id, membersById) ?? entry.owner_email_normalized,
      ownerMemberProfileId: entry.owner_member_profile_id,
      referrerEmail: memberEmail(entry.referrer_member_profile_id, membersById),
      referrerMemberProfileId: entry.referrer_member_profile_id,
      status: entry.status,
    };
  });

  return {
    csv: rowsToCsv(toCsvRows(mappedEntries), [...snapshotHeaders]),
    entries: mappedEntries,
    headers: snapshotHeaders,
  };
}
