import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { landingPageTests } from "../lib/landing-tests/config";
import type { Database, Json } from "../lib/types/database";
import { normalizeEmail, waitlistPrivacyVersion } from "../lib/validation/waitlist";

type EventLogInsert = Database["public"]["Tables"]["event_logs"]["Insert"];
type LeadPreferenceInsert = Database["public"]["Tables"]["lead_preferences"]["Insert"];
type LandingPageTestRow = Pick<
  Database["public"]["Tables"]["landing_page_tests"]["Row"],
  "id" | "slug" | "offer_type" | "price_cents" | "currency" | "price_display" | "internal_name" | "config_json"
>;
type WaitlistLeadInsert = Database["public"]["Tables"]["waitlist_leads"]["Insert"];

const demoCampaign = "demo_qa_seed";
const demoSource = "demo_seed";
const requiredConfirmation = "local-or-staging";

loadEnvConfig(process.cwd());

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertSafeEnvironment() {
  if (process.env.SEED_DEMO_DATA_CONFIRM !== requiredConfirmation) {
    throw new Error(`Set SEED_DEMO_DATA_CONFIRM=${requiredConfirmation} to seed fake local/staging demo data.`);
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed demo data while VERCEL_ENV=production.");
  }
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function getOfferId(test: LandingPageTestRow) {
  if (typeof test.config_json !== "object" || test.config_json === null || Array.isArray(test.config_json)) {
    return null;
  }

  return typeof test.config_json.offerId === "string" ? test.config_json.offerId : null;
}

function buildEventRows(test: LandingPageTestRow, index: number): EventLogInsert[] {
  const funnelEvents = [
    "landing_viewed",
    "landing_viewed",
    "landing_viewed",
    "paid_intent_clicked",
    "sold_out_modal_opened",
    "waitlist_form_started",
    "waitlist_submitted",
  ];

  return funnelEvents.map((eventName, eventIndex) => {
    const visitorIndex = eventIndex % 3;

    return {
      anonymous_id: `demo_anon_${test.slug}_${visitorIndex + 1}`,
      created_at: hoursAgo(index * 18 + eventIndex + 2),
      currency: test.currency,
      device_type: visitorIndex === 0 ? "mobile" : "desktop",
      event_name: eventName,
      landing_page_id: test.id,
      landing_slug: test.slug,
      offer_id: getOfferId(test),
      offer_type: test.offer_type,
      path: `/l/${test.slug}`,
      price_cents: test.price_cents,
      properties: toJson({
        demo_seed: true,
        event_context: eventIndex < 3 ? "demo_page_view" : "demo_funnel_step",
        price_display: test.price_display,
      }),
      referrer: "https://example.test/demo-referrer",
      session_id: `demo_session_${test.slug}_${visitorIndex + 1}`,
      url: `https://raphs-market.example.test/l/${test.slug}?utm_source=${demoSource}&utm_campaign=${demoCampaign}`,
      utm_campaign: demoCampaign,
      utm_content: `demo_variant_${index + 1}`,
      utm_medium: "qa",
      utm_source: demoSource,
    };
  });
}

function buildLeadRow(test: LandingPageTestRow, index: number): WaitlistLeadInsert {
  const email = `demo+${test.slug}@raphs-market.test`;
  const now = hoursAgo(index * 18 + 1);

  return {
    anonymous_id: `demo_anon_${test.slug}_1`,
    budget_range: index === 0 ? "150_300" : index === 1 ? "300_600" : "600_plus",
    buyer_seller_intent: index === 1 ? "buyer" : "both",
    consent_marketing: true,
    consent_marketing_at: now,
    created_at: now,
    currency: test.currency,
    device_type: index === 0 ? "mobile" : "desktop",
    email,
    email_normalized: normalizeEmail(email),
    fbclid: null,
    first_name: "Demo",
    likelihood_to_buy: index === 2 ? "very_likely" : "likely",
    offer_id: getOfferId(test),
    offer_type: test.offer_type,
    path: `/l/${test.slug}`,
    price_cents: test.price_cents,
    privacy_version: waitlistPrivacyVersion,
    referrer: "https://example.test/demo-referrer",
    session_id: `demo_session_${test.slug}_1`,
    source_landing_page_id: test.id,
    source_slug: test.slug,
    updated_at: now,
    utm_campaign: demoCampaign,
    utm_content: `demo_variant_${index + 1}`,
    utm_medium: "qa",
    utm_source: demoSource,
  };
}

function buildPreferenceRows(leadId: string, index: number): LeadPreferenceInsert[] {
  const category = index === 0 ? "80s_90s" : index === 1 ? "artist_graphics" : "brand_archives";
  const brand = index === 0 ? "Powell Peralta" : index === 1 ? "Girl" : "Alien Workshop";

  return [
    { lead_id: leadId, preference_type: "preferred_category", preference_value: category },
    { lead_id: leadId, preference_type: "favourite_brand", preference_value: brand },
  ];
}

async function seedDemoData() {
  assertSafeEnvironment();

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const seededSlugs = landingPageTests.map((test) => test.slug);
  const { data: tests, error: testsError } = await supabase
    .from("landing_page_tests")
    .select("id, slug, offer_type, price_cents, currency, price_display, internal_name, config_json")
    .in("slug", seededSlugs)
    .order("slug", { ascending: true });

  if (testsError) {
    throw testsError;
  }

  if (!tests || tests.length !== seededSlugs.length) {
    throw new Error("Seed landing tests first with npm run seed:landing-tests, then rerun the demo data seed.");
  }

  const { error: deleteEventsError } = await supabase
    .from("event_logs")
    .delete()
    .eq("utm_source", demoSource)
    .eq("utm_campaign", demoCampaign);

  if (deleteEventsError) {
    throw deleteEventsError;
  }

  const leadIds: string[] = [];

  for (const [index, test] of tests.entries()) {
    const { data: lead, error: leadError } = await supabase
      .from("waitlist_leads")
      .upsert(buildLeadRow(test, index), { onConflict: "email_normalized" })
      .select("id")
      .single();

    if (leadError || !lead) {
      throw new Error(leadError?.message ?? `Failed to seed demo lead for ${test.slug}.`);
    }

    leadIds.push(lead.id);

    const { error: eventsError } = await supabase.from("event_logs").insert(buildEventRows(test, index));

    if (eventsError) {
      throw eventsError;
    }
  }

  const { error: deletePreferencesError } = await supabase.from("lead_preferences").delete().in("lead_id", leadIds);

  if (deletePreferencesError) {
    throw deletePreferencesError;
  }

  const preferenceRows = leadIds.flatMap((leadId, index) => buildPreferenceRows(leadId, index));
  const { error: preferenceError } = await supabase.from("lead_preferences").insert(preferenceRows);

  if (preferenceError) {
    throw preferenceError;
  }

  console.log(`Seeded demo QA data for ${tests.length} landing tests.`);
  console.log(`Inserted ${tests.length * 7} fake event logs and upserted ${tests.length} fake waitlist leads.`);
  console.log("Demo emails use the non-routable raphs-market.test domain.");
}

seedDemoData().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed demo data: ${message}`);
  process.exitCode = 1;
});
