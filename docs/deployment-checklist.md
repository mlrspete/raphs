# Deployment Checklist

Use this before shipping a Vercel preview or production deploy for Monroes.

## Supabase

- [ ] Supabase project exists.
- [ ] All migrations in `supabase/migrations` are applied.
- [ ] `npm run seed:landing-tests` has been run against the target Supabase project.
- [ ] `/l/preview-pass`, `/l/monthly-pass`, and `/l/upgrade-access` return live pages.
- [ ] Supabase Auth admin user is created.
- [ ] `admin_profiles` row exists for the admin user's auth UUID.
- [ ] Supabase Auth sender is `Monroes <contact@monroes.au>` or fallback `Monroes <access@monroes.au>`.
- [ ] Supabase Auth Site URL is the production domain: `https://raphs.vercel.app` now, then `https://monroes.au` after the permanent domain is connected.
- [ ] Supabase Auth Redirect URLs include `https://raphs.vercel.app/auth/callback`.
- [ ] Supabase Auth Redirect URLs include `https://raphs.vercel.app/auth/confirm`.
- [ ] Supabase Auth Redirect URLs include `https://monroes.au/auth/callback` when the permanent domain is connected.
- [ ] Supabase Auth Redirect URLs include `https://monroes.au/auth/confirm` when the permanent domain is connected.
- [ ] Localhost auth URLs are kept only for local development, such as `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/confirm`.
- [ ] Supabase Confirm Signup and Magic Link templates use `{{ .ConfirmationURL }}` for the auth email link.
- [ ] Supabase auth email templates do not use `{{ .SiteURL }}/member` as the auth email link.
- [ ] Member secure-link email is sent by Monroes transactional email, not the hosted Supabase email sender.
- [ ] Row-level security is enabled and public writes still go through server routes only.

## Member Auth Email

Member sign-in uses `supabase.auth.admin.generateLink` from a server route, then sends the generated `/auth/confirm?token_hash=...&type=magiclink` link and `email_otp` code through Resend. Required production env vars:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `TRANSACTIONAL_EMAIL_FROM`

Set these in Vercel for the Production environment, then redeploy the latest production deployment. Vercel does not apply newly-added environment variables to an already-running deployment.

Keep Supabase hosted Confirm Signup and Magic Link templates on `{{ .ConfirmationURL }}` as a fallback, and do not use `{{ .SiteURL }}/member` as the auth email link. If test members receive the default `noreply@mail.app.supabase.io` email, the deployed app is still running the old client-side `signInWithOtp` flow or the Monroes transactional email env vars are missing.

The app does not impose a client-side resend cooldown. Supabase or Resend can still reject repeated requests at the provider level, so during support tell users to use only the newest email and request one fresh email after a short pause.

## Vercel Environment Variables

- [ ] `NEXT_PUBLIC_APP_URL` is `https://raphs.vercel.app` for current production and `https://monroes.au` after the permanent domain is connected.
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `TRANSACTIONAL_EMAIL_FROM`
- [ ] `SUPPORT_EMAIL`
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
- [ ] Member secure-link email includes a 6-digit secure code that can be pasted into `/member/login`.
- [ ] Member secure-link email opens `https://raphs.vercel.app/auth/confirm` in current production and redirects to `/member` after sign-in.
- [ ] Local member secure-link email opens `http://localhost:3000/auth/confirm` only during local development.
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
- [ ] Brand copy says Monroes.
- [ ] Market copy says Australia.
- [ ] Currency copy says AUD.
- [ ] Sold-out language is used for the modal and access-window messaging.
