import type { Json } from "@/lib/types/database";

export const analyticsEventNames = [
  "homepage_viewed",
  "landing_viewed",
  "member_dashboard_viewed",
  "member_listings_viewed",
  "listing_filter_changed",
  "listing_viewed",
  "checkout_started",
  "checkout_redirected",
  "checkout_failed",
  "order_created",
  "checkout_completed",
  "order_fulfilled",
  "access_grant_created",
  "daypass_code_created",
  "daypass_code_redeemed",
  "promo_entry_issued",
  "cta_impression",
  "paid_intent_clicked",
  "offer_intent_clicked",
  "sold_out_modal_opened",
  "sold_out_modal_closed",
  "waitlist_form_started",
  "waitlist_submitted",
  "waitlist_failed",
  "budget_selected",
  "category_selected",
  "brand_interest_added",
  "inventory_card_clicked",
  "pricing_viewed",
  "faq_opened",
  "social_clicked",
  "external_link_clicked",
] as const;

export const supabaseLoggedEventNames = [
  "homepage_viewed",
  "landing_viewed",
  "member_dashboard_viewed",
  "member_listings_viewed",
  "listing_filter_changed",
  "listing_viewed",
  "checkout_started",
  "checkout_redirected",
  "checkout_failed",
  "order_created",
  "checkout_completed",
  "order_fulfilled",
  "access_grant_created",
  "daypass_code_created",
  "daypass_code_redeemed",
  "promo_entry_issued",
  "paid_intent_clicked",
  "offer_intent_clicked",
  "sold_out_modal_opened",
  "waitlist_form_started",
  "waitlist_submitted",
  "waitlist_failed",
  "budget_selected",
  "category_selected",
  "brand_interest_added",
  "inventory_card_clicked",
  "pricing_viewed",
  "faq_opened",
  "social_clicked",
  "external_link_clicked",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type SupabaseLoggedEventName = (typeof supabaseLoggedEventNames)[number];

export function isSupabaseLoggedEventName(eventName: AnalyticsEventName): eventName is SupabaseLoggedEventName {
  return (supabaseLoggedEventNames as readonly string[]).includes(eventName);
}

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export type AttributionTouch = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  path: string;
  referrer: string | null;
  captured_at: string;
};

export type AttributionContext = {
  anonymous_id: string;
  session_id: string;
  path: string;
  url: string;
  referrer: string | null;
  device_type: DeviceType;
  timestamp: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  first_touch: AttributionTouch | null;
  latest_touch: AttributionTouch | null;
};

export type EventEntityProperties = {
  lead_id?: string | null;
  landing_page_id?: string | null;
  landing_slug?: string | null;
  offer_id?: string | null;
  offer_type?: string | null;
  price_cents?: number | null;
  currency?: string | null;
};

export type TrackEventProperties = EventEntityProperties &
  Record<string, Json | undefined>;

export type AnalyticsEventPayload = AttributionContext &
  EventEntityProperties & {
    event_name: AnalyticsEventName;
    properties: Record<string, Json>;
  };
