"use client";

import type { TrackEventProperties } from "@/lib/analytics/types";
import { trackEvent } from "@/lib/analytics/trackEvent";

type TrackedFAQItemProps = {
  question: string;
  answer: string;
  location: string;
  properties?: TrackEventProperties;
};

export function TrackedFAQItem({ question, answer, location, properties = {} }: TrackedFAQItemProps) {
  return (
    <details
      className="group p-5 open:bg-peach/35 sm:p-6"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          trackEvent("faq_opened", {
            ...properties,
            faq_question: question,
            faq_location: location,
          });
        }
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-black text-ink">
        <span>{question}</span>
        <span className="text-2xl leading-none text-orange transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-ink/70">{answer}</p>
    </details>
  );
}
