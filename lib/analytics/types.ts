import type { Json } from "@/lib/types/database";

export type AnalyticsEventName =
  | "homepage_viewed"
  | "landing_viewed"
  | "cta_impression"
  | "paid_intent_clicked"
  | "offer_intent_clicked"
  | "sold_out_modal_opened"
  | "sold_out_modal_closed"
  | "waitlist_form_started"
  | "waitlist_submitted"
  | "waitlist_failed"
  | "budget_selected"
  | "category_selected"
  | "brand_interest_added"
  | "inventory_card_clicked"
  | "pricing_viewed"
  | "faq_opened"
  | "social_clicked"
  | "external_link_clicked";

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
