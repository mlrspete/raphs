"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/trackEvent";

const socialHosts = ["facebook.com", "instagram.com", "tiktok.com", "youtube.com", "x.com"];

function getExternalUrl(href: string) {
  try {
    return new URL(href, window.location.href);
  } catch {
    return null;
  }
}

function isExternal(url: URL) {
  return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) && url.host !== window.location.host;
}

function getSocialPlatform(url: URL, anchor: HTMLAnchorElement) {
  if (anchor.dataset.socialPlatform) {
    return anchor.dataset.socialPlatform;
  }

  return socialHosts.find((host) => url.hostname.includes(host)) ?? null;
}

export function OutboundLinkTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");

      if (!anchor) {
        return;
      }

      const url = getExternalUrl(anchor.href);

      if (!url || !isExternal(url)) {
        return;
      }

      const socialPlatform = getSocialPlatform(url, anchor);

      trackEvent(socialPlatform ? "social_clicked" : "external_link_clicked", {
        href: url.href,
        link_text: anchor.textContent?.trim() ?? null,
        social_platform: socialPlatform,
      });
    }

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
