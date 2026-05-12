"use client";

import type { ReactNode } from "react";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";

import { initPostHog } from "@/lib/analytics/posthog";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  initPostHog();

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
