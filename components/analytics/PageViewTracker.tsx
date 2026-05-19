"use client";

import { useEffect, useRef } from "react";

import type { AnalyticsEventName, TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";

type PageViewTrackerProps = {
  eventName: Extract<
    AnalyticsEventName,
    "homepage_viewed" | "landing_viewed" | "member_dashboard_viewed" | "member_listings_viewed"
  >;
  properties?: TrackEventProperties;
};

export function PageViewTracker({ eventName, properties = {} }: PageViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    trackEvent(eventName, properties);
  }, [eventName, properties]);

  return null;
}
