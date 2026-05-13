# Code-Seeded Landing Tests

Raph's Market V0 landing-page tests are defined in code and synced into Supabase. There is no admin CMS/editor for this stage.

## Files

- `lib/landing-tests/types.ts` defines the TypeScript shape for each test.
- `lib/landing-tests/config.ts` contains the seeded test definitions and stable database IDs.
- `scripts/seed-landing-tests.ts` upserts the config into `landing_page_tests` by `slug`.
- `scripts/seed-demo-data.ts` can add fake local/staging event and lead data for QA dashboards.

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

7. Confirm `/l/<new-slug>` renders and its CTA opens the sold-out modal.
8. Submit a test waitlist lead and confirm the lead and events appear in admin.
9. Deploy the app after the seeded config is reviewed.

## Required Local Environment

The landing-test seed script loads `.env.local` through Next's env loader and requires:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Milestone 1 migrations must be applied before running the script. Run the seed command twice when testing; the second run should update the same rows by `slug` without creating duplicates.

## Optional Demo QA Data

For local or staging dashboards, run the guarded demo data seed after landing tests are seeded:

```bash
SEED_DEMO_DATA_CONFIRM=local-or-staging npm run seed:demo-data
```

On Windows PowerShell:

```powershell
$env:SEED_DEMO_DATA_CONFIRM="local-or-staging"; npm run seed:demo-data
```

The demo script:

- Refuses to run when `VERCEL_ENV=production`.
- Uses fake non-routable `raphs-market.test` email addresses.
- Upserts fake `waitlist_leads` by `email_normalized`.
- Deletes and recreates only demo `event_logs` with `utm_source=demo_seed` and `utm_campaign=demo_qa_seed`.
- Seeds preference rows for the fake leads so test result summaries have data.

Do not run demo data in production unless you are intentionally testing production analytics and have agreed to clean it up afterward.

## Public Route Behavior

Milestone 4 adds `app/l/[slug]/page.tsx`.

- `/l/[slug]` fetches the matching `landing_page_tests` row from Supabase server-side.
- Only rows with `status = 'live'` render publicly.
- Missing rows and non-live statuses return 404.
- Page metadata uses the landing headline plus `Raph's Market`; the description uses the row subheadline when present.
- CTA buttons open the sold-out modal and pass landing, offer, AUD price, and event context into tracking.
- Waitlist submissions write to `waitlist_leads`, selected events write to `event_logs`, and PostHog receives browser analytics when configured.
- No checkout, cart, payments, real membership login, CMS, or inventory backend is included in V0.

Apply `supabase/migrations/20260512000001_allow_public_live_landing_tests.sql` before testing public routes against Supabase. The migration allows anon reads for live landing-page tests only.

The public route uses the server-safe anon Supabase client, so it needs:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

It does not use `SUPABASE_SERVICE_ROLE_KEY` for public reads.

## Confirm In Dashboard

After seeding and testing a landing page:

1. Open `/admin/tests` and confirm the seeded page appears.
2. Open `/admin/events` and filter by the landing page to confirm `landing_viewed`, `paid_intent_clicked`, and `sold_out_modal_opened`.
3. Open `/admin/leads` and confirm the submitted test lead appears with the expected slug, AUD offer context, and attribution.
4. Open `/admin/funnels` and confirm the funnel counts move through view, paid intent, modal opened, form started, and waitlist submitted.
5. Export leads and events CSVs from `/admin/exports` for a quick end-to-end check.
