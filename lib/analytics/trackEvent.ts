import { getAttributionContext } from "@/lib/analytics/attribution";
import type { AnalyticsEventName, AnalyticsEventPayload, TrackEventProperties } from "@/lib/analytics/types";
import type { Json } from "@/lib/types/database";

declare global {
  interface Window {
    __raphsEvents?: AnalyticsEventPayload[];
  }
}

function cleanProperties(properties: TrackEventProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as Record<string, Json>;
}

export function trackEvent(eventName: AnalyticsEventName, properties: TrackEventProperties = {}) {
  const context = getAttributionContext();
  const payload: AnalyticsEventPayload = {
    ...context,
    event_name: eventName,
    landing_page_id: properties.landing_page_id ?? null,
    landing_slug: properties.landing_slug ?? null,
    offer_id: properties.offer_id ?? null,
    offer_type: properties.offer_type ?? null,
    price_cents: properties.price_cents ?? null,
    currency: properties.currency ?? null,
    properties: cleanProperties(properties),
  };

  if (typeof window !== "undefined") {
    window.__raphsEvents = [...(window.__raphsEvents ?? []), payload];
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[raphs:event]", payload);
  }

  return payload;
}
