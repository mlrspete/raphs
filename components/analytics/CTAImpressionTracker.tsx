"use client";

import { useEffect, useRef } from "react";

import type { AnalyticsEventName, TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";

type CTAImpressionTrackerProps = {
  eventName?: Extract<AnalyticsEventName, "cta_impression" | "pricing_viewed">;
  properties?: TrackEventProperties;
};

export function CTAImpressionTracker({ eventName = "cta_impression", properties = {} }: CTAImpressionTrackerProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const marker = markerRef.current;

    if (!marker || trackedRef.current) {
      return;
    }

    function trackOnce() {
      if (trackedRef.current) {
        return;
      }

      trackedRef.current = true;
      trackEvent(eventName, properties);
    }

    if (!("IntersectionObserver" in window)) {
      trackOnce();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          trackOnce();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(marker);

    return () => observer.disconnect();
  }, [eventName, properties]);

  return <span aria-hidden="true" className="block h-px w-px" ref={markerRef} />;
}
