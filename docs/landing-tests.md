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
