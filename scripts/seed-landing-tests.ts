import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { landingPageTests } from "../lib/landing-tests/config";
import type { LandingTestConfig } from "../lib/landing-tests/types";
import type { Database, Json } from "../lib/types/database";

type LandingPageTestInsert = Database["public"]["Tables"]["landing_page_tests"]["Insert"];

// Supabase initializes Realtime with the client even though this script only uses PostgREST.
// Provide a never-used transport so Node.js 20 can run the seed without installing ws.
class DisabledRealtimeWebSocket {
  constructor() {
    throw new Error("Realtime is disabled for the landing-test seed script.");
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

function toConfigJson(test: LandingTestConfig): Json {
  return {
    offerId: test.offerId,
    sections: test.sections,
    faqItems: test.faqItems,
    ...test.configJson,
  };
}

function toLandingPageTestRow(test: LandingTestConfig): LandingPageTestInsert {
  return {
    id: test.id,
    slug: test.slug,
    status: test.status,
    internal_name: test.internalName,
    headline: test.headline,
    subheadline: test.subheadline,
    offer_type: test.offerType,
    price_cents: test.priceCents,
    currency: test.currency,
    price_display: test.priceDisplay,
    category_focus: test.categoryFocus,
    cta_primary: test.ctaPrimary,
    cta_secondary: test.ctaSecondary,
    modal_headline: test.modalHeadline,
    modal_body: test.modalBody,
    waitlist_cta: test.waitlistCta,
    hero_image_url: test.heroImageUrl,
    config_json: toConfigJson(test),
  };
}

async function seedLandingTests() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: DisabledRealtimeWebSocket as never,
    },
  });

  const slugs = landingPageTests.map((test) => test.slug);
  const { data: existingRows, error: existingError } = await supabase
    .from("landing_page_tests")
    .select("slug")
    .in("slug", slugs);

  if (existingError) {
    throw existingError;
  }

  const existingSlugs = new Set((existingRows ?? []).map((row) => row.slug));
  const rows = landingPageTests.map(toLandingPageTestRow);
  const { data: upsertedRows, error: upsertError } = await supabase
    .from("landing_page_tests")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug, status, internal_name")
    .order("slug", { ascending: true });

  if (upsertError) {
    throw upsertError;
  }

  console.log(`Seeded ${upsertedRows?.length ?? rows.length} landing-page tests.`);

  for (const test of landingPageTests) {
    const action = existingSlugs.has(test.slug) ? "updated" : "inserted";
    console.log(`${action}: ${test.slug} (${test.id})`);
  }
}

seedLandingTests().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed landing-page tests: ${message}`);
  process.exitCode = 1;
});
