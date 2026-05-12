"use client";

import posthog from "posthog-js";

import type { AnalyticsEventPayload } from "@/lib/analytics/types";

let initialized = false;

function getPostHogConfig() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) {
    return null;
  }

  return {
    key,
    host: host || "https://us.i.posthog.com",
  };
}

export function initPostHog() {
  if (typeof window === "undefined") {
    return null;
  }

  const config = getPostHogConfig();

  if (!config) {
    return null;
  }

  if (!initialized) {
    posthog.init(config.key, {
      api_host: config.host,
      capture_pageleave: false,
      capture_pageview: false,
    });
    initialized = true;
  }

  return posthog;
}

export function capturePostHogEvent(payload: AnalyticsEventPayload) {
  const client = initPostHog();

  if (!client) {
    return;
  }

  client.capture(payload.event_name, {
    ...payload.properties,
    anonymous_id: payload.anonymous_id,
    currency: payload.currency,
    device_type: payload.device_type,
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
    referrer: payload.referrer,
    session_id: payload.session_id,
    timestamp: payload.timestamp,
    url: payload.url,
    utm_campaign: payload.utm_campaign,
    utm_content: payload.utm_content,
    utm_medium: payload.utm_medium,
    utm_source: payload.utm_source,
    utm_term: payload.utm_term,
  });
}
