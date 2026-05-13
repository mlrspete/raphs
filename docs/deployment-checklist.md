# Deployment Checklist

Use this before shipping a Vercel preview or production deploy for Raph's Market V0.

## Supabase

- [ ] Supabase project exists.
- [ ] All migrations in `supabase/migrations` are applied.
- [ ] `npm run seed:landing-tests` has been run against the target Supabase project.
- [ ] `/l/preview-pass`, `/l/monthly-pass`, and `/l/upgrade-access` return live pages.
- [ ] Supabase Auth admin user is created.
- [ ] `admin_profiles` row exists for the admin user's auth UUID.
- [ ] Row-level security is enabled and public writes still go through server routes only.

## Vercel Environment Variables

- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` if Meta Pixel is being tested.
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` if Turnstile is enabled.
- [ ] `TURNSTILE_SECRET_KEY` if Turnstile is enabled.

## Analytics And Compliance

- [ ] PostHog project is configured and receiving browser events.
- [ ] Supabase `event_logs` receives selected events from `/api/events`.
- [ ] Meta Pixel is configured only if needed for the preview.
- [ ] Turnstile is configured only if needed for the preview.
- [ ] Privacy page reviewed.
- [ ] Terms page reviewed.
- [ ] Meta ad readiness notes reviewed in `docs/meta-ad-readiness.md`.

## Smoke Test

- [ ] Public homepage loads with no broken images.
- [ ] Each seeded landing page loads.
- [ ] Paid-intent CTA opens the sold-out modal.
- [ ] Waitlist submission completes and shows the thank-you state.
- [ ] Test lead appears in Supabase and `/admin/leads`.
- [ ] Test events appear in Supabase and `/admin/events`.
- [ ] Events appear in PostHog when configured.
- [ ] Admin login works.
- [ ] Dashboard metrics are understandable.
- [ ] Landing tests, leads, events, funnels, and exports pages work.
- [ ] Leads CSV export downloads.
- [ ] Events CSV export downloads.
- [ ] Landing-test CSV export downloads.
- [ ] Mobile layout is acceptable at narrow breakpoints.
- [ ] Browser console has no errors indicating broken functionality.

## Guardrails

- [ ] No fake checkout, cart, payment, Stripe, product backend, seller tools, or member features are present.
- [ ] Demo data script is not run in production unless intentionally testing and cleanup is planned.
- [ ] Brand copy says Raph's Market.
- [ ] Market copy says Australia.
- [ ] Currency copy says AUD.
- [ ] Sold-out language is used for the modal and access-window messaging.
