import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { listingSeeds } from "../data/listings";
import type { Database } from "../lib/types/database";

type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];

// Supabase initializes Realtime with the client even though this script only uses PostgREST.
// Provide a never-used transport so Node.js 20 can run the seed without installing ws.
class DisabledRealtimeWebSocket {
  constructor() {
    throw new Error("Realtime is disabled for the V1 listing seed script.");
  }
}

loadEnvConfig(process.cwd());

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSeedClient() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: DisabledRealtimeWebSocket as never,
    },
  });
}

async function seedListings() {
  const supabase = createSeedClient();
  const listingSlugs = listingSeeds.map((listing) => listing.slug);
  const { data: existingRows, error: existingError } = await supabase
    .from("listings")
    .select("slug, status")
    .in("slug", listingSlugs);

  if (existingError) {
    throw existingError;
  }

  const existingBySlug = new Map((existingRows ?? []).map((listing) => [listing.slug, listing]));
  const rows: ListingInsert[] = listingSeeds.map((listing) => ({
    ...listing,
    status: existingBySlug.get(listing.slug)?.status ?? listing.status,
  }));
  const { data: upsertedRows, error: upsertError } = await supabase
    .from("listings")
    .upsert(rows, { onConflict: "slug" })
    .select("slug, status, title")
    .order("slug", { ascending: true });

  if (upsertError) {
    throw upsertError;
  }

  console.log(`Seeded ${upsertedRows?.length ?? rows.length} listing(s).`);

  for (const listing of rows) {
    const action = existingBySlug.has(listing.slug) ? "updated" : "inserted";
    console.log(`${action}: ${listing.slug} (${listing.status})`);
  }
}

seedListings().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed V1 listings: ${message}`);
  process.exitCode = 1;
});
