"use client";

import { getAttributionContext } from "@/lib/analytics/attribution";
import { captureMetaPixelEvent } from "@/lib/analytics/metaPixel";
import { capturePostHogEvent } from "@/lib/analytics/posthog";
import {
  isSupabaseLoggedEventName,
  type AnalyticsEventName,
  type AnalyticsEventPayload,
  type TrackEventProperties,
} from "@/lib/analytics/types";
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

function shouldSendToSupabase(eventName: AnalyticsEventName) {
  return isSupabaseLoggedEventName(eventName) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function sendToSupabase(payload: AnalyticsEventPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify(payload);

  void fetch("/api/events", {
    body,
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: body.length < 64000,
    method: "POST",
  }).catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[raphs:event:api_failed]", error);
    }
  });
}

export function trackEvent(eventName: AnalyticsEventName, properties: TrackEventProperties = {}) {
  const context = getAttributionContext();
  const payload: AnalyticsEventPayload = {
    ...context,
    event_name: eventName,
    lead_id: properties.lead_id ?? null,
    landing_page_id: properties.landing_page_id ?? null,
    landing_slug: properties.landing_slug ?? null,
    offer_id: properties.offer_id ?? null,
    offer_type: properties.offer_type ?? null,
    price_cents: properties.price_cents ?? null,
    currency: properties.currency ?? "AUD",
    properties: cleanProperties(properties),
  };

  if (typeof window !== "undefined") {
    window.__raphsEvents = [...(window.__raphsEvents ?? []), payload];
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[raphs:event]", payload);
  }

  capturePostHogEvent(payload);
  captureMetaPixelEvent(payload);

  if (shouldSendToSupabase(eventName)) {
    sendToSupabase(payload);
  }

  return payload;
}
