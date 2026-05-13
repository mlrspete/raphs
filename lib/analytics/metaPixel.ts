"use client";

import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics/types";

type MetaPixelEvent = {
  method: "track" | "trackCustom";
  name: string;
};

type FbqFunction = {
  (method: "init", pixelId: string): void;
  (method: "track" | "trackCustom", eventName: string, properties?: Record<string, unknown>): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

const mappedEvents: Partial<Record<AnalyticsEventName, MetaPixelEvent>> = {
  paid_intent_clicked: {
    method: "trackCustom",
    name: "PaidIntentClicked",
  },
  sold_out_modal_opened: {
    method: "trackCustom",
    name: "SoldOutModalOpened",
  },
  waitlist_submitted: {
    method: "track",
    name: "Lead",
  },
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: Window["fbq"];
  }
}

let initialized = false;

function getPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || null;
}

function ensureMetaPixel() {
  if (typeof window === "undefined") {
    return false;
  }

  if (initialized) {
    return Boolean(window.fbq && getPixelId());
  }

  const pixelId = getPixelId();

  if (!pixelId) {
    return false;
  }

  const existingFbq = window.fbq;

  if (!existingFbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    }) as FbqFunction;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  window.fbq?.("init", pixelId);
  initialized = true;
  return true;
}

export function captureMetaPixelEvent(payload: AnalyticsEventPayload) {
  const mappedEvent = mappedEvents[payload.event_name];

  if (!mappedEvent || !ensureMetaPixel()) {
    return;
  }

  window.fbq?.(mappedEvent.method, mappedEvent.name, {
    content_name: payload.event_name,
    content_category: payload.offer_type ?? payload.landing_slug ?? "access_list",
    currency: payload.currency ?? "AUD",
    landing_slug: payload.landing_slug,
    lead_id: payload.lead_id,
    offer_id: payload.offer_id,
    offer_type: payload.offer_type,
    value: typeof payload.price_cents === "number" ? payload.price_cents / 100 : undefined,
  });
}
