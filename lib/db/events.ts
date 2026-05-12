import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/types/database";
import type { EventPayload } from "@/lib/validation/events";

type EventLogInsert = Database["public"]["Tables"]["event_logs"]["Insert"];

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

export async function insertEventLog(payload: EventPayload) {
  const supabase = createAdminSupabaseClient();
  const eventLog: EventLogInsert = {
    anonymous_id: payload.anonymous_id,
    currency: payload.currency,
    device_type: payload.device_type,
    event_name: payload.event_name,
    fbclid: payload.fbclid,
    landing_page_id: payload.landing_page_id,
    landing_slug: payload.landing_slug,
    lead_id: payload.lead_id,
    meta_ad_id: payload.meta_ad_id,
    meta_adset_id: payload.meta_adset_id,
    meta_campaign_id: payload.meta_campaign_id,
    offer_id: payload.offer_id,
    offer_type: payload.offer_type,
    path: payload.path,
    price_cents: payload.price_cents,
    properties: toJson({
      ...payload.properties,
      client_timestamp: payload.timestamp,
    }),
    referrer: payload.referrer,
    session_id: payload.session_id,
    url: payload.url,
    utm_campaign: payload.utm_campaign,
    utm_content: payload.utm_content,
    utm_medium: payload.utm_medium,
    utm_source: payload.utm_source,
    utm_term: payload.utm_term,
  };

  const { data, error } = await supabase.from("event_logs").insert(eventLog).select("id").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert event log.");
  }

  return {
    eventId: data.id,
  };
}
