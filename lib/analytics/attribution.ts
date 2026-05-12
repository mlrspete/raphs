import type { AttributionContext, AttributionTouch, DeviceType } from "@/lib/analytics/types";
import { getAnonymousId, getSessionId } from "@/lib/analytics/visitor";

const firstTouchKey = "raphs.attribution.first_touch";
const latestTouchKey = "raphs.attribution.latest_touch";

const paramAliases = {
  utm_source: ["utm_source"],
  utm_medium: ["utm_medium"],
  utm_campaign: ["utm_campaign"],
  utm_content: ["utm_content"],
  utm_term: ["utm_term"],
  fbclid: ["fbclid"],
  meta_campaign_id: ["meta_campaign_id", "campaign_id", "fb_campaign_id", "facebook_campaign_id"],
  meta_adset_id: ["meta_adset_id", "adset_id", "fb_adset_id", "facebook_adset_id"],
  meta_ad_id: ["meta_ad_id", "ad_id", "fb_ad_id", "facebook_ad_id"],
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

function readLocalStorage(key: string) {
  try {
    return isBrowser() ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Attribution can still be read from the current URL if persistence is unavailable.
  }
}

function readStoredTouch(key: string): AttributionTouch | null {
  const value = readLocalStorage(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AttributionTouch;
  } catch {
    return null;
  }
}

function firstParam(params: URLSearchParams, aliases: readonly string[]) {
  for (const alias of aliases) {
    const value = params.get(alias);

    if (value) {
      return value;
    }
  }

  return null;
}

function getCurrentPath() {
  if (!isBrowser()) {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function getReferrer() {
  if (!isBrowser()) {
    return null;
  }

  return document.referrer || null;
}

function getDeviceType(): DeviceType {
  if (!isBrowser()) {
    return "unknown";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/ipad|tablet/.test(userAgent)) {
    return "tablet";
  }

  if (/mobi|iphone|android/.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

function readTouchFromUrl() {
  if (!isBrowser()) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const touch: AttributionTouch = {
    utm_source: firstParam(params, paramAliases.utm_source),
    utm_medium: firstParam(params, paramAliases.utm_medium),
    utm_campaign: firstParam(params, paramAliases.utm_campaign),
    utm_content: firstParam(params, paramAliases.utm_content),
    utm_term: firstParam(params, paramAliases.utm_term),
    fbclid: firstParam(params, paramAliases.fbclid),
    meta_campaign_id: firstParam(params, paramAliases.meta_campaign_id),
    meta_adset_id: firstParam(params, paramAliases.meta_adset_id),
    meta_ad_id: firstParam(params, paramAliases.meta_ad_id),
    path: getCurrentPath(),
    referrer: getReferrer(),
    captured_at: new Date().toISOString(),
  };

  const hasAttribution = Object.entries(touch).some(([key, value]) => {
    return !["path", "referrer", "captured_at"].includes(key) && Boolean(value);
  });

  return hasAttribution ? touch : null;
}

export function captureAttributionFromUrl() {
  const urlTouch = readTouchFromUrl();

  if (!urlTouch) {
    return;
  }

  if (!readStoredTouch(firstTouchKey)) {
    writeLocalStorage(firstTouchKey, JSON.stringify(urlTouch));
  }

  writeLocalStorage(latestTouchKey, JSON.stringify(urlTouch));
}

export function getAttributionContext(): AttributionContext {
  captureAttributionFromUrl();

  const firstTouch = readStoredTouch(firstTouchKey);
  const latestTouch = readStoredTouch(latestTouchKey);
  const activeTouch = latestTouch ?? firstTouch;

  return {
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    path: getCurrentPath(),
    referrer: getReferrer(),
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    utm_source: activeTouch?.utm_source ?? null,
    utm_medium: activeTouch?.utm_medium ?? null,
    utm_campaign: activeTouch?.utm_campaign ?? null,
    utm_content: activeTouch?.utm_content ?? null,
    utm_term: activeTouch?.utm_term ?? null,
    fbclid: activeTouch?.fbclid ?? null,
    meta_campaign_id: activeTouch?.meta_campaign_id ?? null,
    meta_adset_id: activeTouch?.meta_adset_id ?? null,
    meta_ad_id: activeTouch?.meta_ad_id ?? null,
    first_touch: firstTouch,
    latest_touch: latestTouch,
  };
}
