import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";
import { normalizeEmail, splitFavouriteBrands, type WaitlistSubmission } from "@/lib/validation/waitlist";

type WaitlistLeadInsert = Database["public"]["Tables"]["waitlist_leads"]["Insert"];
type LeadPreferenceInsert = Database["public"]["Tables"]["lead_preferences"]["Insert"];

const preferenceTypes = [
  "favourite_brand",
  "preferred_category",
  "budget_range",
  "buyer_seller_intent",
  "likelihood_to_buy",
] as const;

function buildPreferenceRows(leadId: string, submission: WaitlistSubmission): LeadPreferenceInsert[] {
  const rows: LeadPreferenceInsert[] = [];

  for (const brand of splitFavouriteBrands(submission.favouriteBrands)) {
    rows.push({
      lead_id: leadId,
      preference_type: "favourite_brand",
      preference_value: brand,
    });
  }

  if (submission.preferredCategory) {
    rows.push({
      lead_id: leadId,
      preference_type: "preferred_category",
      preference_value: submission.preferredCategory,
    });
  }

  if (submission.budgetRange) {
    rows.push({
      lead_id: leadId,
      preference_type: "budget_range",
      preference_value: submission.budgetRange,
    });
  }

  if (submission.buyerSellerIntent) {
    rows.push({
      lead_id: leadId,
      preference_type: "buyer_seller_intent",
      preference_value: submission.buyerSellerIntent,
    });
  }

  if (submission.likelihoodToBuy) {
    rows.push({
      lead_id: leadId,
      preference_type: "likelihood_to_buy",
      preference_value: submission.likelihoodToBuy,
    });
  }

  return rows;
}

export async function upsertWaitlistLead(submission: WaitlistSubmission) {
  const supabase = createAdminSupabaseClient();
  const consentTimestamp = new Date().toISOString();
  const email = submission.email.trim();
  const emailNormalized = normalizeEmail(email);
  const leadPayload: WaitlistLeadInsert = {
    email,
    email_normalized: emailNormalized,
    first_name: submission.firstName,
    source_landing_page_id: submission.context.landingPageId,
    source_slug: submission.context.landingSlug,
    anonymous_id: submission.attribution.anonymous_id,
    session_id: submission.attribution.session_id,
    utm_source: submission.attribution.utm_source,
    utm_medium: submission.attribution.utm_medium,
    utm_campaign: submission.attribution.utm_campaign,
    utm_content: submission.attribution.utm_content,
    utm_term: submission.attribution.utm_term,
    meta_campaign_id: submission.attribution.meta_campaign_id,
    meta_adset_id: submission.attribution.meta_adset_id,
    meta_ad_id: submission.attribution.meta_ad_id,
    offer_id: submission.context.offerId,
    offer_type: submission.context.offerType,
    price_cents: submission.context.priceCents,
    currency: submission.context.currency,
    fbclid: submission.attribution.fbclid,
    path: submission.attribution.path,
    referrer: submission.attribution.referrer,
    device_type: submission.attribution.device_type,
    budget_range: submission.budgetRange,
    buyer_seller_intent: submission.buyerSellerIntent,
    likelihood_to_buy: submission.likelihoodToBuy,
    consent_marketing: true,
    consent_marketing_at: consentTimestamp,
    privacy_version: submission.privacyVersion,
    updated_at: consentTimestamp,
  };

  const { data, error } = await supabase
    .from("waitlist_leads")
    .upsert(leadPayload, { onConflict: "email_normalized" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save waitlist lead.");
  }

  const preferenceRows = buildPreferenceRows(data.id, submission);
  const { error: deleteError } = await supabase
    .from("lead_preferences")
    .delete()
    .eq("lead_id", data.id)
    .in("preference_type", [...preferenceTypes]);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (preferenceRows.length > 0) {
    const { error: insertError } = await supabase.from("lead_preferences").insert(preferenceRows);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    leadId: data.id,
  };
}
