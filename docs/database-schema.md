# Database Schema

Milestone 1 adds the initial Supabase Postgres foundation for Raph's Market V0:

- `admin_profiles`
- `landing_page_tests`
- `waitlist_leads`
- `lead_preferences`
- `event_logs`
- `visitor_sessions`
- `export_logs`

Milestone 7 adds a focused follow-up migration for waitlist attribution fields that were not part of the initial schema:

- `waitlist_leads.offer_id`
- `waitlist_leads.offer_type`
- `waitlist_leads.price_cents`
- `waitlist_leads.currency`
- `waitlist_leads.fbclid`
- `waitlist_leads.path`
- `waitlist_leads.referrer`
- `waitlist_leads.device_type`

Milestone 8 adds `event_logs.fbclid` so selected raw events can retain click ID attribution alongside UTM and Meta ad identifiers.

The migration enables row level security on every table. Public clients do not get read or insert policies. Waitlist and event writes are intended to go through future server routes that use server-side validation and, where appropriate, the service-role client.

Authenticated admin users can read dashboard data only when their Supabase Auth user ID has a matching row in `admin_profiles`.

## Applying Migrations

Create the Supabase project first, then set the project environment values locally and in Vercel when Supabase-backed routes are introduced.

Manual dashboard path:

1. Open the Supabase project dashboard.
2. Go to SQL Editor.
3. Open each file in `supabase/migrations/` in filename order.
4. Paste the full migration into the SQL Editor.
5. Run each migration once against the target project.

Supabase CLI path, if the CLI is installed and linked:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Notes

- `waitlist_leads.email_normalized` is `not null` and has a unique index named `waitlist_leads_email_normalized_unique`.
- `waitlist_leads.consent_marketing_at` stores the timestamp for marketing consent capture.
- `/api/waitlist` uses the service-role client server-side to upsert duplicate-safe leads by `email_normalized`.
- `/api/events` uses the service-role client server-side to insert selected raw event logs after Zod validation.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only and must never be exposed with a `NEXT_PUBLIC_` prefix.
- The `supabase/seed/` folder is a placeholder only; no landing-page test data is seeded in this milestone.
