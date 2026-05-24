import "server-only";

import { campaign001, campaign001Slug } from "@/lib/domain/campaigns/config";
import { commerceOfferSeeds, daypassCampaign001OfferCode } from "@/lib/domain/offers/config";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { CommerceOffer, Database, PromoCampaign } from "@/lib/types/database";

type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;
type PromoCampaignInsert = Database["public"]["Tables"]["promo_campaigns"]["Insert"];
type CommerceOfferInsert = Database["public"]["Tables"]["commerce_offers"]["Insert"];

const daypassCampaign001OfferSeed = commerceOfferSeeds.find((offer) => offer.code === daypassCampaign001OfferCode);

function readOptionalEnv(name: string) {
  return process.env[name]?.trim() || null;
}

async function getCampaignBySlugDirect(supabase: SupabaseAdminClient, slug: string) {
  const { data, error } = await supabase.from("promo_campaigns").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getOfferByCodeDirect(supabase: SupabaseAdminClient, code: string) {
  const { data, error } = await supabase.from("commerce_offers").select("*").eq("code", code).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function ensureCampaign001(supabase: SupabaseAdminClient): Promise<PromoCampaign> {
  const existingCampaign = await getCampaignBySlugDirect(supabase, campaign001Slug);

  if (existingCampaign) {
    return existingCampaign;
  }

  const campaignSeed: PromoCampaignInsert = {
    ...campaign001,
    status: "live",
  };
  const { data: insertedCampaign, error: insertError } = await supabase
    .from("promo_campaigns")
    .insert(campaignSeed)
    .select("*")
    .single();

  if (!insertError && insertedCampaign) {
    return insertedCampaign;
  }

  const racedCampaign = await getCampaignBySlugDirect(supabase, campaign001Slug);

  if (racedCampaign) {
    return racedCampaign;
  }

  throw new Error(insertError?.message ?? "Campaign 001 could not be created.");
}

async function ensureCampaign001DaypassOffer(supabase: SupabaseAdminClient): Promise<CommerceOffer> {
  if (!daypassCampaign001OfferSeed) {
    throw new Error("Campaign 001 Daypass offer seed is missing.");
  }

  const existingOffer = await getOfferByCodeDirect(supabase, daypassCampaign001OfferCode);

  if (existingOffer) {
    return existingOffer;
  }

  const configuredStripePriceId = readOptionalEnv("STRIPE_DAYPASS_PRICE_ID");
  const offerSeed: CommerceOfferInsert = {
    ...daypassCampaign001OfferSeed,
    stripe_price_id: configuredStripePriceId ?? daypassCampaign001OfferSeed.stripe_price_id ?? null,
  };
  const { data: insertedOffer, error: insertError } = await supabase
    .from("commerce_offers")
    .insert(offerSeed)
    .select("*")
    .single();

  if (!insertError && insertedOffer) {
    return insertedOffer;
  }

  const racedOffer = await getOfferByCodeDirect(supabase, daypassCampaign001OfferCode);

  if (racedOffer) {
    return racedOffer;
  }

  throw new Error(insertError?.message ?? "Campaign 001 Daypass offer could not be created.");
}

export async function ensureCampaign001CheckoutData() {
  const supabase = createAdminSupabaseClient();
  const campaign = await ensureCampaign001(supabase);
  const offer = await ensureCampaign001DaypassOffer(supabase);

  return {
    campaign,
    offer,
  };
}
