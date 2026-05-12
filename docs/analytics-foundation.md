# Analytics Foundation

Milestone 6 adds first-party visitor/session attribution and local event tracking only. No events are sent to PostHog, Supabase, Meta, or any external service yet.

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

The helper also returns path, referrer, device type, timestamp, anonymous ID, and session ID. The next waitlist milestone should use this helper when creating leads.

## Events

`trackEvent(eventName, properties)` lives in `lib/analytics/trackEvent.ts`.

For now it:

- builds a typed event payload with attribution context
- appends the payload to `window.__raphsEvents`
- logs to `console.debug` only in development

No production console spam and no network transport are included.
