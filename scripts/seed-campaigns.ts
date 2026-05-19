import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import { campaign001, campaignSeeds } from "../lib/domain/campaigns/config";
import { commerceOfferSeeds, daypassCampaign001OfferCode } from "../lib/domain/offers/config";
import type { Database } from "../lib/types/database";

type CommerceOfferInsert = Database["public"]["Tables"]["commerce_offers"]["Insert"];
type PromoCampaignInsert = Database["public"]["Tables"]["promo_campaigns"]["Insert"];

// Supabase initializes Realtime with the client even though this script only uses PostgREST.
// Provide a never-used transport so Node.js 20 can run the seed without installing ws.
class DisabledRealtimeWebSocket {
  constructor() {
    throw new Error("Realtime is disabled for the V1 campaign seed script.");
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

function readOptionalEnv(name: string) {
  return process.env[name]?.trim() || null;
}

async function seedCampaigns() {
  const supabase = createSeedClient();
  const campaignSlugs = campaignSeeds.map((campaign) => campaign.slug);
  const offerCodes = commerceOfferSeeds.map((offer) => offer.code);

  const [{ data: existingCampaignRows, error: existingCampaignsError }, { data: existingOfferRows, error: existingOffersError }] =
    await Promise.all([
      supabase.from("promo_campaigns").select("slug, status").in("slug", campaignSlugs),
      supabase.from("commerce_offers").select("code, status, stripe_price_id").in("code", offerCodes),
    ]);

  if (existingCampaignsError) {
    throw existingCampaignsError;
  }

  if (existingOffersError) {
    throw existingOffersError;
  }

  const existingCampaignsBySlug = new Map((existingCampaignRows ?? []).map((campaign) => [campaign.slug, campaign]));
  const existingOffersByCode = new Map((existingOfferRows ?? []).map((offer) => [offer.code, offer]));
  const campaignRows: PromoCampaignInsert[] = campaignSeeds.map((campaign) => ({
    ...campaign,
    status: existingCampaignsBySlug.get(campaign.slug)?.status ?? campaign.status,
  }));
  const offerRows: CommerceOfferInsert[] = commerceOfferSeeds.map((offer) => {
    const existingOffer = existingOffersByCode.get(offer.code);
    const configuredStripePriceId =
      offer.code === daypassCampaign001OfferCode ? readOptionalEnv("STRIPE_DAYPASS_PRICE_ID") : null;

    return {
      ...offer,
      status: existingOffer?.status ?? offer.status,
      stripe_price_id: configuredStripePriceId ?? offer.stripe_price_id ?? existingOffer?.stripe_price_id ?? null,
    };
  });

  const { data: upsertedCampaignRows, error: campaignUpsertError } = await supabase
    .from("promo_campaigns")
    .upsert(campaignRows, { onConflict: "slug" })
    .select("id, slug, status, name")
    .order("slug", { ascending: true });

  if (campaignUpsertError) {
    throw campaignUpsertError;
  }

  const { data: upsertedOfferRows, error: offerUpsertError } = await supabase
    .from("commerce_offers")
    .upsert(offerRows, { onConflict: "code" })
    .select("id, code, status, name, stripe_price_id")
    .order("code", { ascending: true });

  if (offerUpsertError) {
    throw offerUpsertError;
  }

  const campaign001Row = upsertedCampaignRows?.find((campaign) => campaign.slug === campaign001.slug);

  if (!campaign001Row) {
    throw new Error("Campaign 001 was not returned after upsert.");
  }

  const { data: existingCounter, error: existingCounterError } = await supabase
    .from("promo_campaign_entry_counters")
    .select("campaign_id, last_entry_number")
    .eq("campaign_id", campaign001Row.id)
    .maybeSingle();

  if (existingCounterError) {
    throw existingCounterError;
  }

  if (!existingCounter) {
    const { error: counterInsertError } = await supabase.from("promo_campaign_entry_counters").insert({
      campaign_id: campaign001Row.id,
      last_entry_number: 0,
    });

    if (counterInsertError) {
      throw counterInsertError;
    }
  }

  console.log(`Seeded ${upsertedCampaignRows?.length ?? campaignRows.length} promo campaign(s).`);

  for (const campaign of campaignRows) {
    const action = existingCampaignsBySlug.has(campaign.slug) ? "updated" : "inserted";
    console.log(`${action}: ${campaign.slug} (${campaign.status})`);
  }

  console.log(`Seeded ${upsertedOfferRows?.length ?? offerRows.length} commerce offer(s).`);

  for (const offer of offerRows) {
    const action = existingOffersByCode.has(offer.code) ? "updated" : "inserted";
    const stripeState = offer.stripe_price_id ? "stripe price configured" : "stripe price pending";
    console.log(`${action}: ${offer.code} (${offer.status}, ${stripeState})`);
  }

  if (existingCounter) {
    console.log(`entry counter preserved: ${campaign001.slug} last_entry_number=${existingCounter.last_entry_number}`);
  } else {
    console.log(`entry counter inserted: ${campaign001.slug} last_entry_number=0`);
  }
}

seedCampaigns().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed V1 campaigns/offers: ${message}`);
  process.exitCode = 1;
});
