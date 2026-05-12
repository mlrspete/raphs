# Code-Seeded Landing Tests

Raph's Market V0 landing-page tests are defined in code and synced into Supabase. There is no admin CMS/editor for this stage.

## Files

- `lib/landing-tests/types.ts` defines the TypeScript shape for each test.
- `lib/landing-tests/config.ts` contains the seeded test definitions and stable database IDs.
- `scripts/seed-landing-tests.ts` upserts the config into `landing_page_tests` by `slug`.

## Current Seeded Tests

- `preview-pass` - 1-Day Preview Pass, `$4.99 AUD`, `preview_pass`
- `monthly-pass` - Monthly Marketplace Pass, `$24.99 AUD/month`, `monthly_pass`
- `upgrade-access` - Preview-to-monthly upgrade, `$20 AUD upgrade`, `upgrade_pass`

Seeded public tests should use `status: "live"`. Draft, paused, archived, and missing tests return 404 on the public route.

Each config includes the default sold-out modal copy:

- Headline: `Today's access passes are sold out`
- Body: `The current Raph's Market preview batch has sold out. Join the list and we'll email you when the next access window opens.`
- CTA: `Join the access list`

The runtime config uses typographic apostrophes via escaped Unicode in source.

## Create A New Landing Test

1. Open `lib/landing-tests/config.ts`.
2. Duplicate one existing object in `landingPageTests`.
3. Give it a new stable UUID in `id`.
4. Change `slug`, `internalName`, copy, price, offer fields, category focus, and image URL if needed.
5. Keep `currency: "AUD"`.
6. Run the seed script locally:

```bash
npm run seed:landing-tests
```

7. Deploy the app after the seeded config is reviewed.

## Required Local Environment

The seed script loads `.env.local` through Next's env loader and requires:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Milestone 1 migrations must be applied before running the script. Run the seed command twice when testing; the second run should update the same rows by `slug` without creating duplicates.

## Public Route Behavior

Milestone 4 adds `app/l/[slug]/page.tsx`.

- `/l/[slug]` fetches the matching `landing_page_tests` row from Supabase server-side.
- Only rows with `status = 'live'` render publicly.
- Missing rows and non-live statuses return 404.
- Page metadata uses the landing headline plus `Raph's Market`; the description uses the row subheadline when present.
- CTA buttons are rendered with stable `data-landing-cta`, `data-landing-slug`, `data-offer-id`, and `data-offer-type` attributes for later modal and event work.
- No waitlist submission, event tracking, checkout, cart, CMS, or inventory backend is included yet.

Apply `supabase/migrations/20260512000001_allow_public_live_landing_tests.sql` before testing public routes against Supabase. The migration allows anon reads for live landing-page tests only.

The public route uses the server-safe anon Supabase client, so it needs:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

It does not use `SUPABASE_SERVICE_ROLE_KEY` for public reads.
