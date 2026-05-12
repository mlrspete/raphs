# Analytics Foundation

Milestone 6 added first-party visitor/session attribution and local event tracking. Milestone 8 connects the same `trackEvent` helper to PostHog and selected Supabase event logging.

## Browser Identity

- `anonymous_id` is generated without personal information and persisted in localStorage plus a first-party cookie.
- `session_id` is stored in sessionStorage and rotates after 30 minutes of inactivity or a new browser session.

## Attribution

`getAttributionContext()` lives in `lib/analytics/attribution.ts`.

It captures and persists first-touch and latest-touch values for:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- `meta_campaign_id`
- `meta_adset_id`
- `meta_ad_id`

The helper also returns path, URL, referrer, device type, timestamp, anonymous ID, and session ID. Waitlist and event capture reuse this helper instead of re-parsing attribution.

## Events

`trackEvent(eventName, properties)` lives in `lib/analytics/trackEvent.ts`.

It now:

- builds a typed event payload with attribution context
- appends the payload to `window.__raphsEvents`
- logs to `console.debug` only in development
- sends every event to PostHog when `NEXT_PUBLIC_POSTHOG_KEY` is configured
- sends selected high-value events to `/api/events` when Supabase public env is configured

No production console spam is included. Meta Pixel and Conversions API remain intentionally unimplemented.
