# Event Taxonomy

Raph's Market V0 sends behavioural analytics to PostHog when `NEXT_PUBLIC_POSTHOG_KEY` is configured. Selected high-value events are also sent to `/api/events` and written to Supabase `event_logs` with first-party attribution.

## Shared Payload

Events should include, where available:

- `anonymous_id`
- `session_id`
- `lead_id`
- `landing_page_id`
- `landing_slug`
- `offer_id`
- `offer_type`
- `price_cents`
- `currency`
- `path`
- `url`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- `meta_campaign_id`
- `meta_adset_id`
- `meta_ad_id`
- `device_type`
- `timestamp`
- `properties`

## Events

| Event | Meaning | Supabase |
| --- | --- | --- |
| `homepage_viewed` | Public homepage rendered in the browser. | Yes |
| `landing_viewed` | A seeded `/l/[slug]` landing page rendered in the browser. | Yes |
| `cta_impression` | A paid-intent CTA became visible. | No |
| `paid_intent_clicked` | User clicked a paid-access CTA. | Yes |
| `offer_intent_clicked` | User clicked a CTA tied to a specific offer. | Yes |
| `sold_out_modal_opened` | Sold-out access modal opened after intent click. | Yes |
| `sold_out_modal_closed` | Sold-out access modal closed. | No |
| `waitlist_form_started` | User focused or submitted the waitlist form. | Yes |
| `waitlist_submitted` | Waitlist form saved successfully. | Yes |
| `waitlist_failed` | Waitlist form failed validation, network, or server save. | Yes |
| `budget_selected` | User selected a budget range in the waitlist form. | Yes |
| `category_selected` | User selected a deck era/category preference. | Yes |
| `brand_interest_added` | User entered favourite brand interests. | Yes |
| `inventory_card_clicked` | User clicked a deck/media card. | Yes |
| `pricing_viewed` | Pricing section became visible. | Yes |
| `faq_opened` | User opened an FAQ item. | Yes |
| `social_clicked` | User clicked a social outbound link. | Yes |
| `external_link_clicked` | User clicked a non-social outbound link. | Yes |

## Transport Rules

- PostHog receives every event from `trackEvent` when PostHog env vars are configured.
- Supabase receives only the events marked `Yes` above.
- Unknown event names and unsupported Supabase event names are rejected by `/api/events`.
- Meta Pixel and Conversions API are not part of this milestone.
