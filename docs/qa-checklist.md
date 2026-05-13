# QA Checklist

Use this for local, staging, and Vercel preview review of Raph's Market V0.

## Public Funnel

- [ ] Homepage works on desktop.
- [ ] Homepage works on mobile.
- [ ] `/l/preview-pass` works.
- [ ] `/l/monthly-pass` works.
- [ ] `/l/upgrade-access` works.
- [ ] Missing landing page shows a branded unavailable state.
- [ ] Paid-intent CTA opens the sold-out modal.
- [ ] Sold-out modal can be closed by button, backdrop, and Escape.
- [ ] Waitlist form validates required email and consent.
- [ ] Failed waitlist submit shows a clear retryable error state.
- [ ] Successful waitlist submit shows the thank-you state.
- [ ] No payment, checkout, cart, or membership flow appears.

## Tracking

- [ ] `homepage_viewed` fires.
- [ ] `landing_viewed` fires for each seeded landing page.
- [ ] `paid_intent_clicked` fires from homepage and landing CTAs.
- [ ] `sold_out_modal_opened` fires.
- [ ] `waitlist_form_started` fires.
- [ ] `waitlist_submitted` fires after a successful lead.
- [ ] `waitlist_failed` fires for validation or server failures.
- [ ] Supabase `event_logs` receives expected selected events.
- [ ] PostHog receives browser events when configured.
- [ ] Meta Pixel is quiet when not configured and active only when configured.

## Admin

- [ ] Admin login works.
- [ ] Non-admin users are denied.
- [ ] Overview metrics load.
- [ ] Empty admin data state is understandable.
- [ ] Landing-test metrics load.
- [ ] Leads page loads.
- [ ] No leads state is understandable.
- [ ] Events page loads.
- [ ] No events state is understandable.
- [ ] Funnels page loads.
- [ ] CSV export page loads.
- [ ] Leads CSV downloads.
- [ ] Events CSV downloads.
- [ ] Landing-test CSV downloads.

## Mobile Breakpoints

- [ ] 320px width has no horizontal page overflow outside intentional admin tables.
- [ ] Hero CTAs are tappable and do not overflow.
- [ ] Landing-page price text wraps cleanly.
- [ ] Sold-out modal fits within the viewport and scrolls internally.
- [ ] Waitlist fields are readable and tappable.
- [ ] Admin nav scrolls horizontally on small screens.
- [ ] Admin tables show the horizontal scroll hint.
- [ ] Admin filter and export buttons stack cleanly.

## Copy And Market Fit

- [ ] Brand is Raph's Market.
- [ ] Market is Australia.
- [ ] Currency is AUD.
- [ ] Sold-out modal language is used.
- [ ] No stale launch-timing modal language remains.
- [ ] Privacy and terms pages match the V0 demand-validation scope.
