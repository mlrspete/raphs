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
- [ ] Supabase Auth Redirect URLs include `https://monroes.au/auth/callback` when the permanent domain is connected.
- [ ] Localhost callback URLs are kept only for local development, such as `http://localhost:3000/auth/callback`.
- [ ] Supabase Confirm Signup and Magic Link templates use `{{ .ConfirmationURL }}` for the auth email link.
- [ ] Supabase auth email templates do not use `{{ .SiteURL }}/member` as the auth email link.
- [ ] Supabase sign-in email template uses the Monroes copy in the section below.
- [ ] Row-level security is enabled and public writes still go through server routes only.

## Supabase Auth Email Template

Configure the hosted Supabase sign-in email template with this copy:

- Subject: `Sign in to Monroes`
- Preview/preheader: `Use this secure link to finish signing in.`
- Heading: `Confirm your Monroes sign-in`
- Body: `Use the secure link below to sign in to Monroes with this email address.`
- Button: `Sign in to Monroes`
- Footer/helper text: `This link is for your email only and will expire automatically. If you did not request this email, you can ignore it.`

Use `{{ .ConfirmationURL }}` as the button/link URL in both the Confirm Signup and Magic Link templates. Include the fallback one-time code `{{ .Token }}` in the member sign-in email copy so users can paste the 6-digit code if the one-click link is expired, pre-consumed, or opened in the wrong browser. Do not use `{{ .SiteURL }}/member`, because that bypasses the app callback route and can strand users on `/member#error=access_denied&error_code=otp_expired` when a secure link expires or is pre-consumed. The Supabase URL configuration must include `https://raphs.vercel.app/auth/callback`; add `https://monroes.au/auth/callback` when the permanent domain is connected.

Supabase Auth rate-limits secure-link sends per email address and can also rate-limit project email sending, especially with the built-in Supabase email sender. Use custom SMTP before production member login testing, or repeated test sends may show `over_email_send_rate_limit` even after the per-user window passes. During support, tell users to wait a few minutes, avoid repeated clicks, and use only the newest email.

## Vercel Environment Variables

- [ ] `NEXT_PUBLIC_APP_URL` is `https://raphs.vercel.app` for current production and `https://monroes.au` after the permanent domain is connected.
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
- [ ] Member secure-link email opens `https://raphs.vercel.app/auth/callback` in current production and redirects to `/member` after sign-in.
- [ ] Local member secure-link email opens `http://localhost:3000/auth/callback` only during local development.
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
