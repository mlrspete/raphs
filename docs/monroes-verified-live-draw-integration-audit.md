# Monroes Verified Live Draw Integration Audit + Build Blueprint

> This report is an audit and build blueprint only. It does not implement the live draw feature. Findings are labelled as Confirmed, Likely, or Unknown. Sensitive data is intentionally redacted.

## Decision-critical findings

Finding: The current purchase-to-entry path can answer basic successful-payment eligibility from `promo_entries` linked to `promo_campaigns`, `orders`, `order_items`, `daypass_codes`, `member_profiles`, and Stripe checkout/webhook IDs.
Confidence: Confirmed.
Evidence: `app/api/checkout/daypass/route.ts`, `app/api/stripe/webhook/route.ts`, `lib/domain/payments/createCheckoutSession.ts`, `lib/domain/payments/fulfillCheckout.ts`, `lib/domain/access/grantAccess.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.
Why it matters for the live draw build: V1 should treat fulfilled, active `promo_entries` as the canonical internal entry ledger instead of deriving entries directly from Stripe at draw time.

Finding: The Stripe webhook currently processes only `checkout.session.completed`; refund, dispute, chargeback, checkout expiration, and payment-failure events are received as ignored events if delivered to this endpoint.
Confidence: Confirmed.
Evidence: `app/api/stripe/webhook/route.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `app/refund-policy/page.tsx`, `app/admin/(dashboard)/campaigns/page.tsx`.
Why it matters for the live draw build: Draw eligibility cannot rely on current Stripe automation alone for refunds or disputes; V1 needs either automated event handlers or a locked manual reconciliation procedure before manifest creation.

Finding: Admin draw operations are already server-protected and exposed through an existing `/admin/draws` workflow, so V1 should extend the current admin area rather than create a separate operator surface.
Confidence: Confirmed.
Evidence: `lib/auth/admin.ts`, `app/admin/(dashboard)/layout.tsx`, `components/admin/AdminNav.tsx`, `app/admin/(dashboard)/draws/page.tsx`, `app/api/admin/draws/lock/route.ts`, `app/api/admin/draws/snapshot/route.ts`, `app/api/admin/draws/result/route.ts`.
Why it matters for the live draw build: The safest integration path is to add verified-draw preview/lock/execute/publish controls to the existing admin shell and reuse the current server-side admin gate.

Finding: The existing draw model is manual and incomplete for verified live draw proof: it stores snapshot hash/count and a manual winning entry, but not randomness proof, deterministic ranking, full elimination order, final-20 replay data, public verifier payloads, or immutable draw-run state.
Confidence: Confirmed.
Evidence: `draw_snapshots` and `draw_results` in `supabase/migrations/20260519000000_create_lean_v1_schema.sql`; `lib/domain/draws/createDrawSnapshot.ts`; `lib/domain/draws/recordDrawResult.ts`.
Why it matters for the live draw build: The biggest database gap is not eligibility; it is verifiable draw-run state and public auditability.

Finding: Verified Live Draw V1 needs new draw-run tables/artifacts for locked manifest rows, public-safe manifest hashes, randomness proofs, deterministic ranking, replay events, public verification records, and append-only audit events.
Confidence: Likely.
Evidence: Current repo has `promo_entries`, `draw_snapshots`, and `draw_results`, but lacks fields/tables for randomness source/proof, algorithm version, full ranking, replay event sequence, and public verifier records in `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.
Why it matters for the live draw build: The feature should not be implemented as a manual winning-entry form; it needs immutable draw execution artifacts that can be recomputed later.

Finding: The recommended V1 randomness approach is drand as the primary public beacon with Random.org Signed API as the operational fallback, both stored with full proof metadata before deterministic ranking.
Confidence: Likely.
Evidence: drand HTTP/API docs and protocol docs describe public beacon rounds, signatures, and verification; Random.org Signed API docs describe signed true random values, signature verification, and result retrieval.
Why it matters for the live draw build: Randomness must be verifiable after the draw and must not be chosen or rerolled by the operator after seeing the manifest or result.

Finding: The public reveal should be a stored replay, not a live randomizer: a 2D/2.5D elimination board plus final-20 race should read from `draw_results`/`draw_replay_events` after deterministic ranking is already generated.
Confidence: Likely.
Evidence: `package.json` includes GSAP but no Three.js/React Three Fiber; `components/marketing/ScrollReveal.tsx` shows a reduced-motion pattern; Section 9 recommends `draw_replay_events` generated from stored ranking.
Why it matters for the live draw build: This keeps V1 engaging without implying the animation chooses, alters, or influences the winner.

Finding: A new `/account/entries` route is not required for the first build; the existing `/member` dashboard already shows entry numbers, aliases, statuses, purchases, codes, and draw timing.
Confidence: Confirmed.
Evidence: `app/member/page.tsx`, `components/member/PromoEntriesCard.tsx`, `components/member/DrawProcessCard.tsx`, `components/member/MemberOrderHistory.tsx`, `components/member/DaypassCodeList.tsx`.
Why it matters for the live draw build: V1 should focus on the verified draw engine, public reveal, public verification page, and admin controls; account-entry route expansion can be deferred unless product navigation changes.

Finding: Public result/privacy copy already avoids entrant emails, full names, payment identifiers, access codes, and private purchaser information, but it does not explicitly cover future public race displays of aliases, entry numbers, initials, or final-20 boards.
Confidence: Confirmed.
Evidence: `app/promo-rules/[slug]/page.tsx`, `app/draw-results/[slug]/page.tsx`, `app/privacy/page.tsx`, `components/member/PromoEntriesCard.tsx`, `lib/domain/draws/buildEligibleEntriesCsv.ts`.
Why it matters for the live draw build: V1 needs explicit privacy-safe public display rules and a separate public manifest schema with entry number, display alias, row hash, and no PII/payment/code secrets.

Finding: Promotion/legal copy is explicitly not launch-final, and no no-purchase/free-entry pathway was found in the current repo copy or routes.
Confidence: Confirmed.
Evidence: `lib/domain/campaigns/config.ts`, `lib/domain/campaigns/publicContent.ts`, `app/promo-rules/[slug]/page.tsx`, `app/terms/page.tsx`, repo search for `no purchase`, `free entry`, and `purchase necessary`.
Why it matters for the live draw build: Verified Live Draw V1 should not launch publicly until final trade-promotion terms, permit/authority needs, no-purchase-entry requirements, and operational rules are approved.

## 0. Executive summary

Current readiness for Verified Live Draw V1: 6/10.

The current Monroes build has a solid foundation for a verified live draw: Next.js App Router, Supabase Auth, server-only Supabase admin helpers, Stripe Checkout fulfillment, durable `promo_entries`, campaign timing fields, admin order/entry/code/draw pages, public rules/result pages, PostHog/event logging, and early snapshot hashing logic are already present.

The stack can support the feature. The main gap is that the existing draw workflow is manual and audit-light: it can lock entries, hash a CSV snapshot, and record a manual winning entry, but it does not yet store public randomness proof, deterministic ranking, full result order, replay events, public verification records, or a dedicated immutable draw audit trail.

Biggest blockers:

- Final legal/compliance position is not ready: no no-purchase/free-entry path was found, promotion copy still has launch-final placeholders, and winner/public display terms need approval.
- Stripe refund/dispute/payment reversal handling is not automated enough for draw eligibility; V1 needs either event handling or a strict pre-lock reconciliation process.
- New draw-run database objects and RLS/public redaction design are required before implementation.
- Randomness provider integration and deterministic ranking/verifier logic are new infrastructure.

Biggest unknowns:

- Live Supabase project state and live Stripe Dashboard products/prices/webhook subscriptions were not available through the active tool surface.
- Final operator/legal decisions for entry quantities, no-purchase entry, prize count, winner publication, and public manifest/ranking visibility remain open.
- Production scale, traffic profile, and expected entry count are not yet confirmed.

Recommended first implementation: verified draw engine + public elimination board + final 20 race reveal + public verification/audit page. Do not start with final-20 race only because it would hide too much of the entrant pool and weaken the public-audit story. Do not attempt full entrant animation because it adds performance and trust risk without improving verification.

Recommended next action: make the legal/operator decisions in Section 18, then build the data model/migrations and eligibility snapshot service before any animation work.

## 1. Current build summary

Finding: Framework and package structure are Next.js 15, React 19, TypeScript, Tailwind CSS, npm/package-lock, and App Router under `app/`.
Confidence: Confirmed.
Evidence: `package.json`, `package-lock.json`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `next.config.ts`.
Implication for Verified Live Draw V1: Build public draw room, verification page, and admin draw tooling as App Router pages/route handlers using the existing TypeScript/Tailwind conventions.

Finding: Key public frontend routes include homepage, campaign landing pages, promo rules, draw results, checkout success/cancel, redeem, member dashboard, member listings, and legal pages.
Confidence: Confirmed.
Evidence: `app/page.tsx`, `app/l/[slug]/page.tsx`, `app/promo-rules/[slug]/page.tsx`, `app/draw-results/[slug]/page.tsx`, `app/redeem/page.tsx`, `app/member/page.tsx`, `app/member/listings/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/refund-policy/page.tsx`.
Implication for Verified Live Draw V1: New routes should fit beside existing campaign/result routes, likely as campaign-scoped draw room and verification routes.

Finding: Backend/API structure uses Next route handlers under `app/api`, with server-only domain modules in `lib/domain`, database/report helpers in `lib/db`, and API validation with Zod.
Confidence: Confirmed.
Evidence: `app/api/checkout/daypass/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/events/route.ts`, `app/api/waitlist/route.ts`, `app/api/admin/draws/*`, `lib/domain/*`, `lib/db/*`, `lib/validation/*`.
Implication for Verified Live Draw V1: Put deterministic draw generation and manifest verification logic in server-only domain modules, then expose only narrow public/admin route handlers.

Finding: Supabase Auth is used for both members and admins; members sign in with OTP magic links, admins sign in with password, and admin authorization is gated by `admin_profiles`.
Confidence: Confirmed.
Evidence: `components/member/MemberAuthForm.tsx`, `app/auth/callback/route.ts`, `components/admin/AdminLoginForm.tsx`, `lib/auth/admin.ts`, `app/admin/(dashboard)/layout.tsx`, `supabase/migrations/20260512000000_create_core_schema.sql`.
Implication for Verified Live Draw V1: Admin draw controls should stay behind the existing admin profile gate; public verification should not require auth.

Finding: Supabase usage is split into browser client, server auth client, server anon client, and service-role admin client helpers.
Confidence: Confirmed.
Evidence: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`.
Implication for Verified Live Draw V1: Privileged draw operations should use `createAdminSupabaseClient()` only in server-only contexts; browser/client code should only receive public-safe draw artifacts.

Finding: Stripe Checkout is used for Daypass purchases, with order creation before checkout, webhook idempotency, fulfillment, member access grants, friend Daypass codes, promo entries, and transactional email hooks.
Confidence: Confirmed.
Evidence: `lib/domain/payments/stripe.ts`, `app/api/checkout/daypass/route.ts`, `app/api/stripe/webhook/route.ts`, `lib/domain/payments/fulfillCheckout.ts`, `lib/domain/orders/createPendingOrder.ts`, `lib/domain/access/grantAccess.ts`.
Implication for Verified Live Draw V1: Draw eligibility can be based on fulfilled order/order item/promo entry state and should not rely on client-side checkout redirects.

Finding: The current promotion/giveaway system centers on Campaign 001, Daypass offers, friend codes, `promo_entries`, draw lock timing, and promo rules pages.
Confidence: Confirmed.
Evidence: `lib/domain/campaigns/config.ts`, `lib/domain/campaigns/publicContent.ts`, `lib/domain/offers/config.ts`, `lib/domain/promo-entries/createPromoEntries.ts`, `app/promo-rules/[slug]/page.tsx`, `components/landing/CampaignRulesSummary.tsx`.
Implication for Verified Live Draw V1: V1 should parameterize by campaign slug/id and reuse campaign timing fields such as `entries_close_at`, `draw_lock_at`, and `draw_at`.

Finding: Existing hashing/snapshot logic creates an eligible entries CSV ordered by entry number, hashes it with SHA-256, stores the hash/count, and validates current locked CSV hash before recording results or downloading CSV.
Confidence: Confirmed.
Evidence: `lib/domain/draws/buildEligibleEntriesCsv.ts`, `lib/domain/draws/hashCsvSha256.ts`, `lib/domain/draws/createDrawSnapshot.ts`, `lib/domain/draws/recordDrawResult.ts`, `lib/domain/draws/getDrawSnapshotCsv.ts`.
Implication for Verified Live Draw V1: The manifest-canonicalisation idea already exists, but the current CSV includes internal emails and IDs, so a separate public manifest/verifier artifact is needed.

Finding: Admin/member/account systems are already broad: admin overview, campaigns, orders, entries, codes, draws, exports, events/funnels/tests/leads, plus member dashboard and listings access.
Confidence: Confirmed.
Evidence: `components/admin/AdminNav.tsx`, `app/admin/(dashboard)/*/page.tsx`, `app/member/page.tsx`, `app/member/listings/page.tsx`, `lib/db/admin-v1-reports.ts`.
Implication for Verified Live Draw V1: Admin draw pages can extend the existing admin shell and reports, while member-facing entry visibility can extend the current member dashboard cards.

Finding: Analytics/event tracking uses client-side PostHog and Meta Pixel plus server-side Supabase event logging for selected event names.
Confidence: Confirmed.
Evidence: `app/providers.tsx`, `lib/analytics/posthog.ts`, `lib/analytics/metaPixel.ts`, `lib/analytics/trackEvent.ts`, `lib/analytics/types.ts`, `app/api/events/route.ts`.
Implication for Verified Live Draw V1: Add draw room view, elimination progress, race reveal, verifier view, and admin draw events to the existing analytics/event-log model.

Finding: Deployment/config assumptions are minimal in repo config: `next.config.ts` is empty, app URLs are read from `NEXT_PUBLIC_APP_URL` with localhost fallback, and scripts reference `VERCEL_ENV` to prevent production demo seeding.
Confidence: Confirmed.
Evidence: `next.config.ts`, `app/layout.tsx`, `lib/domain/payments/stripe.ts`, `lib/domain/email/resend.ts`, `scripts/seed-demo-data.ts`.
Implication for Verified Live Draw V1: Public verification URLs and webhook/callback URLs should use the same `NEXT_PUBLIC_APP_URL` convention; production operational safeguards should consider `VERCEL_ENV`/environment-specific controls.

## 2. Relevant existing systems we can reuse

System: Supabase client helpers.
Confidence: Confirmed.
Where found: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`.
What it currently does: Provides browser auth client, server auth client with cookies, server anon client, and server-only service-role admin client.
How it can be reused for Verified Live Draw V1: Use existing server-only/admin patterns for locking, snapshot creation, deterministic draw persistence, and private audit operations.
Risks/limitations: Service-role usage must never move into client components; public draw APIs need explicit redaction and narrow response shapes.

System: Supabase Auth member/admin model.
Confidence: Confirmed.
Where found: `components/member/MemberAuthForm.tsx`, `components/admin/AdminLoginForm.tsx`, `lib/auth/admin.ts`, `app/auth/callback/route.ts`, `supabase/migrations/20260512000000_create_core_schema.sql`.
What it currently does: Members authenticate by OTP email; admins authenticate by password and must have an `admin_profiles` row.
How it can be reused for Verified Live Draw V1: Protect draw setup/result controls with existing admin auth and show member-specific entries in account pages.
Risks/limitations: Admin role is binary in repo evidence; finer draw operator permissions are not confirmed.

System: Member profiles.
Confidence: Confirmed.
Where found: `lib/domain/members/getCurrentMemberProfile.ts`, `lib/domain/members/upsertMemberProfileForAuthUser.ts`, `lib/domain/members/getOrCreateMemberProfileByEmail.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.
What it currently does: Links checkout/member emails to profile records and optionally Supabase Auth users.
How it can be reused for Verified Live Draw V1: Use member profile IDs as private owner/current-holder references while exposing only public aliases and entry numbers.
Risks/limitations: Public verification must avoid exposing emails, normalized emails, profile IDs, and auth user IDs.

System: Orders, order items, and Stripe Checkout records.
Confidence: Confirmed.
Where found: `app/api/checkout/daypass/route.ts`, `app/api/stripe/webhook/route.ts`, `lib/domain/orders/createPendingOrder.ts`, `lib/domain/payments/createCheckoutSession.ts`, `lib/domain/payments/fulfillCheckout.ts`.
What it currently does: Creates pending orders, sends customers to Stripe Checkout, records sanitized webhook receipts, and fulfills paid Daypass orders.
How it can be reused for Verified Live Draw V1: Treat fulfilled, non-refunded/cancelled campaign-linked orders as an upstream eligibility signal for promo entries.
Risks/limitations: Refund/cancellation consequences are described as operator-defined in admin copy; automation for entry status changes after refunds was not confirmed in this milestone.

System: Daypass code generation, hashing, encryption, and redemption.
Confidence: Confirmed.
Where found: `lib/domain/daypass-codes/generateDaypassCodes.ts`, `lib/domain/daypass-codes/hashCode.ts`, `lib/domain/daypass-codes/encryption.ts`, `lib/domain/daypass-codes/redeemDaypassCode.ts`, `app/api/daypass/redeem/route.ts`, `supabase/migrations/20260519003000_create_daypass_redemption_rpc.sql`.
What it currently does: Generates friend Daypass codes, stores hashes/last-four/encrypted values, grants access on redemption, and can update promo entry holder attribution before draw lock.
How it can be reused for Verified Live Draw V1: Preserve existing attribution semantics and ensure the draw manifest uses post-lock `current_holder_member_profile_id` values.
Risks/limitations: Full codes, hashes, encrypted payloads, and purchaser data are private and must not appear in public verification artifacts.

System: Campaign and offer metadata.
Confidence: Confirmed.
Where found: `lib/domain/campaigns/config.ts`, `lib/domain/campaigns/publicContent.ts`, `lib/domain/campaigns/queries.ts`, `lib/domain/offers/config.ts`, `lib/domain/campaigns/ensureCampaign001CheckoutData.ts`.
What it currently does: Defines Campaign 001, public content, timing fields, Daypass offer data, and checkout seeding fallback.
How it can be reused for Verified Live Draw V1: Use campaign records for draw timing, public copy, campaign-scoped routes, and eligibility windows.
Risks/limitations: Campaign 001 seed data is draft and contains placeholders; final prize proof/timing/legal values remain unconfirmed from repo evidence.

System: Promo entries ledger.
Confidence: Confirmed.
Where found: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`, `lib/domain/members/summaries.ts`, `app/admin/(dashboard)/entries/page.tsx`.
What it currently does: Stores campaign entry numbers, public aliases, owner/current-holder/referrer context, status, Daypass code link, and lock timestamp.
How it can be reused for Verified Live Draw V1: This is the natural source for the locked entrant manifest and elimination/ranking display.
Risks/limitations: Current internal exports include PII; public manifest construction needs a redacted canonical schema.

System: Draw lock, snapshot, hash, and result workflow.
Confidence: Confirmed.
Where found: `lib/domain/draws/lockCampaignEntries.ts`, `lib/domain/draws/buildEligibleEntriesCsv.ts`, `lib/domain/draws/createDrawSnapshot.ts`, `lib/domain/draws/hashCsvSha256.ts`, `lib/domain/draws/recordDrawResult.ts`, `app/admin/(dashboard)/draws/page.tsx`.
What it currently does: Locks active entries after `draw_lock_at`, builds an eligible CSV, stores SHA-256 and count, validates hash before result recording, and stores manual result details.
How it can be reused for Verified Live Draw V1: Reuse lock and snapshot validation as a base, then add deterministic seeded ranking, public randomness evidence, all-entry result ordering, and replay data.
Risks/limitations: Current result model does not store randomness seed, algorithm version, full ranking, elimination order, final 20 ordering, or public verifier inputs.

System: Public draw result route.
Confidence: Confirmed.
Where found: `app/draw-results/[slug]/page.tsx`, `lib/domain/draws/getDrawResultByCampaign.ts`.
What it currently does: Displays eligible count, entry range, winning entry number, winner alias, snapshot timestamp/hash, draw method, and public notes.
How it can be reused for Verified Live Draw V1: This can evolve into or link to a richer public verification/audit page.
Risks/limitations: It currently lacks manifest hash inputs, randomness source/seed, algorithm details, deterministic re-run instructions, and downloadable public-safe verification data.

System: Admin dashboard shell and operational pages.
Confidence: Confirmed.
Where found: `components/admin/AdminShell.tsx`, `components/admin/AdminNav.tsx`, `components/admin/MetricCard.tsx`, `components/admin/TableScrollHint.tsx`, `app/admin/(dashboard)/*/page.tsx`.
What it currently does: Provides private navigation, metrics cards, filters, tables, CSV export buttons, and draw workflow UI.
How it can be reused for Verified Live Draw V1: Add draw room preparation, publish controls, verifier artifact generation, dry-run/preview status, and operational safeguards inside existing admin patterns.
Risks/limitations: Current admin draw page uses form posts and manual entry; richer draw tooling may need more explicit state machines and idempotency checks.

System: Member dashboard entry and draw cards.
Confidence: Confirmed.
Where found: `app/member/page.tsx`, `components/member/PromoEntriesCard.tsx`, `components/member/DrawProcessCard.tsx`, `components/member/MemberOrderHistory.tsx`, `components/member/DaypassCodeList.tsx`.
What it currently does: Shows member access, orders, codes, promo entries, and draw timing/process.
How it can be reused for Verified Live Draw V1: Extend member account pages to show locked entry status, public aliases, entry numbers, and links to draw room/verification pages.
Risks/limitations: Member views should not expose other entrants, private IDs, email addresses, or internal CSV content.

System: Legal, policy, and promo rules pages.
Confidence: Confirmed.
Where found: `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/refund-policy/page.tsx`, `app/promo-rules/[slug]/page.tsx`, `lib/domain/campaigns/publicContent.ts`.
What it currently does: Describes access products, promotions, privacy, refunds, entry mechanics, snapshot hashes, transparent draws, and launch review caveats.
How it can be reused for Verified Live Draw V1: Use these pages as the source for final draw mechanics, verification copy, privacy disclosures, and public audit language.
Risks/limitations: Several sections explicitly require final legal/operator review and placeholder replacement before launch.

System: Analytics and event logging.
Confidence: Confirmed.
Where found: `lib/analytics/types.ts`, `lib/analytics/trackEvent.ts`, `lib/analytics/posthog.ts`, `lib/analytics/metaPixel.ts`, `app/api/events/route.ts`, `lib/db/events.ts`.
What it currently does: Captures page, checkout, order, promo entry, draw snapshot, draw completion, CTA, and funnel events to PostHog/Meta Pixel/Supabase where configured.
How it can be reused for Verified Live Draw V1: Add events for draw room views, live board progress, final 20 reveal views, verification downloads/views, and admin publish actions.
Risks/limitations: Analytics payloads must not include PII, full access codes, code hashes, encrypted code payloads, or private verification manifests.

System: UI components and design patterns.
Confidence: Confirmed.
Where found: `components/landing/LivePromotionProgressSection.tsx`, `components/landing/LandingPageRenderer.tsx`, `components/admin/MetricCard.tsx`, `components/admin/EmptyState.tsx`, `components/member/PromoEntriesCard.tsx`, `components/listings/*`.
What it currently does: Provides card, table, metric, progress, dashboard, landing, and member list patterns.
How it can be reused for Verified Live Draw V1: Use existing visual vocabulary for progress boards, draw status, verification metrics, and admin/member support views.
Risks/limitations: Live elimination/race interactions are not currently implemented; V1 animation components will need new UI while staying visually consistent.

System: Transactional email infrastructure.
Confidence: Confirmed.
Where found: `lib/domain/email/resend.ts`, `lib/domain/email/sendOrderConfirmationEmail.ts`, `lib/domain/email/sendCodeRedeemedEmail.ts`, `lib/domain/email/templates.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.
What it currently does: Sends/records order confirmation and code redemption emails through Resend with outbound email logging.
How it can be reused for Verified Live Draw V1: Later winner notification or operator notification flows can reuse the same provider/logging patterns.
Risks/limitations: Winner notification templates and compliance copy are not present in repo evidence.

System: CSV export utilities.
Confidence: Confirmed.
Where found: `lib/csv/export.ts`, `app/api/admin/export/route.ts`, `lib/domain/draws/getDrawSnapshotCsv.ts`.
What it currently does: Builds CSV responses for admin exports and draw snapshot downloads.
How it can be reused for Verified Live Draw V1: Generate internal audit exports and separate public-safe manifest/verification downloads.
Risks/limitations: Existing admin exports include emails and payment/session identifiers; a public verification CSV must be intentionally redacted.

## 3. Supabase audit

Milestone 2 inspection source: local Supabase migrations, generated TypeScript database types, and server/client code paths only. No live Supabase data rows were queried and no Supabase data/schema mutations were performed. Live project drift remains Unknown until a read-only live schema inspection is available.

### 3.1 Tables

Eligibility model assessment:

Who is eligible for a draw? Confirmed: the model can identify eligible entries from `promo_entries` scoped to `promo_campaigns`, with `status = 'active'` and `locked_at` set by the draw workflow.

How many entries does each person/ticket receive? Confirmed: `fulfill_daypass_order` creates `p_quantity` promo entries for Daypass quantity 1-10 and reserves sequential `entry_number` values through `promo_campaign_entry_counters`.

Which purchase/order created each entry? Confirmed: `promo_entries` links to `orders`, `order_items`, and optionally `daypass_codes`.

Are entries durable and auditable? Likely: entry rows are durable and linked to order/code/campaign context, and `draw_snapshots` stores count/hash. However, there is no immutable entry status history or public-safe manifest table.

Can entries be reconstructed after the fact? Likely: active locked entries can be rebuilt from `promo_entries`, member/code context, and campaign records. Exact historical reconstruction is weaker because the current snapshot table stores only hash/count/notes, not the canonical manifest bytes or row-level snapshot.

Are refunds/cancellations/disputes represented? Partially confirmed: `orders.status` includes `cancelled`/`refunded`; `promo_entries.status` includes `cancelled`/`refunded`/`void`/`disqualified`; no dedicated dispute/refund event table was found.

Are there existing ticket/entry/code concepts? Confirmed: `promo_entries` are the entry/ticket concept; `daypass_codes` are friend access codes that can transfer current entry holder attribution before draw lock.

Table: `auth.users`
Confidence: Confirmed.
Purpose inferred: Supabase-managed authenticated user identity.
Important columns: Not defined in repo migrations; referenced by `admin_profiles.id` and `member_profiles.user_id`.
Primary key: `id`, inferred from foreign key references.
Foreign keys/relationships: Referenced by `admin_profiles.id`; referenced by `member_profiles.user_id`.
Sensitive columns to avoid exposing publicly: All auth identity fields, emails, auth metadata, tokens/session-related data.
How it may relate to draw eligibility: Indirectly identifies signed-in admins and members; eligibility itself should use `member_profiles`/`promo_entries`, not auth metadata.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Table: `admin_profiles`
Confidence: Confirmed.
Purpose inferred: Admin authorization allow-list tied to Supabase Auth users.
Important columns: `id`, `email`, `role`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: `id` references `auth.users(id)`.
Sensitive columns to avoid exposing publicly: Admin email and role membership.
How it may relate to draw eligibility: Does not determine entrant eligibility; protects admin draw operations through `public.is_admin()`.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `lib/auth/admin.ts`.

Table: `member_profiles`
Confidence: Confirmed.
Purpose inferred: Member/customer profile linked by normalized email and optionally Supabase Auth user/Stripe customer.
Important columns: `id`, `user_id`, `email`, `email_normalized`, `display_name`, `stripe_customer_id`, `created_at`, `updated_at`.
Primary key: `id`.
Foreign keys/relationships: `user_id` references `auth.users(id)`; referenced by `orders.member_profile_id`, `access_grants.member_profile_id`, `daypass_codes.purchaser_member_profile_id`, `daypass_codes.redeemed_by_member_profile_id`, and `promo_entries` holder/owner/referrer columns.
Sensitive columns to avoid exposing publicly: Full email, normalized email, display name if operator treats it as private, Stripe customer ID, auth user ID.
How it may relate to draw eligibility: Identifies private owner/current-holder/referrer context for promo entries; public draw should expose only entry number and public alias.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519001000_add_member_profile_email_uniqueness.sql`, `lib/domain/members/*`.

Table: `promo_campaigns`
Confidence: Confirmed.
Purpose inferred: Promotion/campaign metadata and draw timing controls.
Important columns: `id`, `slug`, `status`, `name`, `short_name`, `prize_title`, `entry_limit`, `starts_at`, `closes_at`, `entries_close_at`, `draw_lock_at`, `draw_at`, `rules_url`, `terms_version`, `config_json`.
Primary key: `id`.
Foreign keys/relationships: Referenced by `commerce_offers` indirectly through order items, `order_items.campaign_id`, `daypass_codes.campaign_id`, `promo_entries.campaign_id`, `draw_snapshots.campaign_id`, `draw_results.campaign_id`, `outbound_emails.related_campaign_id`, `promo_campaign_entry_counters.campaign_id`.
Sensitive columns to avoid exposing publicly: Internal `config_json` fields if they contain draft/operator notes; launch timing may be public only when approved.
How it may relate to draw eligibility: Defines campaign scope, status, close time, lock time, planned draw time, entry cap, and public rules URL.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/campaigns/config.ts`.

Table: `commerce_offers`
Confidence: Confirmed.
Purpose inferred: Sellable/access offer definitions such as Daypass.
Important columns: `id`, `code`, `status`, `name`, `offer_type`, `stripe_price_id`, `unit_price_cents`, `currency`, `access_duration_hours`, `config_json`.
Primary key: `id`.
Foreign keys/relationships: Referenced by `order_items.offer_id`; used by fulfillment and checkout price resolution.
Sensitive columns to avoid exposing publicly: Stripe price ID is not a secret but should not be overexposed unnecessarily; draft/internal config.
How it may relate to draw eligibility: Confirms the purchased item is an active Daypass offer; `offer_type = 'daypass'` is enforced by fulfillment RPC.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/payments/stripe.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Table: `orders`
Confidence: Confirmed.
Purpose inferred: Purchase/order ledger for checkout sessions and fulfillment status.
Important columns: `id`, `member_profile_id`, `purchaser_email`, `purchaser_email_normalized`, `stripe_customer_id`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `status`, `subtotal_cents`, `total_cents`, `currency`, `source_landing_page_id`, `source_slug`, `anonymous_id`, `session_id`, `attribution_json`, `fulfilled_at`.
Primary key: `id`.
Foreign keys/relationships: `member_profile_id` references `member_profiles`; `source_landing_page_id` references `landing_page_tests`; referenced by `order_items`, `access_grants`, `daypass_codes`, `promo_entries`, `outbound_emails`, and `stripe_webhook_events.related_order_id`.
Sensitive columns to avoid exposing publicly: Purchaser email/normalized email, Stripe customer/session/payment IDs, attribution JSON, anonymous/session IDs.
How it may relate to draw eligibility: Indicates the purchase that created entries and whether it is pending/fulfilled/cancelled/refunded.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `app/api/checkout/daypass/route.ts`, `app/api/stripe/webhook/route.ts`.

Table: `order_items`
Confidence: Confirmed.
Purpose inferred: Line items for orders, including campaign-linked Daypass quantity.
Important columns: `id`, `order_id`, `offer_id`, `campaign_id`, `item_type`, `quantity`, `unit_price_cents`, `total_price_cents`, `currency`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: `order_id` references `orders`; `offer_id` references `commerce_offers`; `campaign_id` references `promo_campaigns`; referenced by `access_grants`, `daypass_codes`, and `promo_entries`.
Sensitive columns to avoid exposing publicly: Order linkage and price data where tied to identifiable customer context.
How it may relate to draw eligibility: The Daypass quantity controls the number of promo entries issued by fulfillment.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Table: `access_grants`
Confidence: Confirmed.
Purpose inferred: Daypass/Ultra/member access lifecycle.
Important columns: `id`, `member_profile_id`, `order_id`, `order_item_id`, `daypass_code_id`, `access_type`, `status`, `starts_at`, `expires_at`, `created_at`, `revoked_at`.
Primary key: `id`.
Foreign keys/relationships: References `member_profiles`, `orders`, `order_items`, and `daypass_codes`.
Sensitive columns to avoid exposing publicly: Member/profile/order/code linkages and access timing when tied to an individual.
How it may relate to draw eligibility: Access is adjacent to eligibility; entries are issued during fulfillment even before access activation, so draw eligibility should rely on `promo_entries` and order/entry status rather than active access state alone.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/access/*`.

Table: `daypass_codes`
Confidence: Confirmed.
Purpose inferred: Friend Daypass code records, stored as hashes/encrypted values with safe last-four display.
Important columns: `id`, `purchaser_member_profile_id`, `purchaser_email_normalized`, `order_id`, `order_item_id`, `campaign_id`, `code_hash`, `code_last4`, `encrypted_code`, `encryption_key_version`, `status`, `redeemed_by_member_profile_id`, `redeemed_at`, `access_grant_id`, `expires_at`.
Primary key: `id`.
Foreign keys/relationships: References `member_profiles`, `orders`, `order_items`, `promo_campaigns`, and `access_grants`; referenced by `promo_entries.daypass_code_id` and `access_grants.daypass_code_id`.
Sensitive columns to avoid exposing publicly: `code_hash`, `encrypted_code`, `encryption_key_version`, purchaser email/normalized email, member IDs, redeemed-by member IDs, access grant IDs.
How it may relate to draw eligibility: A friend code-backed promo entry can transfer current holder to the redeemer before `draw_lock_at` if the entry is not locked.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519003000_create_daypass_redemption_rpc.sql`, `lib/domain/daypass-codes/*`.

Table: `promo_entries`
Confidence: Confirmed.
Purpose inferred: Promotion entry/ticket ledger.
Important columns: `id`, `campaign_id`, `order_id`, `order_item_id`, `daypass_code_id`, `entry_number`, `owner_member_profile_id`, `owner_email_normalized`, `current_holder_member_profile_id`, `referrer_member_profile_id`, `display_alias`, `status`, `locked_at`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: References `promo_campaigns`, `orders`, `order_items`, `daypass_codes`, and `member_profiles`; referenced by `draw_results.winning_entry_id`.
Sensitive columns to avoid exposing publicly: Owner/current-holder/referrer profile IDs, owner normalized email, order/item/code IDs.
How it may relate to draw eligibility: This is the current canonical eligibility table. Active locked entries are the draw pool; `entry_number` and `display_alias` are public-safe candidates.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/draws/buildEligibleEntriesCsv.ts`, `app/admin/(dashboard)/entries/page.tsx`.

Table: `promo_campaign_entry_counters`
Confidence: Confirmed.
Purpose inferred: Concurrency-safe per-campaign entry numbering.
Important columns: `campaign_id`, `last_entry_number`, `updated_at`.
Primary key: `campaign_id`.
Foreign keys/relationships: `campaign_id` references `promo_campaigns(id)`.
Sensitive columns to avoid exposing publicly: Low sensitivity by itself; still operational state.
How it may relate to draw eligibility: Guarantees unique sequential entry numbers per campaign during fulfillment.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Table: `draw_snapshots`
Confidence: Confirmed.
Purpose inferred: Stores final draw snapshot metadata.
Important columns: `id`, `campaign_id`, `entry_count`, `csv_sha256`, `created_by`, `created_at`, `notes`.
Primary key: `id`.
Foreign keys/relationships: `campaign_id` references `promo_campaigns`; `created_by` references `admin_profiles`.
Sensitive columns to avoid exposing publicly: Admin profile ID and internal notes.
How it may relate to draw eligibility: Records eligible entry count and hash after lock; current table does not store the manifest bytes or row-level snapshot.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/draws/createDrawSnapshot.ts`.

Table: `draw_results`
Confidence: Confirmed.
Purpose inferred: Stores recorded draw result.
Important columns: `id`, `campaign_id`, `draw_snapshot_id`, `winning_entry_id`, `winning_entry_number`, `draw_method`, `public_notes`, `internal_notes`, `created_by`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: `campaign_id` references `promo_campaigns`; `draw_snapshot_id` references `draw_snapshots`; `winning_entry_id` references `promo_entries`; `created_by` references `admin_profiles`.
Sensitive columns to avoid exposing publicly: Internal notes, admin profile ID, internal entry UUID.
How it may relate to draw eligibility: Links a winner to a snapshot, but only supports manual winner recording rather than deterministic all-entry ranking.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/draws/recordDrawResult.ts`, `app/draw-results/[slug]/page.tsx`.

Table: `stripe_webhook_events`
Confidence: Confirmed.
Purpose inferred: Stripe webhook idempotency and diagnostics log.
Important columns: `id`, `stripe_event_id`, `event_type`, `stripe_checkout_session_id`, `processing_status`, `related_order_id`, `payload_json`, `error_message`, `received_at`, `processed_at`.
Primary key: `id`.
Foreign keys/relationships: `related_order_id` references `orders`.
Sensitive columns to avoid exposing publicly: Stripe event/session IDs, payload JSON, error messages if they include operational detail.
How it may relate to draw eligibility: Establishes trusted fulfillment source and idempotency for entry issuance.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `app/api/stripe/webhook/route.ts`.

Table: `event_logs`
Confidence: Confirmed.
Purpose inferred: Analytics and business event log.
Important columns: `id`, `event_name`, `anonymous_id`, `session_id`, `lead_id`, `landing_page_id`, `landing_slug`, `offer_id`, `offer_type`, `price_cents`, `currency`, `path`, `url`, `referrer`, UTM/meta attribution fields, `fbclid`, `device_type`, `properties`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: `lead_id` references `waitlist_leads`; `landing_page_id` references `landing_page_tests`.
Sensitive columns to avoid exposing publicly: Anonymous/session IDs, URLs/referrers if they contain identifiers, attribution data, any PII accidentally placed in properties.
How it may relate to draw eligibility: Not canonical eligibility; useful as audit/analytics for order/draw lifecycle events.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `supabase/migrations/20260513000000_add_event_log_fbclid.sql`, `lib/analytics/types.ts`, `lib/db/events.ts`.

Table: `export_logs`
Confidence: Confirmed.
Purpose inferred: Records admin CSV export actions.
Important columns: `id`, `admin_user_id`, `export_type`, `filters_json`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: `admin_user_id` references `admin_profiles`.
Sensitive columns to avoid exposing publicly: Admin user ID and filters if they reveal operational/customer segmentation.
How it may relate to draw eligibility: Useful for internal audit trail of entry/order/code exports.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `app/api/admin/export/route.ts`.

Table: `outbound_emails`
Confidence: Confirmed.
Purpose inferred: Transactional email log with idempotency.
Important columns: `id`, `provider`, `provider_message_id`, `recipient_email`, `template_key`, `idempotency_key`, `related_order_id`, `related_campaign_id`, `status`, `error_message`, `created_at`, `sent_at`.
Primary key: `id`.
Foreign keys/relationships: `related_order_id` references `orders`; `related_campaign_id` references `promo_campaigns`.
Sensitive columns to avoid exposing publicly: Recipient email, provider message ID, idempotency key, errors.
How it may relate to draw eligibility: Not eligibility source; can support winner/order/code notification audit.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/email/*`.

Table: `landing_page_tests`
Confidence: Confirmed.
Purpose inferred: Landing page variants/config used for acquisition and Campaign 001 fallback content.
Important columns: `id`, `slug`, `status`, `internal_name`, copy/offer fields, `hero_image_url`, `config_json`, `published_at`, timestamps.
Primary key: `id`.
Foreign keys/relationships: Referenced by `waitlist_leads`, `event_logs`, `visitor_sessions`, and `orders.source_landing_page_id`.
Sensitive columns to avoid exposing publicly: Draft/internal variants unless status is live.
How it may relate to draw eligibility: Attribution/source context only; not canonical eligibility.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `supabase/migrations/20260512000001_allow_public_live_landing_tests.sql`.

Table: `waitlist_leads`
Confidence: Confirmed.
Purpose inferred: Waitlist/access-list lead capture.
Important columns: `id`, `email`, `email_normalized`, `first_name`, source/attribution fields, preferences, consent fields, offer fields, `fbclid`, `path`, `referrer`, `device_type`.
Primary key: `id`.
Foreign keys/relationships: `source_landing_page_id` references `landing_page_tests`; referenced by `lead_preferences` and `event_logs.lead_id`.
Sensitive columns to avoid exposing publicly: Email, normalized email, first name, attribution/consent/preference records.
How it may relate to draw eligibility: Not a draw eligibility table; useful only for marketing context.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `supabase/migrations/20260512000002_add_waitlist_offer_context.sql`.

Table: `lead_preferences`
Confidence: Confirmed.
Purpose inferred: Waitlist preference rows.
Important columns: `id`, `lead_id`, `preference_type`, `preference_value`, `created_at`.
Primary key: `id`.
Foreign keys/relationships: `lead_id` references `waitlist_leads(id)` on delete cascade.
Sensitive columns to avoid exposing publicly: Individual preference data linked to a lead.
How it may relate to draw eligibility: No direct eligibility role.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Table: `visitor_sessions`
Confidence: Confirmed.
Purpose inferred: Visitor/session attribution table.
Important columns: `id`, `session_id`, `anonymous_id`, first/last seen timestamps, landing/source/UTM/device fields.
Primary key: `id`.
Foreign keys/relationships: `landing_page_id` references `landing_page_tests`.
Sensitive columns to avoid exposing publicly: Session/anonymous IDs and attribution fields.
How it may relate to draw eligibility: No direct eligibility role; analytics only.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Table: `listings`
Confidence: Confirmed.
Purpose inferred: Member-only listing data.
Important columns: `id`, `slug`, `status`, `title`, `brand`, `deck_year`, `era`, `condition_label`, `price_cents`, `currency`, `location_region`, `is_featured`, `is_member_only`, `primary_image_url`, `facts_json`, `sort_order`, timestamps.
Primary key: `id`.
Foreign keys/relationships: No direct draw foreign keys found.
Sensitive columns to avoid exposing publicly: Member-only listing inventory/details unless intentionally public.
How it may relate to draw eligibility: Not an eligibility source; may provide UI/content patterns and prize/listing context.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/listings/queries.ts`.

### 3.2 RLS policies

Overall RLS assessment:

Confirmed: RLS is enabled on all app-owned public tables created in the migrations. The V1 schema revokes all table privileges from `anon` and `authenticated`, then grants scoped `select` to `authenticated` and full access to `service_role`. No normal-user insert/update/delete policies were found for eligibility-relevant tables. Public anonymous read is only confirmed for live `landing_page_tests`, not draw tables.

Security answer: Normal users cannot write eligibility-relevant records through RLS policies found in migrations. Authenticated users can read their own profile/orders/order items/access grants/promo entries, but not arbitrary records unless they are admins. Admin-only operations use `public.is_admin()` for read policies, while writes happen server-side through service-role client and service-role-only RPC grants. Public draw verification records are not safe to expose using the current `draw_snapshots`/`draw_results` tables because those tables are admin-read only and include internal admin/entry references; V1 needs separate public-safe read models or redacted views with explicit RLS.

Policy: `Public can read live landing page tests`
Confidence: Confirmed.
Table: `landing_page_tests`.
Command: `select`.
Role: `anon`.
Using/check expression summary: Allows rows where `status = 'live'`.
Security notes: This is the only anonymous table read policy found in migrations.
Draw-system relevance: Demonstrates a public-read/private-write pattern that could be mirrored for redacted verification records, but not for private draw tables.
Evidence: `supabase/migrations/20260512000001_allow_public_live_landing_tests.sql`.

Policy: `Admins can read admin profiles`
Confidence: Confirmed.
Table: `admin_profiles`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admin membership itself is admin-readable only.
Draw-system relevance: Protects admin identity/authorization surface.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read landing page tests`
Confidence: Confirmed.
Table: `landing_page_tests`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admins can inspect all landing tests, including draft/internal rows.
Draw-system relevance: Useful only for campaign attribution/context.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read waitlist leads`
Confidence: Confirmed.
Table: `waitlist_leads`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Lead PII is admin-only by RLS; writes are server-only per table comment.
Draw-system relevance: No direct eligibility role.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read lead preferences`
Confidence: Confirmed.
Table: `lead_preferences`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Preference rows are admin-only.
Draw-system relevance: No direct eligibility role.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read event logs`
Confidence: Confirmed.
Table: `event_logs`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Analytics/event rows are not publicly readable.
Draw-system relevance: Good pattern for private audit events; public verification needs a redacted surface.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read visitor sessions`
Confidence: Confirmed.
Table: `visitor_sessions`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Session attribution is admin-only.
Draw-system relevance: Analytics only.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read export logs`
Confidence: Confirmed.
Table: `export_logs`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Export audit is admin-only.
Draw-system relevance: Useful precedent for draw audit event logs.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Policy: `Admins can read member profiles`
Confidence: Confirmed.
Table: `member_profiles`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admins can read member PII.
Draw-system relevance: Admin draw review can resolve internal entry holders; public draw cannot expose this.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Members can read own profile`
Confidence: Confirmed.
Table: `member_profiles`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: Current `auth.uid()` must match `member_profiles.user_id`.
Security notes: Users can read their own profile but no write policy is present.
Draw-system relevance: Supports member dashboard entry/account views.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read promo campaigns`
Confidence: Confirmed.
Table: `promo_campaigns`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: No public campaign table read policy found; public app uses service-role server reads.
Draw-system relevance: Admins can inspect campaign timing/status for draw lock.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read commerce offers`
Confidence: Confirmed.
Table: `commerce_offers`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Offer config is admin-readable.
Draw-system relevance: Confirms Daypass offer context for eligibility review.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read orders`
Confidence: Confirmed.
Table: `orders`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admins can inspect order PII/payment identifiers.
Draw-system relevance: Needed for eligibility review, refund/cancellation review, and audit.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Members can read own orders`
Confidence: Confirmed.
Table: `orders`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: Auth user can read orders where `member_profile_id` belongs to their profile.
Security notes: No member write policy found.
Draw-system relevance: Lets members see their own purchase context without tampering with eligibility.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read order items`
Confidence: Confirmed.
Table: `order_items`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admins can inspect campaign-linked line items.
Draw-system relevance: Needed to confirm quantity/campaign per entry source.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Members can read own order items`
Confidence: Confirmed.
Table: `order_items`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: Auth user can read items for orders belonging to their member profile.
Security notes: No member write policy found.
Draw-system relevance: Lets members see own Daypass quantities without modifying them.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read access grants`
Confidence: Confirmed.
Table: `access_grants`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admin read only; writes are server-side.
Draw-system relevance: Adjacent access lifecycle review.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Members can read own access grants`
Confidence: Confirmed.
Table: `access_grants`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: Auth user can read grants for their member profile.
Security notes: No member write policy found; activation uses server route/service role.
Draw-system relevance: Supports account dashboard but should not determine draw eligibility alone.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `app/api/member/access/activate/route.ts`.

Policy: `Admins can read daypass codes`
Confidence: Confirmed.
Table: `daypass_codes`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Authenticated grants restrict selected columns; code hash/encrypted code columns are not granted to authenticated, and admin policy is read-only. Service role has full access.
Draw-system relevance: Protects sensitive code material while allowing admin review of last-four/status through server/admin tooling.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read promo entries`
Confidence: Confirmed.
Table: `promo_entries`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Admins can read internal entry ledger.
Draw-system relevance: Admin draw review depends on this.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Members can read own promo entries`
Confidence: Confirmed.
Table: `promo_entries`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: Auth user can read entries where they are owner or current holder via `member_profiles.user_id`.
Security notes: Authenticated column grant omits owner email/order/code IDs; no member write policy found.
Draw-system relevance: Safe pattern for entrant account entry visibility, but not for public verification of all entries.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read listings`
Confidence: Confirmed.
Table: `listings`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Listing rows are not broadly client-readable; app fetches server-side after access checks.
Draw-system relevance: Not eligibility, but demonstrates private data access pattern.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/listings/queries.ts`.

Policy: `Admins can read draw snapshots`
Confidence: Confirmed.
Table: `draw_snapshots`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Current snapshots are admin-readable only.
Draw-system relevance: Good for internal audit, insufficient for public verification without public-safe records.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read draw results`
Confidence: Confirmed.
Table: `draw_results`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Current draw results are admin-readable by RLS; public result page uses server-side service-role read and redacts response.
Draw-system relevance: V1 should keep private result internals protected and expose only redacted verification payloads.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `lib/domain/draws/getDrawResultByCampaign.ts`.

Policy: `Admins can read outbound emails`
Confidence: Confirmed.
Table: `outbound_emails`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Recipient and provider diagnostics are admin-only.
Draw-system relevance: Future winner notification audit can reuse this private pattern.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read stripe webhook events`
Confidence: Confirmed.
Table: `stripe_webhook_events`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Webhook diagnostics are admin-only.
Draw-system relevance: Supports entry issuance audit from trusted payment events.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Policy: `Admins can read promo campaign entry counters`
Confidence: Confirmed.
Table: `promo_campaign_entry_counters`.
Command: `select`.
Role: `authenticated`.
Using/check expression summary: `public.is_admin()`.
Security notes: Counter rows are admin-readable; write path is service-role/RPC only.
Draw-system relevance: Supports audit of sequential entry numbering.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

### 3.3 Functions, triggers, RPCs

Function/trigger/RPC: `public.is_admin()`
Confidence: Confirmed.
Purpose: Determines whether `auth.uid()` has an `admin_profiles` row.
Input/output: No explicit input; returns boolean.
Tables affected: Reads `admin_profiles`.
Draw-system relevance: Core RLS predicate for admin-only reads and admin dashboard access model.
Risks: Security definer function lives in `public` schema; it sets `search_path = public` and grants execute only to `authenticated`/`service_role`, but future privileged functions should ideally avoid exposed schemas or be carefully reviewed.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`.

Function/trigger/RPC: `public.set_updated_at()`
Confidence: Confirmed.
Purpose: Generic trigger function to refresh `updated_at`.
Input/output: Trigger function; returns modified `new` row.
Tables affected: Used by triggers on `landing_page_tests`, `waitlist_leads`, `member_profiles`, `promo_campaigns`, `commerce_offers`, `orders`, `listings`, and `promo_campaign_entry_counters`.
Draw-system relevance: Maintains update timestamps on campaign/order/counter records used by draw eligibility.
Risks: Does not provide immutable history; only latest update timestamp.
Evidence: `supabase/migrations/20260512000000_create_core_schema.sql`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Function/trigger/RPC: `public.fulfill_daypass_order(...)`
Confidence: Confirmed.
Purpose: Service-role-only RPC that finalizes paid Daypass checkout fulfillment.
Input/output: Inputs include Stripe event/session IDs, purchaser email/normalized email, campaign ID, offer ID, quantity, friend code payloads, and sanitized webhook payload. Returns JSON summary with order/access/code/entry counts and entry numbers.
Tables affected: Reads/updates `promo_campaigns`, `commerce_offers`, `orders`, `order_items`, `member_profiles`, `access_grants`, `daypass_codes`, `promo_campaign_entry_counters`, `promo_entries`, and `stripe_webhook_events`.
Draw-system relevance: Primary entry issuance path. It enforces Daypass quantity 1-10, blocks fulfillment after `entries_close_at`, creates entries, and reserves sequential entry numbers.
Risks: Inserts active entries based on order quantity but does not create immutable per-entry creation events. Refund/cancellation/dispute state changes are not handled here beyond initial order fulfillment.
Evidence: `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`, `lib/domain/access/grantAccess.ts`, `lib/domain/payments/fulfillCheckout.ts`.

Function/trigger/RPC: `public.redeem_daypass_code(text, uuid, timestamptz)`
Confidence: Confirmed.
Purpose: Service-role-only RPC that redeems a friend Daypass code and optionally updates promo entry current holder before draw lock.
Input/output: Inputs are code hash, redeemer member profile ID, and optional timestamp. Returns JSON summary including access grant ID, code last-four, entry ID, attribution update flag, campaign context, and redemption-before-lock flag.
Tables affected: Reads/updates `daypass_codes`, `member_profiles`, `access_grants`, `promo_entries`, and `promo_campaigns`.
Draw-system relevance: Defines current-holder transfer semantics. If redemption happens before `draw_lock_at` and entry is not locked, it updates `current_holder_member_profile_id`.
Risks: Requires `draw_lock_at` to be configured when linked entry exists; otherwise redemption requires manual review. Does not write a separate immutable attribution-change history row.
Evidence: `supabase/migrations/20260519003000_create_daypass_redemption_rpc.sql`, `lib/domain/daypass-codes/redeemDaypassCode.ts`, `app/api/daypass/redeem/route.ts`.

Function/trigger/RPC: `member_profiles_set_updated_at`, `promo_campaigns_set_updated_at`, `commerce_offers_set_updated_at`, `orders_set_updated_at`, `listings_set_updated_at`, `promo_campaign_entry_counters_set_updated_at`
Confidence: Confirmed.
Purpose: Table triggers that call `public.set_updated_at()`.
Input/output: Trigger side effect on row updates.
Tables affected: Named tables.
Draw-system relevance: Maintains timestamps for campaign/order/counter state changes.
Risks: Updated timestamps are useful but not a substitute for an audit log.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Function/trigger/RPC: `lockCampaignEntries(campaignSlug)`
Confidence: Confirmed.
Purpose: Server-only application utility that locks active entries after `draw_lock_at`.
Input/output: Input campaign slug; returns campaign, lock timestamp, newly locked count, and total locked eligible count.
Tables affected: Reads/updates `promo_campaigns`; updates `promo_entries.locked_at`; counts locked active entries.
Draw-system relevance: Required precondition for final snapshot/manifest.
Risks: Current code updates all unlocked active entries at execution time and stores a single timestamp; it does not persist an immutable list of which entries were locked in that operation beyond row state.
Evidence: `lib/domain/draws/lockCampaignEntries.ts`, `app/api/admin/draws/lock/route.ts`.

Function/trigger/RPC: `buildEligibleEntriesCsv(...)`
Confidence: Confirmed.
Purpose: Server-only application utility that builds an eligible entries CSV from locked active promo entries.
Input/output: Inputs campaign ID/name/slug and `requireLocked`; returns CSV, mapped entries, and headers.
Tables affected: Reads `promo_entries`, `member_profiles`, and `daypass_codes`.
Draw-system relevance: Current manifest-builder foundation.
Risks: Current CSV includes internal emails and IDs. It is suitable for internal audit, not direct public verification.
Evidence: `lib/domain/draws/buildEligibleEntriesCsv.ts`.

Function/trigger/RPC: `hashCsvSha256(csv)`
Confidence: Confirmed.
Purpose: Server-only hash helper for CSV snapshots.
Input/output: Input CSV string; output SHA-256 hex digest.
Tables affected: None.
Draw-system relevance: Existing manifest integrity primitive.
Risks: Hashes only prove the same CSV content if the canonical CSV bytes are available; current DB stores hash/count but not manifest bytes.
Evidence: `lib/domain/draws/hashCsvSha256.ts`.

Function/trigger/RPC: `createDrawSnapshot(input)`
Confidence: Confirmed.
Purpose: Server-only application utility that creates a draw snapshot after lock and stores CSV hash/count.
Input/output: Inputs admin profile ID, campaign slug, notes, refund-rule confirmation; returns CSV, hash, count, snapshot row.
Tables affected: Reads `promo_campaigns` and `promo_entries`; inserts `draw_snapshots`; writes `event_logs` via `insertEventLog`.
Draw-system relevance: Current internal draw snapshot operation.
Risks: Does not persist manifest file/bytes or row-level snapshot; logs event best-effort only.
Evidence: `lib/domain/draws/createDrawSnapshot.ts`, `app/api/admin/draws/snapshot/route.ts`.

Function/trigger/RPC: `recordDrawResult(input)`
Confidence: Confirmed.
Purpose: Server-only application utility that validates current locked CSV hash against selected snapshot and records manual winning entry.
Input/output: Inputs admin profile ID, campaign slug, draw method, snapshot ID, notes, and winning entry number; returns result and snapshot.
Tables affected: Reads `promo_campaigns`, `draw_results`, `draw_snapshots`, `promo_entries`; inserts `draw_results`; updates `promo_campaigns.status` to `drawn`; writes `event_logs` best-effort.
Draw-system relevance: Current result operation, but not a verified deterministic draw engine.
Risks: Manual winner entry number is operator-entered. No randomness proof, deterministic algorithm version, full ranking, or replay event persistence.
Evidence: `lib/domain/draws/recordDrawResult.ts`, `app/api/admin/draws/result/route.ts`.

Function/trigger/RPC: `getDrawSnapshotCsv(snapshotId)`
Confidence: Confirmed.
Purpose: Server-only application utility that rebuilds a snapshot CSV and verifies hash before download.
Input/output: Input snapshot ID; returns campaign slug, CSV, CSV hash, file name.
Tables affected: Reads `draw_snapshots`, `promo_campaigns`, `promo_entries`, `member_profiles`, and `daypass_codes`.
Draw-system relevance: Internal audit/download path.
Risks: Rebuild depends on current locked rows matching the stored hash; if current rows change, download fails, but original manifest bytes are not retained.
Evidence: `lib/domain/draws/getDrawSnapshotCsv.ts`, `app/api/admin/draws/snapshots/[snapshotId]/csv/route.ts`.

### 3.4 Current database gaps for live draw

Recommended object: `draws`
Why needed: Store one canonical draw run per campaign with state, operator, draw type, algorithm version, manifest hash, randomness proof reference, start/end/publish timestamps, and idempotency/status.
Existing system it connects to: `promo_campaigns`, `draw_snapshots`, `draw_results`, `admin_profiles`.
Likely owner/creator: Admin/service-role server action when operator initializes a verified draw.
Public/private exposure: Private write/admin read; selected public fields can be exposed through a public verification record.
RLS considerations: No anon/auth writes. Admin read through `public.is_admin()`. Public read should use a separate redacted view/table with only approved fields.
Risk if omitted: Draw state remains spread across manual snapshot/result rows and cannot reliably represent a verified live draw lifecycle.

Recommended object: `draw_entry_snapshots`
Why needed: Persist each locked entry as it existed at draw time, including canonical public fields, internal entry ID, entry number, alias, status at lock, and row hash/order.
Existing system it connects to: `promo_entries`, `draws`, `draw_snapshots`.
Likely owner/creator: Service-role snapshot operation after lock.
Public/private exposure: Private table with internal IDs; optional public-safe projection excluding profile/order/code IDs and emails.
RLS considerations: Admin read/private write; public read only for redacted fields if needed.
Risk if omitted: Historical reconstruction depends on current `promo_entries` state; exact manifest bytes and row set may be lost or disputed.

Recommended object: `draw_manifest_files`
Why needed: Store canonical manifest content metadata, storage path, byte length, encoding, SHA-256, generated_at, generated_by, and redaction profile.
Existing system it connects to: `draws`, `draw_entry_snapshots`, current `buildEligibleEntriesCsv`.
Likely owner/creator: Service-role draw snapshot generator.
Public/private exposure: Internal full manifest private; public redacted manifest can be separate or generated from public-safe rows.
RLS considerations: Storage/table records should prevent anon access to private files; public manifest file should be immutable and intentionally redacted.
Risk if omitted: A stored hash without stored canonical bytes is hard for the public/operator to verify independently later.

Recommended object: `draw_randomness_proofs`
Why needed: Record public randomness source, request URL, observed value, response hash, fetched_at, source timestamp/block/round, verification URL, and any fallback/error details.
Existing system it connects to: `draws`.
Likely owner/creator: Server-side draw engine at draw time.
Public/private exposure: Mostly public-safe, but raw responses should be reviewed for unexpected metadata before public release.
RLS considerations: Service-role insert only; public read only after draw is published.
Risk if omitted: Deterministic ranking cannot be independently verified from public inputs.

Recommended object: `draw_results` extension or replacement verified result table
Why needed: Current `draw_results` stores only manual winner/result method. Verified V1 needs algorithm version, seed, ranking hash, winner rank, full ranking reference, final 20 reference, and publication state.
Existing system it connects to: Existing `draw_results`, `draw_snapshots`, `promo_entries`, `draws`.
Likely owner/creator: Service-role deterministic draw engine.
Public/private exposure: Private internals; public-safe winner/ranking proof fields can be exposed.
RLS considerations: Avoid direct public reads of internal result rows unless redacted columns are guaranteed.
Risk if omitted: The app can publish a result but cannot prove how every entry was ranked.

Recommended object: `draw_ranked_entries`
Why needed: Persist deterministic ranking/elimination order for every eligible entry, including rank, entry number, alias, row hash, and internal entry snapshot ID.
Existing system it connects to: `draws`, `draw_entry_snapshots`, current `promo_entries`.
Likely owner/creator: Service-role deterministic draw engine after randomness seed is fetched.
Public/private exposure: Public-safe fields may be exposed; internal IDs/private holder context must stay private.
RLS considerations: Public read should be limited to published draws and redacted columns.
Risk if omitted: Elimination board and final 20 race cannot replay a verifiable result; winner proof is incomplete.

Recommended object: `draw_audit_events`
Why needed: Immutable lifecycle log for draw initialized, entries locked, manifest generated, randomness fetched, ranking computed, result published, verification record published, and errors/retries.
Existing system it connects to: Existing `event_logs`, `export_logs`, `admin_profiles`, `draws`.
Likely owner/creator: Service-role/admin operations.
Public/private exposure: Private by default; selected event summaries may be public.
RLS considerations: Insert-only service-role; admin read; no client write.
Risk if omitted: Operational audit trail remains best-effort analytics events rather than a reliable draw-specific ledger.

Recommended object: `draw_replay_events`
Why needed: Store precomputed elimination-board and final-20 race replay steps derived from the verified ranking, not from animation randomness.
Existing system it connects to: `draws`, `draw_ranked_entries`.
Likely owner/creator: Service-role draw publish/replay generator.
Public/private exposure: Public-safe after publish because it should contain only rank/order/entry number/alias/timing metadata.
RLS considerations: Public read for published draw only; no public writes.
Risk if omitted: Live animation may become non-auditable UI state and drift from the verified ranking.

Recommended object: `draw_public_verification_records`
Why needed: Store the final public proof payload: manifest hash, public manifest link/hash, randomness source/seed, algorithm, code/version identifier, ranking hash, winner, final 20, and verification instructions.
Existing system it connects to: `draws`, `draw_randomness_proofs`, `draw_manifest_files`, `draw_ranked_entries`.
Likely owner/creator: Service-role publish action after operator approval.
Public/private exposure: Public read; private write.
RLS considerations: Use a public-read/private-write pattern similar to live landing tests, but only for rows marked published and containing redacted/public-safe fields.
Risk if omitted: Public verification page will be narrative only and not independently auditable.

Recommended object: `entry_status_history` or `promo_entry_audit_events`
Why needed: Track status changes for entries such as active, cancelled, refunded, void, disqualified, winner, and lock events with actor/reason/source.
Existing system it connects to: `promo_entries`, `orders`, `stripe_webhook_events`, admin operations.
Likely owner/creator: Service-role fulfillment/refund/admin workflows.
Public/private exposure: Private/admin-only; public draw may expose aggregate exclusion counts only.
RLS considerations: Service-role write, admin read, no public/member write.
Risk if omitted: Eligibility exclusions are explainable only from current row state and operator notes, not from immutable history.

Recommended object: `promotion_terms_acceptances` or explicit eligibility attestations
Why needed: No dedicated terms/policy acceptance table was found. If legal requires acceptance of promotion rules or eligibility attestations, it should be durable and tied to purchase/member/order/campaign.
Existing system it connects to: `orders`, `member_profiles`, `promo_campaigns`, `terms_version`.
Likely owner/creator: Checkout/member flow server action.
Public/private exposure: Private/admin-only.
RLS considerations: Member read-own may be acceptable; writes should be server-only.
Risk if omitted: Operator may lack durable evidence of promotion-rule acceptance or eligibility attestation.

## 4. Stripe/payment flow audit

Finding: The repo has a complete app-side Stripe Checkout path for Campaign 001 Daypasses: a pending order is created before Checkout, Stripe metadata carries campaign/order/quantity context, `checkout.session.completed` is verified by webhook signature, and a service-role RPC creates member access, friend codes, and promo entries.
Confidence: Confirmed.
Evidence: `app/api/checkout/daypass/route.ts`, `lib/domain/payments/createCheckoutSession.ts`, `app/api/stripe/webhook/route.ts`, `lib/domain/payments/fulfillCheckout.ts`, `lib/domain/access/grantAccess.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.
Implication for Verified Live Draw V1: Successful paid Daypass purchases already have a credible path to durable entry records, so the draw should consume `promo_entries` rather than re-reading Stripe sessions during the draw.

Finding: Live Stripe Dashboard products, prices, webhook endpoints, and enabled event subscriptions could not be inspected from the active tool surface.
Confidence: Unknown.
Evidence: No Stripe connector/read-only tool was available in this session; inspection was limited to repo code and config names.
Implication for Verified Live Draw V1: Before launch, an operator must confirm live Stripe Price amounts/currency, product naming, webhook endpoint URL, enabled event types, and metadata behavior against the repo expectations below.

Finding: Refund, dispute, chargeback, checkout expiration, and payment-failure events are not implemented as eligibility-changing webhook handlers in the repo.
Confidence: Confirmed.
Evidence: `app/api/stripe/webhook/route.ts` handles only `checkout.session.completed`; `orders.status` and `promo_entries.status` have refund/cancellation states in `supabase/migrations/20260519000000_create_lean_v1_schema.sql`; operator-facing copy in `app/admin/(dashboard)/campaigns/page.tsx` says refund and revocation rules are not automated there.
Implication for Verified Live Draw V1: Draw lock must include a refund/dispute reconciliation step, or V1 should add automated Stripe event handling before relying on purchase records for final eligibility.

### 4.1 Products and prices

Product/price: Campaign 001 1 Daypass (`single_daypass`; `STRIPE_DAYPASS_PRICE_ID` with optional `commerce_offers.stripe_price_id` fallback)
Confidence: Confirmed.
Type: Daypass checkout option for the Campaign 001 promotion.
Amount/currency: AUD 4.99 expected by repo code.
Recurring or one-time: One-time Stripe Checkout payment.
Metadata: Live product/price metadata Unknown. Checkout Session and PaymentIntent metadata include `order_id`, `campaign_id`, `offer_code`, `daypass_quantity`, `checkout_option_code`, expected total/unit cents, selected Stripe price id, landing/source attribution, and anonymous/session attribution fields.
Current app route/use: `components/landing/CampaignDaypassCheckoutButton.tsx` posts to `app/api/checkout/daypass/route.ts`, which creates a Stripe Checkout Session through `lib/domain/payments/createCheckoutSession.ts`.
Potential draw eligibility meaning: One paid Daypass produces one active `promo_entries` row for the campaign if the webhook fulfills successfully and the purchase is not later refunded/cancelled/voided.
Evidence: `lib/domain/daypass/pricing.ts`, `lib/domain/payments/stripe.ts`, `lib/domain/payments/createCheckoutSession.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Product/price: Campaign 001 5 Daypasses (`five_daypass_bundle`; `STRIPE_5X_DAYPASS_PRICE_ID`)
Confidence: Confirmed.
Type: Daypass bundle checkout option.
Amount/currency: AUD 19.99 expected by repo code, with AUD 4.00 effective unit price recorded by the app.
Recurring or one-time: One-time Stripe Checkout payment.
Metadata: Live product/price metadata Unknown. Checkout Session and PaymentIntent metadata include `daypass_quantity = 5`, `checkout_option_code = five_daypass_bundle`, expected total/unit cents, order/campaign/offer references, and attribution fields.
Current app route/use: Same `/api/checkout/daypass` route as the single Daypass; Stripe line item quantity remains `1`, and bundle quantity is represented by app metadata and order item quantity.
Potential draw eligibility meaning: One paid 5x bundle produces five active `promo_entries` rows and four friend `daypass_codes` if fulfilled successfully.
Evidence: `lib/domain/daypass/pricing.ts`, `lib/domain/payments/stripe.ts`, `lib/domain/payments/fulfillCheckout.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Product/price: Campaign 001 10 Daypasses (`ten_daypass_bundle`; `STRIPE_10X_DAYPASS_PRICE_ID`)
Confidence: Confirmed.
Type: Daypass bundle checkout option.
Amount/currency: AUD 34.99 expected by repo code, with AUD 3.50 effective unit price recorded by the app.
Recurring or one-time: One-time Stripe Checkout payment.
Metadata: Live product/price metadata Unknown. Checkout Session and PaymentIntent metadata include `daypass_quantity = 10`, `checkout_option_code = ten_daypass_bundle`, expected total/unit cents, order/campaign/offer references, and attribution fields.
Current app route/use: Same `/api/checkout/daypass` route as other Daypass quantities.
Potential draw eligibility meaning: One paid 10x bundle produces ten active `promo_entries` rows and nine friend `daypass_codes` if fulfilled successfully.
Evidence: `lib/domain/daypass/pricing.ts`, `lib/domain/payments/stripe.ts`, `lib/domain/payments/fulfillCheckout.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Product/price: Monroes Ultra monthly/internal subscription offer (`ultra_monthly`)
Confidence: Confirmed.
Type: Subscription/reference offer.
Amount/currency: AUD 24.99 expected by repo seed.
Recurring or one-time: Intended subscription by `offer_type`, but checkout is disabled in the repo seed inspected here.
Metadata: Internal `config_json` marks `checkoutEnabled: false`, `manualStripeSetupRequired: true`, and `referenceOffer: true`; live Stripe metadata Unknown.
Current app route/use: No active Stripe checkout route for this offer was found in this milestone.
Potential draw eligibility meaning: No confirmed draw eligibility meaning for V1 unless operator explicitly decides memberships create entries and implementation adds a durable mapping.
Evidence: `lib/domain/offers/config.ts`, repo search for Stripe checkout routes.

Product/price: Marketplace/listing payments
Confidence: Unknown.
Type: Listings can carry prices, but no Stripe listing checkout flow was found.
Amount/currency: Listing rows have `price_cents` and `currency`, but no Stripe price mapping was confirmed.
Recurring or one-time: Unknown.
Metadata: Unknown.
Current app route/use: Member listings are displayed/access-controlled; no listing purchase checkout route was confirmed.
Potential draw eligibility meaning: None confirmed for V1.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `app/member/listings/page.tsx`, repo search for Stripe checkout usage.

### 4.2 Checkout/session flow

Flow step: User clicks a Campaign Daypass checkout button.
Confidence: Confirmed.
File/route/table/Stripe object: `components/landing/CampaignDaypassCheckoutButton.tsx`.
What happens: Client code tracks intent/start events, sends `quantity`, `campaign_slug`, source landing data, and attribution to `/api/checkout/daypass`, then redirects to the returned Stripe URL.
Draw eligibility implication: Quantity starts as client input but is constrained to supported values server-side before any order or Stripe session is created.
Evidence: `components/landing/CampaignDaypassCheckoutButton.tsx`.

Flow step: Checkout API validates request and campaign/offer availability.
Confidence: Confirmed.
File/route/table/Stripe object: `app/api/checkout/daypass/route.ts`, `lib/domain/campaigns/ensureCampaign001CheckoutData.ts`, `promo_campaigns`, `commerce_offers`.
What happens: The route accepts only supported Daypass quantities, only canonical Campaign 001 checkout, and live campaigns unless draft checkout is allowed outside production or by `ALLOW_DRAFT_CAMPAIGN_CHECKOUT`. It resolves or ensures Campaign 001 checkout data through a service-role Supabase client.
Draw eligibility implication: Draw entries should be campaign-scoped to the canonical campaign; however, live implementation should avoid depending on lazy data creation during checkout as a compliance control.
Evidence: `app/api/checkout/daypass/route.ts`, `lib/domain/campaigns/ensureCampaign001CheckoutData.ts`.

Flow step: Pending order and order item are created before Stripe Checkout.
Confidence: Confirmed.
File/route/table/Stripe object: `lib/domain/orders/createPendingOrder.ts`, `orders`, `order_items`.
What happens: The app inserts an `orders` row with `status = pending`, totals, attribution/source context, and a matching `order_items` row with offer, campaign, quantity, unit price, and total price.
Draw eligibility implication: A pending local order exists even before payment, but draw eligibility must ignore pending orders and rely on fulfilled active entries.
Evidence: `lib/domain/orders/createPendingOrder.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Flow step: Stripe Checkout Session is created.
Confidence: Confirmed.
File/route/table/Stripe object: `lib/domain/payments/createCheckoutSession.ts`, Stripe Checkout Session.
What happens: The app creates a `mode: payment` Checkout Session with `client_reference_id = order.id`, one line item using the selected Stripe Price, line item quantity `1`, success/cancel URLs, and identical metadata on the Checkout Session and PaymentIntent.
Draw eligibility implication: The app knows whether the buyer chose 1, 5, or 10 Daypasses from internal checkout option metadata and order item quantity, not from Stripe line-item quantity.
Evidence: `lib/domain/payments/createCheckoutSession.ts`, `lib/domain/daypass/pricing.ts`.

Flow step: Stripe Checkout Session ID is attached to the pending order.
Confidence: Confirmed.
File/route/table/Stripe object: `lib/domain/orders/createPendingOrder.ts`, `orders.stripe_checkout_session_id`.
What happens: After Stripe returns a session, the app updates the pending order with `stripe_checkout_session_id`; the database schema makes this field unique.
Draw eligibility implication: Each fulfilled entry set can be traced back to one local order and one Stripe Checkout Session.
Evidence: `lib/domain/orders/createPendingOrder.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Flow step: Checkout success page does not fulfill access by itself.
Confidence: Confirmed.
File/route/table/Stripe object: `app/checkout/success/page.tsx`, `app/checkout/cancel/page.tsx`.
What happens: The success page tells the buyer that the processor confirmation links the Daypass, friend codes, and promotional entries to the checkout email; fulfillment is webhook-driven.
Draw eligibility implication: A user landing on the success page is not sufficient proof of eligibility; the webhook/RPC must complete.
Evidence: `app/checkout/success/page.tsx`, `app/checkout/cancel/page.tsx`.

Flow step: Stripe webhook verifies signature and records a sanitized receipt.
Confidence: Confirmed.
File/route/table/Stripe object: `app/api/stripe/webhook/route.ts`, `stripe_webhook_events`, `STRIPE_WEBHOOK_SECRET`.
What happens: The route requires a configured webhook secret, verifies the `stripe-signature` header, inserts or updates a `stripe_webhook_events` row, stores sanitized diagnostics, and returns `duplicate` if the event was already processed.
Draw eligibility implication: Webhook event IDs provide an idempotency and diagnostics ledger without storing raw payment payloads in the app database.
Evidence: `app/api/stripe/webhook/route.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.

Flow step: Only `checkout.session.completed` is fulfilled.
Confidence: Confirmed.
File/route/table/Stripe object: `app/api/stripe/webhook/route.ts`, Stripe event types.
What happens: Any event type other than `checkout.session.completed` is marked `ignored`; completed checkout sessions move to fulfillment.
Draw eligibility implication: Failed, expired, refunded, or disputed payments do not automatically update order or entry eligibility in the inspected code path.
Evidence: `app/api/stripe/webhook/route.ts`.

Flow step: Fulfillment retrieves and validates the paid Checkout Session.
Confidence: Confirmed.
File/route/table/Stripe object: `lib/domain/payments/fulfillCheckout.ts`, Stripe Checkout Session.
What happens: The server retrieves the session from Stripe, requires `status = complete` and `payment_status = paid`, requires purchaser email, validates Campaign 001 offer metadata, validates `daypass_quantity`, validates currency is AUD, and checks `amount_total` against the repo's expected checkout option total.
Draw eligibility implication: Successful entry issuance is protected against unsupported quantities, wrong offers, wrong currency, and mismatched totals.
Evidence: `lib/domain/payments/fulfillCheckout.ts`.

Flow step: Fulfillment generates friend codes and calls a service-role RPC.
Confidence: Confirmed.
File/route/table/Stripe object: `lib/domain/payments/fulfillCheckout.ts`, `lib/domain/access/grantAccess.ts`, `fulfill_daypass_order`.
What happens: The app checks whether the order is already fulfilled, generates `quantity - 1` friend codes only for first fulfillment, then calls the service-role-only `fulfill_daypass_order` RPC with campaign, offer, order, purchaser email, quantity, Stripe IDs, friend code records, and sanitized webhook payload.
Draw eligibility implication: Duplicate processing should not duplicate friend codes or entries; service-role boundaries keep entry creation off the public client.
Evidence: `lib/domain/payments/fulfillCheckout.ts`, `lib/domain/access/grantAccess.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Flow step: RPC creates durable access, codes, entries, and processed webhook state.
Confidence: Confirmed.
File/route/table/Stripe object: `fulfill_daypass_order`, `member_profiles`, `orders`, `order_items`, `access_grants`, `daypass_codes`, `promo_entries`, `promo_campaign_entry_counters`, `stripe_webhook_events`.
What happens: The RPC locks the campaign/order/offer, blocks fulfillment after `entries_close_at`, upserts a member profile by normalized email, creates or updates a Daypass access grant, creates friend codes, reserves sequential entry numbers through `promo_campaign_entry_counters`, inserts one active `promo_entries` row per purchased Daypass, marks the order fulfilled, and marks the webhook processed.
Draw eligibility implication: This is the strongest existing foundation for draw eligibility; it provides campaign-scoped, sequential, order-linked entries.
Evidence: `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Flow step: Business events and confirmation email run after fulfillment.
Confidence: Confirmed.
File/route/table/Stripe object: `lib/domain/payments/fulfillCheckout.ts`, `event_logs`, `outbound_emails`.
What happens: The app logs `checkout_completed`, `order_fulfilled`, `access_grant_created`, `daypass_code_created`, and `promo_entry_issued`, then sends a purchase confirmation email.
Draw eligibility implication: Analytics are useful for operations but should not be treated as canonical eligibility records.
Evidence: `lib/domain/payments/fulfillCheckout.ts`, `lib/db/events.ts`, `lib/domain/email/sendOrderConfirmationEmail.ts`.

Flow step: Duplicate webhook and already fulfilled order behavior.
Confidence: Confirmed.
File/route/table/Stripe object: `stripe_webhook_events.stripe_event_id`, `orders.stripe_checkout_session_id`, `fulfill_daypass_order`.
What happens: A processed Stripe event returns `duplicate`; an already fulfilled order updates the webhook as processed and returns existing counts without new entries/codes. The order schema also enforces a unique Stripe Checkout Session ID.
Draw eligibility implication: Duplicate Stripe delivery is unlikely to inflate entry counts.
Evidence: `app/api/stripe/webhook/route.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Flow step: Webhook failure path.
Confidence: Confirmed.
File/route/table/Stripe object: `app/api/stripe/webhook/route.ts`, `stripe_webhook_events.processing_status`.
What happens: Fulfillment errors mark the webhook row `failed` with a sanitized error and return HTTP 500; no app-side manual replay endpoint was found in this milestone.
Draw eligibility implication: Stripe retries may recover transient failures, but a charge that succeeds while fulfillment repeatedly fails can leave a pending order with no entries until manual or future replay tooling resolves it.
Evidence: `app/api/stripe/webhook/route.ts`, repo search for webhook replay routes.

### 4.3 Draw eligibility from purchases

Current purchase flow readiness for draw eligibility: 7/10

Finding: Successful paid Campaign 001 Daypass purchases can be converted into durable, campaign-scoped entries.
Confidence: Confirmed.
Evidence: `lib/domain/payments/fulfillCheckout.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`.
Explanation: The flow can answer who is eligible through `promo_entries.current_holder_member_profile_id`/`owner_member_profile_id`, how many entries each purchase receives through `order_items.quantity` and one row per Daypass, and which purchase created each entry through `promo_entries.order_id`, `order_item_id`, and optional `daypass_code_id`.

Who is eligible for a draw?
Confidence: Confirmed.
Answer: Fulfilled Campaign 001 purchases create `promo_entries` with `status = active`; draw snapshot code later uses locked active entries. Final eligibility still depends on refund/cancellation/disqualification review before lock.
Evidence: `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`, `lib/domain/draws/buildEligibleEntriesCsv.ts`, `lib/domain/draws/createDrawSnapshot.ts`.

How many entries does each person/ticket receive?
Confidence: Confirmed.
Answer: The checkout quantity is constrained to 1, 5, or 10; fulfillment inserts exactly `p_quantity` promo entries and creates `p_quantity - 1` friend codes.
Evidence: `lib/domain/daypass/pricing.ts`, `app/api/checkout/daypass/route.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

Which purchase/order created each entry?
Confidence: Confirmed.
Answer: `promo_entries` link to `order_id`, `order_item_id`, and for friend entries `daypass_code_id`; `orders` link to Stripe Checkout Session, PaymentIntent, customer ID, purchaser email, source landing page, source slug, and attribution.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

What happens if the payment is refunded?
Confidence: Confirmed.
Answer: `orders.status` and `promo_entries.status` include refunded/cancelled/void/disqualified states, and policy copy describes refund effects, but no Stripe refund webhook handler was found to automatically update eligibility.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `app/api/stripe/webhook/route.ts`, `app/refund-policy/page.tsx`, `app/admin/(dashboard)/campaigns/page.tsx`.

What happens if the charge succeeds but webhook fails?
Confidence: Confirmed.
Answer: The webhook row is marked `failed` and the endpoint returns HTTP 500. Stripe may retry, but no app-side replay endpoint was found. Until fulfillment succeeds, the order can remain pending/attached to a session and no promo entries are created.
Evidence: `app/api/stripe/webhook/route.ts`, `lib/domain/orders/createPendingOrder.ts`.

What happens if the user buys multiple times?
Confidence: Confirmed.
Answer: Each checkout creates a separate pending order and fulfilled orders create their own entries. Fulfillment upserts/links the member profile by normalized checkout email, so repeat purchases with the same email converge to one member profile.
Evidence: `lib/domain/orders/createPendingOrder.ts`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

What happens if the same checkout session/webhook is processed twice?
Confidence: Confirmed.
Answer: The webhook event table is unique by Stripe event ID, processed duplicates return `duplicate`, `orders.stripe_checkout_session_id` is unique, and the RPC returns existing counts for already fulfilled orders without inserting new entries.
Evidence: `app/api/stripe/webhook/route.ts`, `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`.

What happens if a payment is disputed/charged back?
Confidence: Confirmed.
Answer: No dispute/chargeback-specific Stripe handler was found. Operators would need a manual reconciliation/status update process unless future code adds automated event handling.
Evidence: `app/api/stripe/webhook/route.ts`, repo search for `dispute`, `chargeback`, and refund/payment-failure handlers.

What happens if an order is created but no user account exists?
Confidence: Confirmed.
Answer: Checkout does not require a logged-in user. Fulfillment creates or updates `member_profiles` by purchaser email, leaving `user_id` nullable until the buyer signs in with the same email and the profile is linked.
Evidence: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`, `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`, `app/checkout/success/page.tsx`.

Rating explanation: The successful-payment path is well structured and idempotent, with one fulfilled purchase producing a traceable set of entries. The score is not higher because live Stripe objects were not inspectable, refund/dispute/payment-failure handling is not automated into eligibility state, and webhook failure recovery appears diagnostic rather than fully replayable.

## 5. Current promotion, campaign, and entry logic audit

| Route/page | Current purpose | Draw relevance | Issues/gaps | Recommended change | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `/l/sungod`, `/l/campaign-001`, and fallback campaign landing slugs | Public Campaign 001/Sun God acquisition page for Daypass checkout. | Says users buy a Monroes Daypass, browse the members-only deck market, and receive free entry into the Sun God deck promotion with each eligible Daypass. | Uses strong `WIN` and `Live draw` language while prize proof, final timings, legal review, and launch approval are still pending. No race/reveal clarification exists. | Before live draw launch, add final prize/timing/legal copy and the protective statement that any race is only an animated reveal of an already verified result. | Confirmed. | `app/l/[slug]/page.tsx`, `lib/landing-tests/campaign001Fallback.ts`, `components/landing/LandingHero.tsx`, `components/landing/LivePromotionProgressSection.tsx`. |
| Landing Daypass offer/pricing block | Lets users choose 1, 5, or 10 Daypasses and start checkout. | Copy ties quantity to free promo entries and says the Daypass is a 12-hour access product. | Bundle text says `5 free promo entries attached`/`10 free promo entries attached`; rules say each eligible Daypass may receive one entry subject to final rules. No no-purchase path is shown. | Keep the paid product/free-entry distinction, but finalise exact cap, eligibility, refund, no-purchase/free-entry, and bundle wording across all surfaces. | Confirmed. | `components/landing/LandingPricingBlock.tsx`, `components/landing/LandingOfferCard.tsx`, `lib/domain/daypass/pricing.ts`. |
| Landing campaign rules summary | Explains entry mechanics on the public campaign page. | Says `Daypass access first, promo entry second`; promo entries are a free benefit for eligible Daypass purchases; friend redemptions can update holder before draw lock. | Good high-level framing, but still points to final rules and does not define all legal/compliance conditions. | Reuse this as the concise public explanation after final terms are approved. | Confirmed. | `components/landing/CampaignRulesSummary.tsx`, `lib/domain/campaigns/publicContent.ts`. |
| Landing promotion progress/timeline | Shows entry progress and draw timeline. | Says entries open, snapshot locked, transparent random live draw, and winner shipped. | `When the entries fill, the draw goes live` may imply the live event determines the winner in real time. No V1 race/replay wording exists. | For the race reveal, state that the verified random draw determines the result and the race only visualises/replays that result. | Confirmed. | `components/landing/LivePromotionProgressSection.tsx`. |
| `/promo-rules/sungod` | Public promotion rules page. | Defines eligibility, timing, entry method, friend-code attribution, snapshot hash, transparent random-number draw, winner notification, public result publication, refunds, privacy, and no-affiliation wording. | Contains placeholders and caveats: final value pending, final state/territory/permit requirements pending, claim/redraw/delivery handling pending, final legal/operator review pending. No no-purchase/free-entry route found. | Treat as draft rules only; legal/compliance review must finalise terms before any public verified live draw. | Confirmed. | `app/promo-rules/[slug]/page.tsx`, `lib/domain/campaigns/publicContent.ts`. |
| `/draw-results/[slug]` | Public draw result page. | Displays eligible entry count/range, winning entry number, winner alias, snapshot hash, draw method, and public notes. | Current result page is audit-safe but not a full verifier; no manifest, randomness seed/source, algorithm, full ranking, final-20 replay, or race explanation. | Extend or link to a public verification page with manifest hash, randomness proof, deterministic algorithm, and race-as-reveal wording. | Confirmed. | `app/draw-results/[slug]/page.tsx`, `lib/domain/draws/getDrawResultByCampaign.ts`. |
| `/member` | Member dashboard. | Users can see purchases, Daypass access, friend codes, promo entries, entry numbers, public aliases, statuses, and draw timing. | It uses `promo entries`, not `tickets`; it shows entries linked to the authenticated checkout email. No public live draw/race watch requirement or presence requirement is stated. | Reuse for entrant-facing entry visibility and add links to verification/race pages after V1 exists. | Confirmed. | `app/member/page.tsx`, `components/member/PromoEntriesCard.tsx`, `components/member/DrawProcessCard.tsx`, `components/member/MemberOrderHistory.tsx`, `components/member/DaypassCodeList.tsx`. |
| `/checkout/success` and `/checkout/cancel` | Post-checkout customer states. | Success page says it does not fulfil access by itself and entries are linked after payment processor confirmation; cancel page says no payment completed. | Good eligibility caveat, but no draw-specific legal acknowledgement or no-purchase path. | Keep webhook-confirmation caveat and add final promotion-rule links/acceptance if legal review requires. | Confirmed. | `app/checkout/success/page.tsx`, `app/checkout/cancel/page.tsx`. |
| `/` homepage and general marketing offer copy | General Monroes Daypass/Ultra marketing. | Frames Daypass as 12-hour preview access and Ultra as ongoing access. | Homepage offer buttons are marketing UI, not confirmed Stripe checkout for Ultra; homepage copy is not the main draw rules source. | Keep campaign-specific draw promises on campaign/rules pages; avoid homepage implying broader draw eligibility. | Confirmed. | `app/page.tsx`, `lib/site.ts`, `components/marketing/OfferCards.tsx`, `components/marketing/FAQ.tsx`, `components/marketing/HowItWorks.tsx`. |
| `/member/listings` | Private members-only listing access. | Reinforces that Daypass/Ultra access is the purchasable value. | No direct draw gap; useful for separating access purchase from promotion benefit. | Keep access/product copy separate from draw-entry copy. | Confirmed. | `app/member/listings/page.tsx`, `components/preview/MembershipPreviewBlock.tsx`. |
| Transactional emails | Purchase confirmation and code-redemption copy. | Purchase email states Daypass quantity, promo entry count, planned draw timing, entries not sold separately, and attribution-lock behavior. | Emails do not include live race/reveal clarification and rely on final timing/rules being present. | Update email copy before V1 so entrants receive consistent verified-draw and race-as-reveal wording. | Confirmed. | `lib/domain/email/templates.ts`, `lib/domain/email/sendOrderConfirmationEmail.ts`. |
| Admin campaign/draw pages | Operator-only reconciliation and draw workflow. | Admin copy describes entry ledger, refund/cancel review, draw lock, snapshot, manual live draw result, and safe winner details. | Internal copy confirms refund/revocation rules are not automated and final legal rules must be applied before snapshot. | Use admin copy as operational checklist seed; V1 needs explicit pre-draw reconciliation steps and deterministic draw-run state. | Confirmed. | `app/admin/(dashboard)/campaigns/page.tsx`, `app/admin/(dashboard)/entries/page.tsx`, `app/admin/(dashboard)/draws/page.tsx`. |

Summary: The current site supports a clear basic eligibility story: customers buy Daypass access, and eligible Daypass purchases may receive free promotional entries. The current entrant concept is `promo_entries`, shown to members as entry numbers and public aliases rather than `tickets`. Users can view entries, purchases, friend Daypass codes, and draw timing from `/member`. No wording found says entrants must be present for the draw. The repo does not currently contain a no-purchase/free-entry route or copy. Campaign timing is partly dynamic through `promo_campaigns` fields, but fallback public content still uses placeholder `To be announced before launch` values.

## 6. Admin system audit

Finding: Admin routes are protected server-side by Supabase Auth plus an `admin_profiles` allow-list.
Confidence: Confirmed.
Evidence: `lib/auth/admin.ts` calls `supabase.auth.getUser()` and then checks `admin_profiles`; `app/admin/(dashboard)/layout.tsx` redirects unauthenticated users to `/admin/login` and renders an access-denied state for authenticated non-admin users; `supabase/migrations/20260512000000_create_core_schema.sql` creates `admin_profiles` and `public.is_admin()`.
Risk/limitation: `admin_profiles.role` exists, but current repo code treats any matching profile as `status: "admin"`; no granular `draw_operator`, `draw_reviewer`, or `draw_publisher` role enforcement was found.
Recommendation: Extend the existing admin gate for V1, then add explicit role/permission checks only if the draw operation needs separation of duties.

Finding: Admin-only draw mutations are server-enforced through admin API route handlers, not only hidden in the UI.
Confidence: Confirmed.
Evidence: `app/api/admin/draws/lock/route.ts`, `app/api/admin/draws/snapshot/route.ts`, and `app/api/admin/draws/result/route.ts` all call `getAdminAuthState()` and reject non-admin users before calling server-only domain functions.
Risk/limitation: The current operations are POST form actions with redirect messages; they do not yet model a full verified draw lifecycle with dry-run, operator confirmation, idempotency keys, signed publish records, or two-person approval.
Recommendation: Reuse these protected route patterns for draw preview/lock/execute/publish actions, but add idempotency and immutable audit records before production use.

Finding: The admin navigation and page set already includes operational surfaces for campaigns, orders, entries, codes, draws, exports, events, funnels, leads, and tests.
Confidence: Confirmed.
Evidence: `components/admin/AdminNav.tsx`, `app/admin/(dashboard)/campaigns/page.tsx`, `app/admin/(dashboard)/orders/page.tsx`, `app/admin/(dashboard)/entries/page.tsx`, `app/admin/(dashboard)/codes/page.tsx`, `app/admin/(dashboard)/draws/page.tsx`, `app/admin/(dashboard)/exports/page.tsx`, `app/admin/(dashboard)/events/page.tsx`.
Risk/limitation: These pages can expose private emails, payment references, code last-four support context, and operational notes to admins; none of those fields are public-verification-safe.
Recommendation: Keep eligibility review in admin, and build a separate redacted public draw manifest/verifier payload rather than exposing admin reports.

Finding: Admins can currently review the main eligibility inputs: orders, order items/quantity, campaign context, promo entries, entry status, entry lock state, Daypass code attribution, webhook diagnostics, outbound email diagnostics, and internal exports.
Confidence: Confirmed.
Evidence: `lib/db/admin-v1-reports.ts`, `app/admin/(dashboard)/campaigns/page.tsx`, `app/admin/(dashboard)/orders/page.tsx`, `app/admin/(dashboard)/entries/page.tsx`, `app/admin/(dashboard)/codes/page.tsx`, `app/api/admin/export/route.ts`.
Risk/limitation: Report helpers cap results for practical admin use, and refund/cancellation consequences are still described as operator-defined; this is not yet a deterministic eligibility reconciliation workflow.
Recommendation: Add a draw-specific reconciliation screen that clearly shows included/excluded counts, late/refunded/disputed/manual-review entries, and the exact final manifest inputs before lock.

Finding: A manual `/admin/draws` workflow already exists for lock, snapshot, CSV hash, and manual result recording.
Confidence: Confirmed.
Evidence: `app/admin/(dashboard)/draws/page.tsx` renders workflow cards for locking entries, creating snapshots, and recording results; `lib/domain/draws/lockCampaignEntries.ts`, `lib/domain/draws/createDrawSnapshot.ts`, `lib/domain/draws/getDrawSnapshotCsv.ts`, and `lib/domain/draws/recordDrawResult.ts` perform the server-side operations.
Risk/limitation: Current draw workflow records a manually supplied winning entry and method; it does not fetch public randomness, generate deterministic ranking, store all-entry elimination order, store final-20 replay data, or publish public verifier records.
Recommendation: Extend `/admin/draws` first, and add `/admin/draws/[drawId]` only when multiple draw runs or detailed draw-run states need their own page.

Finding: Service-role Supabase usage is concentrated in server-only helpers and domain/report modules.
Confidence: Confirmed.
Evidence: `lib/supabase/admin.ts` is marked `server-only` and reads `SUPABASE_SERVICE_ROLE_KEY`; draw/admin modules call `createAdminSupabaseClient()` from server route handlers or server components.
Risk/limitation: Some public-facing server pages also use admin reads for public-safe projections; every future public draw route must keep redaction explicit and must never pass service-role-derived private fields to client components.
Recommendation: Keep privileged draw generation in server-only modules, return narrow public DTOs, and add tests/fixtures for public response redaction before launch.

Finding: Audit logging exists, but it is partial rather than a dedicated verified-draw audit ledger.
Confidence: Confirmed.
Evidence: `app/api/admin/export/route.ts` inserts `export_logs`; `lib/domain/draws/createDrawSnapshot.ts` logs `draw_snapshot_created` to `event_logs`; `lib/domain/draws/recordDrawResult.ts` logs `draw_completed`; `supabase/migrations/20260512000000_create_core_schema.sql` creates `event_logs` and `export_logs`.
Risk/limitation: Current logs do not fully capture before/after state, admin actor, deterministic algorithm version, randomness source, manifest hash, publish state, and replay artifact hashes in one immutable draw-specific trail.
Recommendation: Add a `draw_audit_events` or equivalent append-only table for V1 operations, linked to draw IDs and public verifier records.

Best admin integration path: Extend existing admin area, specifically `/admin/draws`, because the project already has a protected admin shell, draw navigation, entry/order reconciliation pages, snapshot/hash workflow, and admin-only API route pattern.

## 7. Terms, policies, and legal/compliance copy audit

Note: This audit is not legal advice. Final trade-promotion terms, permit/authority needs, no-purchase-entry requirements, state-specific rules, winner publication rules, prize substantiation, and electronic draw compliance should be reviewed by an appropriate legal/compliance professional before real public use.

Protective wording concept required before a race reveal: The verified random draw determines the result. The live race is an animated reveal of the already-determined result and does not alter the outcome. Similar wording was not found in the inspected repo copy.

| Document/page | Relevant wording found | Risk/gap | Recommendation | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- |
| `/terms` | Terms explain access products, member access, promotional entries, checkout flows, refunds, privacy, and support; final legal review required; entries are not sold separately. | Good product/entry separation, but terms defer details to applicable promotion rules and do not address race/replay wording, no-purchase entry, or specific trade-promotion permits. | Add final promotion-specific references once legal review finalises no-purchase, permit, live/electronic draw, winner publication, and race-reveal language. | Confirmed. | `app/terms/page.tsx`. |
| `/privacy` | Privacy notice says payment/member/access/promo-entry records may be collected and used to operate promotion records; code/payment secrets must not go to analytics. | Does not explicitly address public display of entry numbers, display aliases, initials, final-20 boards, race entrants, winner alias/name, or public verification artifacts. | Add a public draw/verification display clause that names exactly which non-sensitive fields may be published and how removal/support requests are handled. | Confirmed. | `app/privacy/page.tsx`. |
| `/refund-policy` | Refund policy says refunds may revoke access/codes and related promotional eligibility; failures/cancellations/abandoned sessions do not create active entries; redeemed friend codes may require manual review. | Good conceptual coverage, but current Stripe automation does not enforce all refund/dispute impacts automatically. | Align final policy with implemented operational workflow and require pre-lock refund/dispute reconciliation. | Confirmed. | `app/refund-policy/page.tsx`, `app/api/stripe/webhook/route.ts`. |
| `/promo-rules/sungod` | Rules include promoter details, Australia-only 18+ eligibility, final state/territory/permit review, dynamic timing fields, entry method, friend-code attribution, snapshot hash, transparent random-number draw, public result publication, refunds, and privacy limits. | Rules are clearly draft: final value, prize proof, state/territory requirements, claim window, redraw timing, delivery, and unclaimed-prize handling remain pending. No no-purchase/free-entry method was found. | Treat as non-final. Legal/compliance must complete all placeholders before public launch or paid traffic. | Confirmed. | `app/promo-rules/[slug]/page.tsx`. |
| Campaign public content/config | Public content says prize proof/value/timing/eligibility are pending and that final operator/legal approval is required before launch. | Useful warnings are internal/public placeholders, but they mean the current campaign is not launch-ready. | Do not launch V1 until config/content warnings are resolved and reflected in final rules. | Confirmed. | `lib/domain/campaigns/config.ts`, `lib/domain/campaigns/publicContent.ts`. |
| Landing progress/live draw copy | Says Monroes locks eligible entry snapshot, runs a transparent live draw, and ships the deck free to the winner after claim confirmation. | For a future race reveal, current wording could let viewers infer the race determines the outcome. | Add the protective wording concept wherever the live race/reveal is described. | Confirmed. | `components/landing/LivePromotionProgressSection.tsx`, `components/landing/LandingHero.tsx`. |
| Public draw result page | Public result copy limits output to snapshot hash, eligible count, winning entry number, public alias, and draw method; it says emails, full names, codes, payment IDs, and private purchaser info are excluded. | Strong privacy posture, but no full verifier details and no race/replay explanation. | Expand to include public-safe verifier data and race-as-replay wording; continue excluding PII/payment/code secrets. | Confirmed. | `app/draw-results/[slug]/page.tsx`. |
| Member dashboard and account copy | Members can view linked entries, entry numbers, public aliases, statuses, purchases, codes, and draw process. | Member copy does not currently explain public display implications for live elimination board/final-20 race. | Add account-level expectations for which entry aliases/numbers may appear publicly during a verified live draw. | Confirmed. | `app/member/page.tsx`, `components/member/PromoEntriesCard.tsx`, `components/member/DrawProcessCard.tsx`. |
| Transactional purchase and code emails | Purchase email states promo entry count, planned draw, entries not sold separately, private code handling, and attribution lock timing. | Emails are part of customer-facing terms context but do not include race/reveal wording or no-purchase path. | Update before V1 launch so post-purchase emails match final rules and verified-draw mechanics. | Confirmed. | `lib/domain/email/templates.ts`. |
| State-specific Australian trade-promotion references | Copy references Australia-only, Australian residents 18+, Australian Consumer Law, and final state/territory/permit requirements. | No specific Australian state/territory authority, permit number, draw approval, publication rule, or no-purchase-entry rule was found. | Have legal/compliance determine jurisdiction-specific requirements and add concrete terms/permit details if required. | Confirmed for repo copy; Unknown for external legal work. | `app/promo-rules/[slug]/page.tsx`, `app/refund-policy/page.tsx`, `lib/domain/campaigns/publicContent.ts`. |
| Race/animation wording | No `race`, `animated`, or equivalent reveal wording was found in campaign/legal copy. | Future race reveal could be misleading unless copy states it is only visualising a pre-determined verified result. | Add the protective wording concept to rules, live draw page, race room, result page, emails, and any livestream/host script. | Confirmed. | Repo search for `race`, `animated`, `animation`; `components/marketing/ScrollReveal.tsx` only uses animation internally for UI reveal effects. |

## 8. Frontend integration audit

Route: `/draws`
Purpose: Public draw index/status hub for active and archived draws; optional for V1 if there is only one campaign.
Public/private/admin: Public.
Data needed: Published draw metadata, campaign slug/name/status, scheduled live time, result/verification availability.
Existing components/layouts to reuse: App Router public page pattern, Tailwind card/metric styling from `app/draw-results/[slug]/page.tsx`, campaign status concepts from `components/landing/LivePromotionProgressSection.tsx`.
New components needed: Draw list/status cards, empty state, archived/current filtering if more than one campaign is published.
SEO/indexing recommendation: Index only once there is a real public draw archive; otherwise defer or noindex until multiple public draws exist.
Privacy considerations: Show only campaign-level metadata and aggregate counts; no entrant records.
Confidence: Likely.

Route: `/draws/[slug]`
Purpose: Public campaign-scoped draw hub with status, schedule, entry lock state, links to live/result/verify pages, and plain-language explanation.
Public/private/admin: Public.
Data needed: Campaign metadata, public status, entries closed/lock/draw timestamps, published aggregate counts, result availability, verification availability.
Existing components/layouts to reuse: `app/draw-results/[slug]/page.tsx`, `components/landing/LivePromotionProgressSection.tsx`, `components/landing/CampaignRulesSummary.tsx`.
New components needed: Draw status hero, phase timeline, public-safe draw facts panel, links to live/results/verify.
SEO/indexing recommendation: Index after campaign/draw details are finalized; keep stale draft campaigns noindexed or inaccessible.
Privacy considerations: No emails, member IDs, payment IDs, code IDs, code last-four, or internal order IDs.
Confidence: Likely.

Route: `/draws/[slug]/live`
Purpose: Public live draw room showing the elimination board and final-20 animated race reveal.
Public/private/admin: Public.
Data needed: Published or scheduled draw run state, public manifest count/hash, redacted entrant aliases/entry numbers or replay-safe labels, elimination batches, final-20 order/replay events, live phase/status, fallback result state.
Existing components/layouts to reuse: Public App Router page style, `components/marketing/ScrollReveal.tsx` reduced-motion pattern, metric/card styling from `app/draw-results/[slug]/page.tsx`.
New components needed: Elimination board, progress counters, phase controller, final-20 race lanes, replay timeline loader, reduced-motion static reveal, loading/error/offline states.
SEO/indexing recommendation: Noindex during live/pre-live operation; after completion, link to indexable results/verification archive instead of treating the live room as the canonical result page.
Privacy considerations: Use only public alias, entry number, public row hash, and aggregate status. If a final-20 entrant display is used, make that public-display rule explicit in terms/copy before launch.
Confidence: Likely.

Route: `/draws/[slug]/verify`
Purpose: Public verification/audit page for manifest hash, randomness proof, deterministic algorithm/version, result ranking hash, replay artifact hash, and recomputation instructions.
Public/private/admin: Public.
Data needed: Public manifest metadata, manifest hash, public manifest file or row hashes, randomness source/seed/proof, algorithm version, deterministic ranking/result hash, draw audit event summary, result/replay links.
Existing components/layouts to reuse: `app/draw-results/[slug]/page.tsx` audit-detail styling, public legal/copy patterns from `app/promo-rules/[slug]/page.tsx`.
New components needed: Verifier facts table, copyable hashes, downloadable public manifest/verifier payload, algorithm explanation, verification failure/unknown states.
SEO/indexing recommendation: Index after draw publication; make this the canonical public audit page for V1.
Privacy considerations: Public verifier data must be deliberately redacted and should not include private CSV contents from the existing admin snapshot flow.
Confidence: Likely.

Route: `/draws/[slug]/results`
Purpose: Public archived result and replay page after draw completion.
Public/private/admin: Public.
Data needed: Winning entry number, winner alias/public display name, public result notes, eligible count/range, final ranking summary, replay availability, verifier link.
Existing components/layouts to reuse: `app/draw-results/[slug]/page.tsx`, `lib/domain/draws/getDrawResultByCampaign.ts`.
New components needed: Replay summary, final-20 recap, links back to live replay and verification, race-as-reveal disclaimer.
SEO/indexing recommendation: Index after result publication; keep current `/draw-results/[slug]` as a legacy alias/redirect or compatibility route.
Privacy considerations: Continue current exclusions for emails, full names, Daypass codes, code hashes, encrypted code data, payment processor identifiers, and private purchaser information.
Confidence: Likely.

Route: `/admin/draws`
Purpose: Existing admin draw operations area; recommended V1 home for preview, reconciliation, lock, execute, publish, and verify controls.
Public/private/admin: Admin.
Data needed: Campaign selection, eligibility counts, entry status breakdown, refund/dispute/manual-review flags, locked manifest hash, randomness proof, draw run status, publish state, audit events.
Existing components/layouts to reuse: `components/admin/AdminShell.tsx`, `components/admin/AdminNav.tsx`, `components/admin/MetricCard.tsx`, `components/admin/EmptyState.tsx`, `components/admin/TableScrollHint.tsx`, current `app/admin/(dashboard)/draws/page.tsx`.
New components needed: Draw run state machine panels, manifest preview, randomness fetch/record control, deterministic execution summary, publish checklist, operator confirmation states.
SEO/indexing recommendation: Already noindex through `app/admin/layout.tsx`; keep private.
Privacy considerations: Admin may see PII/internal IDs for reconciliation, but publish controls must display an explicit public/private field boundary.
Confidence: Confirmed.

Route: `/admin/draws/[drawId]`
Purpose: Optional admin detail page for one draw run, useful once draw runs become durable first-class records.
Public/private/admin: Admin.
Data needed: Draw record, manifest snapshot, randomness proof, ranking/replay artifacts, audit events, publish history, operator notes.
Existing components/layouts to reuse: Existing admin shell/nav and draw workflow components.
New components needed: Draw-run detail header, immutable artifact table, audit event timeline, dry-run/live-run/publish controls.
SEO/indexing recommendation: Private/noindex.
Privacy considerations: Same admin-only PII boundary as `/admin/draws`; never expose internal manifest CSV directly to public routes.
Confidence: Likely.

Route: `/account/entries`
Purpose: Entrant-facing entry list in the user prompt's target route set.
Public/private/admin: Private/member if implemented.
Data needed: Authenticated member profile, entries, campaign names, entry numbers, public aliases, statuses, draw links, order/code context where safe.
Existing components/layouts to reuse: Current `/member` route, `components/member/PromoEntriesCard.tsx`, `components/member/DrawProcessCard.tsx`, `lib/domain/members/summaries.ts`.
New components needed: Only needed if the app adopts an `/account` route namespace; otherwise extend `/member` or add `/member/entries`.
SEO/indexing recommendation: Private/noindex; do not index account/member entry data.
Privacy considerations: Display only the signed-in user's entries and avoid exposing other entrants or payment details.
Confidence: Unknown.

Finding: The current visual system can support a verified draw room, but the live experience should be purpose-built rather than squeezed into the admin/report card layout.
Confidence: Confirmed.
Evidence: `app/draw-results/[slug]/page.tsx`, `components/landing/LivePromotionProgressSection.tsx`, `components/admin/MetricCard.tsx`, `components/admin/EmptyState.tsx`, `components/member/PromoEntriesCard.tsx`, Tailwind dependency in `package.json`.
Implication: Reuse typography, cards, counters, and status language, but build custom full-width live draw sections for the elimination board and final-20 race.

Finding: Three.js/React Three Fiber is not currently installed; GSAP is installed and the project already checks `prefers-reduced-motion`.
Confidence: Confirmed.
Evidence: `package.json`, `package-lock.json`, `components/marketing/ScrollReveal.tsx`, repo search for `three` and `@react-three`.
Implication: Adding Three.js for V1 is not recommended. A 2D/2.5D CSS/GSAP/SVG/canvas implementation is faster, easier to verify, more accessible, and more aligned with the V1 scope guard.

Recommended V1 animation implementation approach: Use a deterministic server-generated replay payload. Render early eliminations as a batched grid/tile board with counters and phase progress. Render the final 20 as lane-based 2D/2.5D racers whose positions are purely a replay of the already-determined ranking. Provide a reduced-motion fallback that shows ordered elimination/final-20 reveal steps without continuous motion.

Loading/error/empty states needed: draw not scheduled, entries still open, entries locked but draw not started, live draw in progress, result pending, result published, verification unavailable, manifest/hash mismatch, replay artifact unavailable, reduced-motion mode, and network/manual-refresh recovery.

Account entries recommendation: Defer `/account/entries` for V1 unless the product is moving from `/member` to `/account`. The existing `/member` dashboard already shows promo entries and draw timing and is the lower-risk entrant-facing surface.

Best public route structure: `/draws/[slug]`, `/draws/[slug]/live`, `/draws/[slug]/verify`, and `/draws/[slug]/results`, with existing `/draw-results/[slug]` kept as a compatibility route or redirect after migration.

## 9. Verified draw engine blueprint

Recommended design status: Blueprint only. Do not create these tables/routes until implementation milestones begin.

Target lifecycle:

1. Admin creates a draw for a campaign.
2. Admin previews eligible entries from `promo_entries`, `orders`, `order_items`, `daypass_codes`, and `member_profiles`.
3. Admin locks entries after `draw_lock_at` and after refund/dispute reconciliation.
4. System creates a canonical entrant manifest.
5. System hashes the manifest.
6. At draw time, system fetches verifiable public randomness.
7. System derives the final seed from manifest hash, public randomness, draw ID, and algorithm version.
8. System deterministically ranks every entry.
9. System stores full ranking and prize assignments.
10. System publishes a redacted public verification record.
11. Public live page replays the elimination board and final-20 race from stored replay data.
12. Public verification page exposes enough data for independent recomputation.
13. Admin can download an audit pack.

### Recommended data objects

Table name: `draws`
Purpose: First-class draw run/configuration record.
Columns: `id`, `campaign_id`, `slug`, `title`, `status`, `scheduled_at`, `entries_close_at`, `lock_after_at`, `locked_at`, `executed_at`, `published_at`, `voided_at`, `void_reason`, `algorithm_version`, `randomness_strategy`, `created_by`, `locked_by`, `executed_by`, `published_by`, `created_at`, `updated_at`.
Indexes: Unique `(campaign_id, slug)`, `(campaign_id, status)`, `(status, scheduled_at)`, `(published_at)`.
RLS policy approach: RLS enabled. Admin/service-role full access through server-only code. Public read only for published draw summary via narrow query or public verification table.
Public/private: Private by default; public-safe fields can be projected after publish.
Created by: Admin create action.
Read by: Admin pages; public draw hub after publish/schedule if safe.
Updated by: Admin/server state transitions only.
Existing systems it connects to: `promo_campaigns`, `admin_profiles`, current `/admin/draws` workflow.
Reason needed: Current campaign records do not model a durable draw execution lifecycle.
Risk if omitted: Draw execution state remains scattered across campaign/snapshot/result rows and is hard to audit or recover.

Table name: `draw_entries`
Purpose: Private draw-specific inclusion/exclusion ledger derived from `promo_entries`.
Columns: `id`, `draw_id`, `promo_entry_id`, `entry_number`, `display_alias`, `owner_member_profile_id`, `current_holder_member_profile_id`, `order_id`, `order_item_id`, `daypass_code_id`, `source_status`, `eligibility_status`, `exclusion_reason`, `included_at`, `locked_at`, `created_at`.
Indexes: Unique `(draw_id, promo_entry_id)`, unique `(draw_id, entry_number)`, `(draw_id, eligibility_status)`, `(order_id)`, `(current_holder_member_profile_id)`.
RLS policy approach: RLS enabled. Admin/service-role only. No public direct read because private IDs and eligibility notes can expose customer context.
Public/private: Private.
Created by: Eligibility preview/lock service.
Read by: Admin reconciliation and server draw engine.
Updated by: Admin/server only before lock; immutable after lock except void status through audit-controlled path.
Existing systems it connects to: `promo_entries`, `orders`, `order_items`, `member_profiles`, `daypass_codes`.
Reason needed: Separates draw-run eligibility decisions from mutable operational source tables.
Risk if omitted: Later source-table changes could change what the draw "meant" after it was locked.

Table name: `draw_entry_snapshots`
Purpose: Immutable canonical per-entry manifest rows and eventual ranking fields.
Columns: `id`, `draw_id`, `draw_entry_id`, `manifest_index`, `entry_number`, `public_entry_id`, `public_display_label`, `canonical_row_json`, `row_hash`, `final_rank`, `elimination_position`, `prize_code`, `is_winner`, `created_at`.
Indexes: Unique `(draw_id, manifest_index)`, unique `(draw_id, public_entry_id)`, unique `(draw_id, row_hash)`, `(draw_id, final_rank)`, `(draw_id, elimination_position)`.
RLS policy approach: RLS enabled. Admin/service-role full read. Public read only through redacted published endpoints or public manifest artifact.
Public/private: Mixed; private canonical row may include internal references, public projection must not.
Created by: Manifest creation service.
Read by: Draw engine, replay generator, admin audit pack, public verifier projection.
Updated by: Ranking engine only once per draw; thereafter immutable unless a draw is voided with audit trail.
Existing systems it connects to: `draw_entries`, current `buildEligibleEntriesCsv`/`hashCsvSha256` concepts.
Reason needed: Stores exact row order and row hashes used by the deterministic algorithm.
Risk if omitted: Public verification cannot prove the exact entrant set and order used.

Table name: `draw_manifest_files`
Purpose: Stores manifest artifact metadata and, depending on storage choice, the canonical private/public manifest payloads.
Columns: `id`, `draw_id`, `artifact_type`, `format`, `storage_path`, `content_sha256`, `byte_length`, `entry_count`, `canonicalization_version`, `created_by`, `created_at`.
Indexes: `(draw_id, artifact_type)`, unique `(draw_id, artifact_type, content_sha256)`.
RLS policy approach: RLS enabled. Private artifact admin-only. Public artifact readable only after publish and only if it contains no PII/private IDs.
Public/private: Both, separated by `artifact_type` and storage bucket/policy.
Created by: Manifest service.
Read by: Admin audit pack, public verifier page for redacted artifacts.
Updated by: Never; new artifact rows only.
Existing systems it connects to: `draws`, Supabase Storage if used, existing CSV snapshot download pattern.
Reason needed: Avoids storing large files directly in result rows and makes audit pack reproducible.
Risk if omitted: Large manifest/replay payloads become hard to serve, hash, download, and retain.

Table name: `draw_randomness_proofs`
Purpose: Stores public randomness source evidence and verification metadata.
Columns: `id`, `draw_id`, `source`, `source_version`, `requested_at`, `received_at`, `scheduled_round_or_request_id`, `public_random_value`, `raw_response_json`, `signature`, `public_key_or_chain_hash`, `verification_status`, `verification_error`, `final_seed_sha256`, `created_at`.
Indexes: Unique `(draw_id, source)`, `(source, scheduled_round_or_request_id)`, `(draw_id, verification_status)`.
RLS policy approach: RLS enabled. Admin/service-role write. Public read of proof fields after publish; hide API keys and any private request metadata.
Public/private: Mostly public after publish, with sensitive request/auth details redacted.
Created by: Randomness adapter at execution time.
Read by: Ranking engine, admin audit pack, public verifier.
Updated by: Verification status only before execution is finalized; immutable after result publish.
Existing systems it connects to: New randomness adapter; no current equivalent found.
Reason needed: Draw cannot be independently verified without source, value, signature/round, and final seed.
Risk if omitted: Users must trust Monroes' internal RNG and cannot verify fairness.

Table name: `draw_results`
Purpose: Extend or replace current manual result table with deterministic ranking summary and prize assignments.
Columns: `id`, `draw_id`, `ranking_sha256`, `ranking_artifact_id`, `winner_draw_entry_snapshot_id`, `winner_entry_number`, `winner_public_label`, `prize_count`, `prize_assignments_json`, `result_status`, `result_generated_at`, `created_by`, `created_at`.
Indexes: Unique `(draw_id)`, `(winner_entry_number)`, `(result_status)`.
RLS policy approach: RLS enabled. Admin/service-role write. Public read of published/redacted summary via public result/verification endpoints.
Public/private: Mixed; result summary public, internal references private.
Created by: Deterministic ranking engine.
Read by: Admin, public result page, live replay, verification page.
Updated by: Publish/void workflow only; never manually edit winner fields.
Existing systems it connects to: Existing `draw_results`, `recordDrawResult.ts`, `getDrawResultByCampaign.ts`.
Reason needed: Current `draw_results` accepts a manual winning entry and lacks full ranking proof.
Risk if omitted: Public live race can appear to choose the winner or depend on manual operator input.

Table name: `draw_audit_events`
Purpose: Append-only operational audit trail for draw actions and artifacts.
Columns: `id`, `draw_id`, `event_type`, `actor_admin_profile_id`, `actor_kind`, `event_payload_json`, `artifact_sha256`, `previous_event_hash`, `event_hash`, `created_at`.
Indexes: `(draw_id, created_at)`, `(draw_id, event_type)`, unique `(draw_id, event_hash)`.
RLS policy approach: RLS enabled. Admin/service-role insert/read. Public read only of a redacted summary if useful for verification.
Public/private: Private with public summary possible.
Created by: Every admin/server draw operation.
Read by: Admin audit pack and support investigations.
Updated by: Never.
Existing systems it connects to: `event_logs`, `export_logs`, `admin_profiles`.
Reason needed: Current event logs are helpful but not a canonical immutable draw audit ledger.
Risk if omitted: Reruns, voids, failed randomness calls, and admin actions become difficult to prove.

Table name: `draw_replay_events`
Purpose: Stores the public replay script for elimination board and final-20 race.
Columns: `id`, `draw_id`, `sequence`, `phase`, `starts_at_ms`, `duration_ms`, `public_entry_id`, `entry_number`, `rank`, `wave_number`, `lane`, `visual_seed`, `event_payload_json`, `created_at`.
Indexes: `(draw_id, sequence)`, `(draw_id, phase, sequence)`, `(draw_id, public_entry_id)`.
RLS policy approach: RLS enabled. Admin/service-role write. Public read only after draw is published or live state allows replay.
Public/private: Public-safe only; no private IDs or emails.
Created by: Replay generation service from final ranking.
Read by: Public live page, results replay, admin preview.
Updated by: Never after publish; regenerate only before publish with audit event.
Existing systems it connects to: Future `/draws/[slug]/live`; GSAP/reduced-motion frontend pattern.
Reason needed: Proves animation is a replay of stored result data, not a live randomizer.
Risk if omitted: The race/board could be perceived as determining the outcome.

Table name: `draw_public_verification_records`
Purpose: Single public verifier DTO for a published draw.
Columns: `id`, `draw_id`, `public_slug`, `status`, `published_at`, `manifest_sha256`, `public_manifest_sha256`, `randomness_source`, `randomness_proof_id`, `public_random_value`, `final_seed_sha256`, `algorithm_version`, `ranking_sha256`, `replay_sha256`, `winner_entry_number`, `winner_public_label`, `verification_json`, `created_at`, `updated_at`.
Indexes: Unique `(draw_id)`, unique `(public_slug)`, `(status, published_at)`.
RLS policy approach: RLS enabled. Public `select` only for `status = 'published'`; writes service-role/admin server only.
Public/private: Public, but deliberately redacted.
Created by: Publish workflow.
Read by: Public verification page, public result page, audit pack.
Updated by: Publish/void workflow only with audit event.
Existing systems it connects to: Existing `/draw-results/[slug]` page, proposed `/draws/[slug]/verify`.
Reason needed: Public verification should not query private draw tables directly.
Risk if omitted: Public pages may accidentally leak private manifest data or become hard to verify independently.

### Recommended server functions, APIs, and server actions

Name/path: `createDraw` / future admin route action for `/admin/draws`
Purpose: Create a draft draw linked to a campaign.
Auth required: Admin.
Input: `campaign_id` or slug, title, schedule, algorithm version, randomness strategy.
Output: Draw ID/status.
Side effects: Inserts `draws`; logs `draw_audit_events`.
Idempotency requirements: Idempotency key per campaign/scheduled draw to avoid duplicate active draws.
Failure handling: Return validation errors; do not create partial child rows.
Existing pattern/file to reuse, if found: `app/admin/(dashboard)/draws/page.tsx`, `lib/auth/admin.ts`.

Name/path: `previewEligibleEntries(drawId)`
Purpose: Load proposed eligible/excluded entries before lock.
Auth required: Admin.
Input: Draw ID and optional filters.
Output: Counts, included/excluded preview rows, refund/dispute/manual-review warnings.
Side effects: None for read-only preview, or optional draft `draw_entries` refresh before lock.
Idempotency requirements: Read-only preview should be repeatable.
Failure handling: Surface missing campaign, unlocked timing, webhook gaps, or refund-review blockers.
Existing pattern/file to reuse, if found: `lib/db/admin-v1-reports.ts`, `app/admin/(dashboard)/entries/page.tsx`, `app/admin/(dashboard)/orders/page.tsx`.

Name/path: `POST /api/admin/draws/[drawId]/lock`
Purpose: Freeze eligible draw entries after lock time and reconciliation.
Auth required: Admin.
Input: Draw ID, reconciliation confirmation, optional operator notes.
Output: Locked count, excluded count, lock timestamp.
Side effects: Inserts/updates `draw_entries`, sets `draws.locked_at/status`, logs audit event.
Idempotency requirements: Repeated call returns existing lock result; must not relock with different entry set.
Failure handling: Block before `draw_lock_at`, with unlocked attribution, missing reconciliation, or zero eligible entries.
Existing pattern/file to reuse, if found: `app/api/admin/draws/lock/route.ts`, `lib/domain/draws/lockCampaignEntries.ts`.

Name/path: `createCanonicalManifest(drawId)`
Purpose: Build private and public canonical manifest artifacts.
Auth required: Admin/server only.
Input: Draw ID.
Output: Manifest artifact IDs, entry count, private/public SHA-256 hashes.
Side effects: Inserts `draw_entry_snapshots` and `draw_manifest_files`; logs audit event.
Idempotency requirements: Same locked entries and canonicalization version must produce the same hash; repeated calls should return existing artifact unless explicitly voided before execution.
Failure handling: Fail closed on canonicalization mismatch, missing locked entries, duplicate entry numbers, or private-field leakage in public manifest.
Existing pattern/file to reuse, if found: `lib/domain/draws/buildEligibleEntriesCsv.ts`, `lib/domain/draws/hashCsvSha256.ts`, `lib/domain/draws/createDrawSnapshot.ts`.

Name/path: `fetchDrawRandomness(drawId)`
Purpose: Fetch and verify public randomness for the draw.
Auth required: Admin/server only.
Input: Draw ID, expected source, expected drand round or Random.org request metadata.
Output: Randomness proof ID, public random value, final seed hash.
Side effects: Inserts `draw_randomness_proofs`; logs audit event.
Idempotency requirements: One accepted randomness proof per draw unless voided; never allow "try again" after ranking is visible.
Failure handling: Store failed attempts with error status; use documented fallback only through audited operator action before ranking.
Existing pattern/file to reuse, if found: New adapter needed; follow server-only patterns from `lib/domain/payments/stripe.ts`.

Name/path: `executeDeterministicRanking(drawId)`
Purpose: Generate full ranking and prize assignments.
Auth required: Admin/server only.
Input: Draw ID.
Output: Ranking hash, winner(s), result ID.
Side effects: Updates `draw_entry_snapshots.final_rank`, inserts/updates `draw_results`, logs audit event.
Idempotency requirements: Same manifest, seed, and algorithm version must reproduce identical ranking; repeated call returns existing result.
Failure handling: Abort if manifest hash, randomness proof, or algorithm version is missing; rollback/avoid partial ranks.
Existing pattern/file to reuse, if found: `lib/domain/draws/recordDrawResult.ts` validation approach, but do not reuse manual winner input behavior.

Name/path: `generateDrawReplay(drawId)`
Purpose: Generate elimination board waves and final-20 race replay events from stored ranking.
Auth required: Admin/server only.
Input: Draw ID, replay version, visual timing config.
Output: Replay artifact hash and event count.
Side effects: Inserts `draw_replay_events` and replay artifact metadata; logs audit event.
Idempotency requirements: Same ranking and replay config must produce identical replay events.
Failure handling: Result remains valid even if replay generation fails; admin can regenerate replay before publish with audit trail.
Existing pattern/file to reuse, if found: New service needed; frontend can later reuse `components/marketing/ScrollReveal.tsx` motion guard.

Name/path: `POST /api/admin/draws/[drawId]/publish`
Purpose: Publish redacted public verification/result/replay records.
Auth required: Admin.
Input: Draw ID, publish confirmation, public notes.
Output: Public URLs and verification record ID.
Side effects: Inserts/updates `draw_public_verification_records`; sets `draws.published_at/status`; logs audit event.
Idempotency requirements: Repeat publish returns same public record unless void flow is used.
Failure handling: Block if result, proof, replay, or public manifest is missing; fail closed on redaction validation failure.
Existing pattern/file to reuse, if found: `app/api/admin/draws/result/route.ts`, `app/draw-results/[slug]/page.tsx`.

Name/path: `GET /draws/[slug]/verify` and optional `GET /api/draws/[slug]/verify.json`
Purpose: Public verification page and machine-readable verifier payload.
Auth required: None.
Input: Public slug.
Output: Redacted verification record, hashes, randomness proof, algorithm version, result summary, public manifest/replay links.
Side effects: None.
Idempotency requirements: Stable response after publish.
Failure handling: Pending/void/unpublished states should explain status without exposing private data.
Existing pattern/file to reuse, if found: `app/draw-results/[slug]/page.tsx`, `lib/domain/draws/getDrawResultByCampaign.ts`.

Name/path: `GET /api/admin/draws/[drawId]/audit-pack`
Purpose: Admin download of private audit pack.
Auth required: Admin.
Input: Draw ID.
Output: Zip or manifest of CSV/JSON artifacts and audit logs.
Side effects: Logs `draw_audit_events` or `export_logs`.
Idempotency requirements: Download should not mutate draw results beyond export logging.
Failure handling: Block if draw does not exist or requester is not admin.
Existing pattern/file to reuse, if found: `app/api/admin/export/route.ts`, `app/api/admin/draws/snapshots/[snapshotId]/csv/route.ts`.

## 10. Randomness/provable fairness recommendation

External reference evidence used for this section:

- Random.org Signed API docs: `https://api.random.org/json-rpc/2/signed`
- Random.org JSON-RPC Release 4 overview: `https://api.random.org/json-rpc/4`
- drand HTTP API docs: `https://docs.drand.love/developer/API-v2/drand-http-api/`
- drand protocol specification: `https://docs.drand.love/docs/specification/`

Source: Random.org Signed API
Trust: Centralized provider, but signed responses prove the random values originated from Random.org and were not modified by the app. API key/account dependency applies.
Auditability: Strong if the signed `random` object, signature, serial number, userData/manifest commitment, and verification result are stored. Random.org docs also describe retrieval of generated signed values for a minimum period.
Implementation complexity: Medium. Requires server-side API key, quota/error handling, signature verification, and redaction of any private request/auth data.
Operational risk: Provider outage, quota exhaustion, billing/account issues, accidental repeated requests/rerolls if idempotency is weak.
Suitability for Monroes V1: Good as a fallback or primary if operator wants a familiar true-random provider with signed evidence.
Recommendation: Use only through a locked, audited one-shot request that includes draw/manifest commitment in `userData` where size permits; never allow repeated unlogged requests after seeing a result.

Source: drand public randomness beacon
Trust: Distributed public beacon; randomness is generated collectively and published through public relays with verifiable signatures. Requires choosing a specific network/round in advance.
Auditability: Strong if the draw stores beacon ID/chain hash, round, signature, randomness value, relay URL, verification status, and final seed.
Implementation complexity: Low to medium. No API key, public HTTP endpoints, but the app should verify signatures using a library or documented verification process rather than blindly trusting HTTP.
Operational risk: Relay/network downtime, choosing an already-known round, or allowing the operator to wait/select a favorable round. Mitigate by committing to the first round at or after a specific scheduled timestamp before result generation.
Suitability for Monroes V1: Best primary fit because it is public, transparent, easy to show on the verifier page, and avoids a secret randomness API key.
Recommendation: Use drand as the primary V1 source, with the chosen network, round selection rule, and verification logic stored in the public verification record.

Source: hybrid Random.org + drand
Trust: Strongest against single-source trust because final randomness can combine two independent public/signed inputs.
Auditability: Strong, but only if both proofs and the combination algorithm are stored and explained clearly.
Implementation complexity: High for V1. Requires two integrations, two failure modes, and more public explanation.
Operational risk: More moving parts and more chances to delay a live draw.
Suitability for Monroes V1: Good future upgrade, not necessary for V1 unless legal/compliance specifically asks for dual-source randomness.
Recommendation: Defer to V2 or use only for high-value campaigns after V1 proves the simpler public-beacon path.

Source: internal crypto RNG only
Trust: Low public trust. Cryptographically strong randomness can be generated server-side, but outsiders cannot prove the operator did not reroll or choose a seed.
Auditability: Weak unless combined with a prior public commitment and external timestamping, and even then it is less intuitive.
Implementation complexity: Low.
Operational risk: Low infrastructure risk, high trust/compliance perception risk.
Suitability for Monroes V1: Not suitable as the sole source for a public verified draw.
Recommendation: Do not use as primary or fallback for public results. Internal RNG can be used only for visual-only variation after ranking is fixed.

Source: manual/third-party draw service
Trust: Potentially high if the service is legally recognized and provides certificates, but it moves the draw outside the custom Monroes verifier flow.
Auditability: Depends on service exports/certificates and data retention.
Implementation complexity: Medium to high; may require file upload/export, privacy review, and operational handoff.
Operational risk: Less control over live race/replay integration and public verification format.
Suitability for Monroes V1: Useful as a compliance fallback if legal requires a certified external draw process.
Recommendation: Keep as an operator/legal fallback, not the default build path for the custom V1 verified live draw.

Primary recommendation for V1: drand public randomness beacon.

Recommended fallback: Random.org Signed API, provided an API key/account is set up server-side and the signed response is stored with verification metadata. If both are unavailable at draw time, pause the draw rather than falling back to internal RNG.

### Seed/ranking process design

Canonical manifest format: UTF-8 JSON with deterministic key order, deterministic row order, and no locale-dependent formatting. Recommended top-level fields: `schema_version`, `draw_id`, `campaign_id`, `campaign_slug`, `generated_at`, `canonicalization_version`, `entry_count`, and `entries`. Each entry should include only deterministic manifest fields such as `manifest_index`, `entry_number`, `public_entry_id`, `public_display_label`, `source_promo_entry_id_hash`, and `row_hash`. Private audit manifest may additionally include internal IDs/emails/order references, but the public manifest must not.

Hashing algorithm: SHA-256 over the exact canonical manifest bytes. Store lowercase hex digest and byte length. Also store per-row SHA-256 hashes so the public verifier can prove row inclusion without exposing private customer data.

Final seed derivation: Use a canonical JSON array or length-prefixed byte concatenation to avoid ambiguity:

```text
final_seed = SHA256([
  "monroes_verified_live_draw_v1",
  draw_id,
  algorithm_version,
  entrant_manifest_hash,
  randomness_source,
  public_random_value
])
```

Deterministic shuffle approach: Use Fisher-Yates over the locked manifest order, driven by a deterministic byte stream derived from `final_seed` with rejection sampling to avoid modulo bias. Do not use JavaScript `Math.random`, object iteration order, locale sorting, floating-point randomness, browser time, or client-side random state.

Algorithm versioning: Store `algorithm_version`, canonicalization version, replay version, implementation commit/build identifier, source code hash if available, and a plain-language algorithm description in `draws`, `draw_results`, and `draw_public_verification_records`.

How to avoid accidental non-determinism: Sort entries by numeric `entry_number` or explicit `manifest_index`; serialize JSON through one canonical serializer; use UTC ISO timestamps only as metadata outside ranking; never depend on database default ordering; include tests with fixed manifest/seed/golden ranking.

How to prove the animation did not change the result: Generate ranking first, store `final_rank` for every entry, then generate `draw_replay_events` from that ranking. Public live pages read replay events only. The live race must show: The verified random draw determines the result. The live race is an animated reveal of the already-determined result and does not alter the outcome.

What should be shown publicly: Draw status, entry count, manifest hash, public manifest hash or row hashes, randomness source, round/request ID, public random value, final seed hash, algorithm version, ranking hash, winner entry number/public label, final-20 public labels, replay hash, verification JSON, and audit-safe event summary.

What should be stored privately: Full private manifest, member profile IDs, auth user IDs, emails, order IDs, Stripe IDs, Daypass code IDs/hashes/encrypted code data, refund/dispute notes, admin notes, raw internal CSV, private audit pack.

What must be in the audit pack: Private manifest, public manifest, manifest hashes, row hashes, randomness proof raw response/signature/round, final seed, algorithm version/source reference, full ranking file, prize assignment file, replay events, public verification JSON, admin audit events, eligibility reconciliation summary, refund/dispute status summary, and export/download logs.

How to handle multiple prizes/winners: Ranking is single ordered list. Prize 1 uses `ranking[0]`, prize 2 uses `ranking[1]`, prize 3 uses `ranking[2]`, and so on, unless final legal rules define otherwise before lock. Store `prize_assignments_json` with prize code, rank, entry number, public label, and claim status.

How to handle rerun/void scenarios without undermining trust: Never delete or overwrite a completed result. Add a void record/status, public void reason if legally appropriate, admin actor, legal/operator approval reference, and new draw ID for any rerun. Preserve the original manifest/randomness/ranking as voided history.

How to store the exact algorithm version used for each draw: Persist version fields on `draws`, `draw_manifest_files`, `draw_results`, `draw_replay_events`, and `draw_public_verification_records`; include the verifier code/package hash or source commit where available.

How to make future verification possible after code changes: Publish a stable verifier JSON schema and keep a small standalone verification script or documented pseudocode tied to each algorithm version. Store enough artifacts so a future verifier can recompute without relying on current database state.

## 11. Animation/reveal blueprint

V1 reveal principle: The verified random draw determines the result. The live race is an animated reveal/replay of the already-determined result. The race does not choose, alter, or influence the winner.

Recommended overall approach: Generate `draw_replay_events` after deterministic ranking, then let the public live page play those stored events. If the animation crashes, the verified result remains valid and the public page should fall back to a static result/verification view.

Current build support: The app already uses Next.js App Router, Tailwind, GSAP, and a `prefers-reduced-motion` guard in `components/marketing/ScrollReveal.tsx`. `package.json` does not include Three.js or React Three Fiber, so the V1 reveal should avoid 3D dependencies.

### 11.1 Elimination board

Recommendation: Show an aggregate grid of entry tiles with 100-300 visible tiles at once on desktop and 40-100 on mobile; for larger pools, virtualize/paginate by wave rather than rendering every entry continuously.
Reason: 100 entries can be shown directly; 500 entries can be shown in paged/wave groups; 5,000+ entries should be represented by batches, counters, and sampled/virtualized tiles to avoid browser performance issues.
Current build support: Tailwind grid/card patterns exist in `app/draw-results/[slug]/page.tsx`, admin tables/cards, and member entry cards.
New components/data needed: `EliminationBoard`, `EliminationWaveSummary`, `EntryTile`, `MyEntryHighlight`, public `draw_replay_events` feed, public entry labels/hashes, phase/progress counters.
Risks: Rendering too many DOM nodes, exposing entrant identity, confusing the board animation with the actual draw, and poor mobile readability.
V1/V2 priority: V1 must include the board, but V1 should use batched/virtualized 2D tiles. V2 can add richer filters, heatmaps, or spectator personalization.

Recommendation: Public tiles should show entry number plus public display label or masked label, not full name, email, phone, order ID, member ID, Stripe ID, or Daypass code.
Reason: Existing public result copy already excludes emails, full names, codes, payment identifiers, and private purchaser information.
Current build support: `components/member/PromoEntriesCard.tsx` already treats entry number and display alias as safe member-facing fields; `app/draw-results/[slug]/page.tsx` uses public alias.
New components/data needed: Public display-label policy, public-entry DTO, optional private "find my entry" token that never appears in analytics.
Risks: Display aliases can still be identifying if users choose real names; final copy/privacy policy must define public display rules.
V1/V2 priority: V1.

Recommendation: "Find my entry" should be optional and local-only: users can enter an entry number or private lookup token to highlight their tile in the browser without sending that token to analytics.
Reason: It improves usability for large boards while avoiding public search exposure of private codes or identities.
Current build support: No direct existing component; member dashboard can show entry numbers for signed-in users.
New components/data needed: Local search/highlight state, no-analytics guard for search value, account/member link to show entry numbers.
Risks: If lookup tokens are sent to server logs or analytics, they become sensitive.
V1/V2 priority: Should-have for V1 if time allows; otherwise V2.

Recommendation: Use a wave timing model driven by stored replay events: for example, early waves eliminate large batches, mid waves slow down, and the last 20 advance to the race.
Reason: This gives the audience a sense of progress without animating thousands of individual entrants.
Current build support: Existing frontend can render counters and phase UI; no replay model exists yet.
New components/data needed: `draw_replay_events` with `phase`, `sequence`, `starts_at_ms`, `duration_ms`, `wave_number`, `entry_number`, and `public_entry_id`.
Risks: If wave timing is generated client-side, different viewers may see inconsistent reveals.
V1/V2 priority: V1.

Recommendation: Accessibility must include reduced-motion mode, pause/skip controls, ARIA live summary updates at wave boundaries, keyboard focus management, and text status that mirrors visual progress.
Reason: The reveal is public and should remain understandable without continuous animation.
Current build support: `components/marketing/ScrollReveal.tsx` already checks `prefers-reduced-motion`.
New components/data needed: Reduced-motion board renderer, static ranking/replay summary, accessible progress copy.
Risks: Continuous tile changes can be noisy for assistive tech if every elimination is announced.
V1/V2 priority: V1.

Recommendation: Mobile behavior should prioritize counters, wave progress, highlighted searched entry, and a compact grid; avoid tiny unreadable 5,000-tile layouts.
Reason: The live room must work on phones without forcing a dense desktop board.
Current build support: Existing Tailwind responsive patterns and table scroll hints.
New components/data needed: Mobile board layout and phase summary.
Risks: Overly dense UI can make the result feel chaotic or suspicious.
V1/V2 priority: V1.

Recommendation: Every board state must be derived from stored ranking/replay data, not from client randomness.
Reason: The board is only a reveal of the already-determined result.
Current build support: Section 9 recommends `draw_replay_events`; current app does not yet have this table.
New components/data needed: Public replay API/route and checksum validation.
Risks: Client-side generated eliminations would undermine trust.
V1/V2 priority: V1.

### 11.2 Final 20 race

Recommendation: Use 2D/2.5D CSS transforms with GSAP or lightweight SVG/canvas lanes for V1; do not add Three.js or React Three Fiber for the first implementation.
Reason: `package.json` includes GSAP but not Three.js; V1 needs reliable replay, not complex 3D rendering or physics.
Current build support: GSAP dependency and reduced-motion precedent exist in `components/marketing/ScrollReveal.tsx`.
New components/data needed: `Final20Race`, `RaceLane`, `RaceReplayTimeline`, `WinnerReveal`, `ReducedMotionRaceSummary`, public final-20 replay events.
Risks: A race UI can imply competition/physics determine the winner unless copy and data flow make replay semantics explicit.
V1/V2 priority: V1.

Recommendation: Runner data model should be public-safe and deterministic: `public_entry_id`, `entry_number`, `public_display_label`, `final_rank`, `lane`, `visual_seed`, `color_token`, `finish_ms`, `phase_markers`.
Reason: Visual variety can be deterministic and harmless if it never affects rank.
Current build support: Public aliases and entry numbers already exist conceptually; replay data model is new.
New components/data needed: Stored final-20 replay event rows and a visual-seed generator derived from ranking/replay hash.
Risks: Random colors/runner styles generated on the client can make replays inconsistent; keep visual-only variation seeded.
V1/V2 priority: V1.

Recommendation: Name labels should show entry number and public alias/masked label. The winner may receive a clearer winner label if final terms/privacy permit it; non-winners should not show full names.
Reason: Existing public result page is privacy cautious.
Current build support: `app/draw-results/[slug]/page.tsx` shows winner alias and entry number.
New components/data needed: Public display policy and copy explaining what labels mean.
Risks: Public aliases can still identify users; entrants need notice before the draw.
V1/V2 priority: V1.

Recommendation: Predetermined timing should make final positions visually suspenseful without changing final ranking. The top 3 can appear close near the finish, but finish order must exactly match stored ranks.
Reason: Fun reveal is acceptable only if it is a replay.
Current build support: No current race component; Section 9 replay model supports it.
New components/data needed: Race replay generator that maps rank to deterministic lane positions over time.
Risks: If visual positions temporarily conflict with final rank too aggressively, users may think the animation is deciding the outcome.
V1/V2 priority: V1.

Recommendation: Winner reveal should immediately link to verification and show the protective copy: The verified random draw determined this result.
Reason: Trust should peak at the same moment as excitement.
Current build support: Public result page already has audit details and privacy copy.
New components/data needed: Winner reveal card, verify CTA, replay CTA.
Risks: Winner celebration can overshadow verification if the CTA is hidden.
V1/V2 priority: V1.

Recommendation: Replay behavior should be deterministic and restartable. If viewers join late or reload, the page should either catch up to the current phase from stored timestamps or offer "Watch replay".
Reason: Live pages are unreliable if refreshes lose state.
Current build support: App Router dynamic pages and public result page pattern.
New components/data needed: Draw phase/status endpoint, replay event list, client phase controller.
Risks: Time drift between server and client can desync playback; use server-generated schedule/replay offsets.
V1/V2 priority: V1.

Recommendation: If the animation crashes after result generation, preserve trust by showing static winner/result, ranking hash, and verify link.
Reason: The animation is not the source of truth.
Current build support: Public result page can already show static pending/published result states.
New components/data needed: Error boundary/fallback view for live route.
Risks: A blank live page after a completed draw can look suspicious.
V1/V2 priority: V1.

### 11.3 Copy requirements

Live page required wording:

```text
Entries are locked.
The verified random draw has determined the result.
The race is an animated reveal of the verified result and does not change the outcome.
```

Verification page required wording:

```text
Verify this draw
This page shows the locked entrant manifest hash, public randomness source, final seed, algorithm version, and result ranking used to determine the winner.
```

Draw countdown copy:

```text
Draw starts soon
Entries must be locked before the verified random draw can run.
```

Entries locked state copy:

```text
Entries are locked
No new entries or attribution changes can affect this draw.
```

Randomness generated state copy:

```text
Public randomness received
The draw seed has been generated from the locked manifest hash and public randomness proof.
```

Result generated state copy:

```text
Verified result generated
The full ranking has been calculated and stored. The reveal is ready to play.
```

Race starting state copy:

```text
Final 20 reveal
These entrants are being shown in an animated replay of the verified ranking.
```

Winner revealed state copy:

```text
Winner revealed
The verified draw result is final subject to the published promotion terms and claim checks.
```

Verify result CTA:

```text
Verify this result
```

Replay CTA:

```text
Watch replay
```

Reduced-motion fallback copy:

```text
Reduced motion is on, so we are showing the verified result as a step-by-step reveal instead of continuous animation.
```

Draw unavailable/error state copy:

```text
Draw unavailable
The draw cannot be displayed right now. The verified result and audit details will remain available once published.
```

## 12. Privacy and public display recommendations

Recommendation: Use entry numbers, public display aliases, and public row hashes for V1 public display. Do not show full names, emails, phone numbers, addresses, account IDs, Stripe IDs, order IDs, Daypass code values, code hashes, or internal member/profile IDs.
Confidence: Confirmed.
Reason: Existing public result/rules copy already avoids entrant emails, full names, payment identifiers, access codes, and private purchaser information.
Privacy risk: Public aliases may still identify entrants if aliases are real names or unique handles.
Implementation implication: Add a public display-label policy before launch; validate public DTOs so only `entry_number`, `public_entry_id`, `public_display_label`, `row_hash`, `rank/status`, and aggregate draw fields are exposed.

Recommendation: Non-winners should be masked by default. The elimination board can show `Entry #1234 - Alias` if entrants have notice; otherwise show `Entry #1234` and row hash. Avoid public full-name display for all non-winners.
Confidence: Likely.
Reason: Losers do not need to be publicly identifiable for fairness verification.
Privacy risk: Publicly naming all non-winners creates unnecessary privacy exposure.
Implementation implication: The public manifest can prove inclusion with row hashes while keeping private manifest details admin-only.

Recommendation: Winners may be shown with a clearer public label only if promotion terms/privacy notice disclose winner publication and the operator has completed claim/eligibility checks.
Confidence: Likely.
Reason: Winner publication rules may have legal/compliance requirements that differ from non-winner display.
Privacy risk: Prematurely publishing a real name can violate expectations or final terms.
Implementation implication: Store separate `winner_public_label` and `winner_claim_status`; do not assume the public alias equals a legally publishable winner name.

Recommendation: Do not make the private full entrant manifest publicly downloadable. Publish a redacted public manifest or verifier JSON with public row hashes, manifest hash, and enough algorithm data to recompute ranking.
Confidence: Likely.
Reason: Full manifest can include private order/member/payment context.
Privacy risk: Downloadable private manifest would expose PII and payment-adjacent data.
Implementation implication: Create separate private audit pack and public verification artifact.

Recommendation: "Search my entry" should accept entry number or a private token locally, but the search value must not be sent to analytics, PostHog, Meta Pixel, URL query strings, or server logs unless explicitly designed as a private authenticated lookup.
Confidence: Likely.
Reason: Search terms can become sensitive if they identify a person or private code.
Privacy risk: Analytics leakage.
Implementation implication: Implement client-only search for public board; authenticated member entry lookup should use existing `/member` patterns.

Recommendation: Full ranking can be public as entry numbers/public labels and rank hashes, but not as full names or private identifiers.
Confidence: Likely.
Reason: Public ranking improves verification, but public PII is not necessary.
Privacy risk: Even public aliases over full ranking can identify many entrants.
Implementation implication: Offer a public ranking hash plus optional redacted ranking file; final legal/privacy review should decide if all aliases are shown.

V1 privacy-safe public display format:

```text
Entry #1042
Public label: Sunny-1042
Public entry ID: pub_...
Row hash: sha256:...
Reveal status: eliminated / finalist / winner
```

## 13. Failure modes and operational safeguards

Failure mode: Randomness API unavailable.
Risk: Draw cannot fetch public randomness at scheduled time.
Recommended prevention: Preselect source/fallback policy, health-check before live window, and define a no-internal-RNG rule.
Recommended recovery: Pause draw and show "randomness unavailable"; use documented fallback only through admin-audited action.
What should be logged: Source, request time, error code/message, admin action, fallback decision.
V1/V2 priority: V1.

Failure mode: Randomness API returns error or unverifiable proof.
Risk: Seed cannot be trusted.
Recommended prevention: Verify proof before ranking; reject unsigned/unverified values.
Recommended recovery: Store failed proof attempt, do not rank, use fallback if permitted before result generation.
What should be logged: Raw-safe proof metadata, verification status, verification error, source.
V1/V2 priority: V1.

Failure mode: Stripe webhook missing/late.
Risk: Eligible purchase may be absent from entry ledger before lock.
Recommended prevention: Admin reconciliation screen compares orders, webhook events, and promo entries before lock.
Recommended recovery: Delay lock until reconciliation completes; do not manually add entries without audit trail.
What should be logged: Missing order/session references, reconciliation status, admin confirmation.
V1/V2 priority: V1.

Failure mode: Payment refund after entry lock.
Risk: Eligibility dispute after manifest is fixed.
Recommended prevention: Final terms must define refund cutoff and post-lock handling; lock only after refund/dispute review.
Recommended recovery: Follow published rules; if legally necessary, void draw with public reason and rerun as new draw.
What should be logged: Refund timing, affected entries, operator/legal decision, public/private notes.
V1/V2 priority: V1.

Failure mode: Duplicate entries.
Risk: Entrant receives more chances than intended.
Recommended prevention: Unique constraints on `(draw_id, promo_entry_id)` and `(draw_id, entry_number)`; deterministic entry count from order quantity.
Recommended recovery: Block manifest creation until duplicates are resolved.
What should be logged: Duplicate identifiers, resolution action, admin actor.
V1/V2 priority: V1.

Failure mode: User disputes eligibility.
Risk: Trust/support issue and possible legal complaint.
Recommended prevention: Member entry visibility, clear rules, locked manifest hash, and audit pack.
Recommended recovery: Investigate private audit pack; publish corrections only through void/reissue process if required.
What should be logged: Dispute reference, related entry/order IDs privately, outcome, operator notes.
V1/V2 priority: V1.

Failure mode: Admin accidentally locks too early.
Risk: Late eligible entries or attribution changes excluded.
Recommended prevention: Server-side lock-after check, confirmation checklist, and preview counts.
Recommended recovery: If before randomness/result, unlock only through audited void/reset workflow; if after result, legal/operator decision required.
What should be logged: Lock timestamp, scheduled lock time, admin actor, affected counts.
V1/V2 priority: V1.

Failure mode: Admin tries to rerun draw.
Risk: Operator can appear to fish for a preferred winner.
Recommended prevention: One accepted randomness proof and one ranking per draw; idempotent execute endpoint.
Recommended recovery: Block rerun; require voided draw and new draw ID with public audit note.
What should be logged: Attempted rerun, actor, existing result ID, outcome.
V1/V2 priority: V1.

Failure mode: Draw result generated but animation fails.
Risk: Viewers may think the draw failed or was manipulated.
Recommended prevention: Generate result and public verification before animation playback; build static fallback.
Recommended recovery: Show static result, verification link, and replay-unavailable message.
What should be logged: Client/server error, draw ID, replay artifact hash, fallback shown.
V1/V2 priority: V1.

Failure mode: Live page crashes.
Risk: Poor public experience and trust loss.
Recommended prevention: Error boundary, lightweight 2D animation, reduced-motion mode, tested mobile layout.
Recommended recovery: Static result/phase fallback with refresh/replay CTA.
What should be logged: Error type, route, draw phase, device type, replay sequence if known.
V1/V2 priority: V1.

Failure mode: Race replay mismatch.
Risk: Animation shows order inconsistent with verified ranking.
Recommended prevention: Generate replay from stored ranking and store replay hash; test replay against ranking.
Recommended recovery: Stop animation, show static verified ranking/result, mark replay unavailable until regenerated pre-publish or fixed in archive.
What should be logged: Ranking hash, replay hash, mismatched entry/rank, client version.
V1/V2 priority: V1.

Failure mode: Supabase write fails mid-draw.
Risk: Partial draw artifacts.
Recommended prevention: Use transactional server workflow where possible; write artifacts in strict state order and fail closed.
Recommended recovery: Resume from last complete audited state; if ranking partially wrote, block publish until consistency check passes.
What should be logged: Failed table/action, partial artifact IDs, transaction/correlation ID, error.
V1/V2 priority: V1.

Failure mode: Network timeout.
Risk: Admin or public client sees ambiguous state.
Recommended prevention: Idempotency keys and status polling.
Recommended recovery: Reload state from server; do not retry mutating actions blindly.
What should be logged: Action, idempotency key, timeout duration, final server state.
V1/V2 priority: V1.

Failure mode: Vercel function timeout.
Risk: Large manifest/ranking/replay generation can fail.
Recommended prevention: Keep V1 data sizes practical, generate artifacts in efficient server code, consider background/job approach if needed.
Recommended recovery: Resume/retry idempotently from incomplete state before publish.
What should be logged: Draw size, phase, elapsed time, memory/error detail.
V1/V2 priority: V1 for safeguards; V2 for job queue if scale demands.

Failure mode: Timezone mismatch.
Risk: Lock/draw happens at wrong time.
Recommended prevention: Store UTC timestamps and display timezone labels explicitly.
Recommended recovery: Pause draw if mismatch detected; publish corrected schedule before lock.
What should be logged: Stored UTC time, displayed time, admin timezone, correction.
V1/V2 priority: V1.

Failure mode: Daylight savings/timezone confusion.
Risk: Entrants misunderstand close/lock/draw time.
Recommended prevention: Use absolute times with timezone abbreviation and UTC in admin.
Recommended recovery: Operator communication and delayed lock if needed.
What should be logged: Affected campaign, correction, operator decision.
V1/V2 priority: V1.

Failure mode: More entries than expected.
Risk: Performance issues or legal/campaign cap mismatch.
Recommended prevention: Pre-lock count thresholds and board virtualization.
Recommended recovery: Delay draw until cap/rules discrepancy is resolved.
What should be logged: Expected cap, actual count, reason, operator decision.
V1/V2 priority: V1.

Failure mode: Too few entries.
Risk: Promotion terms may require alternate handling.
Recommended prevention: Admin preview warns below threshold.
Recommended recovery: Follow final rules; delay, cancel, or proceed as permitted.
What should be logged: Entry count, threshold, decision.
V1/V2 priority: V1.

Failure mode: No entries.
Risk: Draw cannot run.
Recommended prevention: Block execution with clear admin state.
Recommended recovery: Do not publish winner; show public pending/cancelled state per rules.
What should be logged: Zero-entry execution attempt, campaign/draw ID, actor.
V1/V2 priority: V1.

Failure mode: Multiple prizes/winners.
Risk: Wrong prize assignment if ranking/prize rules are unclear.
Recommended prevention: Define prize assignment rules before lock; store prize map and ranking.
Recommended recovery: If assignment bug occurs, follow void/correction process with audit note.
What should be logged: Prize map, rank assignments, affected entries.
V1/V2 priority: V1 if multiple prizes exist; otherwise V2.

Failure mode: Need to void/re-run under exceptional circumstances.
Risk: Trust loss if original result disappears.
Recommended prevention: Immutable draw records; documented legal/operator void policy.
Recommended recovery: Mark original draw void, publish reason where appropriate, create a new draw ID and preserve original audit pack.
What should be logged: Void reason, authority/approver, original artifacts, new draw link.
V1/V2 priority: V1.

## 14. Analytics/events recommendation

Current analytics support:

Finding: The app already has client-side event tracking to PostHog and Meta Pixel, plus optional Supabase `event_logs` persistence for allow-listed event names.
Confidence: Confirmed.
Evidence: `lib/analytics/types.ts`, `lib/analytics/trackEvent.ts`, `lib/analytics/posthog.ts`, `app/api/events/route.ts`, `lib/db/events.ts`, `components/analytics/PageViewTracker.tsx`.
Implication for Verified Live Draw V1: Add draw event names to `analyticsEventNames` and `supabaseLoggedEventNames` when implementing; keep properties PII-free and avoid sending entry search values.

Event name: `draw_page_viewed`
Where fired: `/draws/[slug]`, `/draws/[slug]/live`, `/draws/[slug]/results`, `/draws/[slug]/verify`.
Properties: `draw_id_public`, `campaign_slug`, `draw_status`, `page_type`, `entry_count_bucket`, `has_result`, `has_verification`.
Privacy notes: No entry numbers, aliases, emails, names, or search terms.
V1/V2 priority: V1.

Event name: `draw_countdown_viewed`
Where fired: Public draw hub/live page when countdown state renders.
Properties: `draw_id_public`, `campaign_slug`, `seconds_until_draw_bucket`, `entries_locked`.
Privacy notes: Aggregate only.
V1/V2 priority: V1.

Event name: `draw_entries_locked_viewed`
Where fired: Public draw live page when locked state is shown.
Properties: `draw_id_public`, `campaign_slug`, `entry_count_bucket`, `locked_at_present`.
Privacy notes: No entrant identifiers.
V1/V2 priority: V1.

Event name: `draw_live_started`
Where fired: Public live page when live replay starts.
Properties: `draw_id_public`, `campaign_slug`, `replay_version`, `entry_count_bucket`, `reduced_motion`.
Privacy notes: No entry-level data.
V1/V2 priority: V1.

Event name: `draw_elimination_board_started`
Where fired: Elimination board component when first elimination wave begins.
Properties: `draw_id_public`, `campaign_slug`, `wave_count`, `entry_count_bucket`, `reduced_motion`.
Privacy notes: Do not include eliminated entry numbers or labels.
V1/V2 priority: V1.

Event name: `draw_final_20_started`
Where fired: Final 20 race component when race phase begins.
Properties: `draw_id_public`, `campaign_slug`, `runner_count`, `replay_version`, `reduced_motion`.
Privacy notes: Do not include finalist labels or entry numbers.
V1/V2 priority: V1.

Event name: `draw_winner_revealed`
Where fired: Winner reveal component.
Properties: `draw_id_public`, `campaign_slug`, `prize_count`, `verification_available`, `reduced_motion`.
Privacy notes: Do not include winner name, alias, entry number, or rank in analytics.
V1/V2 priority: V1.

Event name: `draw_verify_clicked`
Where fired: Verify CTA on live/result pages.
Properties: `draw_id_public`, `campaign_slug`, `source_page`, `draw_status`.
Privacy notes: No entrant data.
V1/V2 priority: V1.

Event name: `draw_audit_pack_downloaded`
Where fired: Admin audit pack download endpoint/button.
Properties: `draw_id_public`, `campaign_slug`, `artifact_count`, `admin_surface`.
Privacy notes: Admin-only event; do not include admin email or private artifact contents.
V1/V2 priority: V1.

Event name: `account_entries_viewed`
Where fired: Existing `/member` dashboard or future `/account/entries`/`/member/entries`.
Properties: `entry_count_bucket`, `campaign_slug`, `has_locked_entries`, `has_active_entries`.
Privacy notes: Do not include entry numbers, aliases, emails, order IDs, or code details.
V1/V2 priority: Should-have for V1 if entrant entry page is touched; otherwise V2.

Event name: `admin_draw_created`
Where fired: Admin draw create action.
Properties: `draw_id_public`, `campaign_slug`, `randomness_strategy`, `algorithm_version`.
Privacy notes: Server/admin event; no admin email or private notes.
V1/V2 priority: V1.

Event name: `admin_draw_locked`
Where fired: Admin lock action.
Properties: `draw_id_public`, `campaign_slug`, `entry_count_bucket`, `excluded_count_bucket`, `lock_after_passed`.
Privacy notes: Aggregate only.
V1/V2 priority: V1.

Event name: `admin_draw_executed`
Where fired: Deterministic ranking execution.
Properties: `draw_id_public`, `campaign_slug`, `randomness_source`, `algorithm_version`, `entry_count_bucket`, `proof_verified`.
Privacy notes: No winner/entry identifiers.
V1/V2 priority: V1.

Event name: `admin_draw_published`
Where fired: Admin publish action.
Properties: `draw_id_public`, `campaign_slug`, `has_public_manifest`, `has_replay`, `has_verify_record`.
Privacy notes: No PII.
V1/V2 priority: V1.

Event name: `draw_error`
Where fired: Public live/result/verify error boundary and server draw workflow errors.
Properties: `draw_id_public`, `campaign_slug`, `source`, `phase`, `error_code`, `recoverable`.
Privacy notes: Sanitized error codes only; no stack traces, payloads, entry IDs, or customer data.
V1/V2 priority: V1.

Analytics implementation notes: Add these names to `lib/analytics/types.ts` during implementation. Supabase logging should be used for operationally important draw/admin events; PostHog can capture public interaction events. Keep Meta Pixel draw events aggregate-only or consider suppressing sensitive draw lifecycle events from Meta if legal/privacy review prefers.

## 15. Implementation gaps

### Database gaps

Gap: No first-class verified draw-run schema.
Severity: Critical
Why it matters: Current `draw_snapshots`/`draw_results` cannot store public randomness proofs, deterministic ranking, replay events, public verification records, or immutable audit events.
Recommended fix: Add `draws`, `draw_entries`, `draw_entry_snapshots`, `draw_manifest_files`, `draw_randomness_proofs`, extended/reworked `draw_results`, `draw_audit_events`, `draw_replay_events`, and `draw_public_verification_records`.
Likely files/tables affected: New Supabase migration; `lib/types/database.ts`; existing `draw_snapshots`, `draw_results`, `promo_entries`, `promo_campaigns`.
Confidence: Likely.
Evidence: Section 9; `supabase/migrations/20260519000000_create_lean_v1_schema.sql`; `lib/domain/draws/createDrawSnapshot.ts`; `lib/domain/draws/recordDrawResult.ts`.

Gap: No public/private manifest separation.
Severity: Critical
Why it matters: Current snapshot CSV logic is internal and can include private IDs/emails; public verification must not expose private customer or payment data.
Recommended fix: Store private audit artifacts separately from public manifest/verifier artifacts; enforce public-safe DTOs and RLS policies.
Likely files/tables affected: `draw_manifest_files`, `draw_entry_snapshots`, `draw_public_verification_records`, Supabase Storage policies if used.
Confidence: Likely.
Evidence: `lib/domain/draws/buildEligibleEntriesCsv.ts`, `app/draw-results/[slug]/page.tsx`, Sections 9 and 12.

Gap: No append-only draw audit ledger.
Severity: High
Why it matters: Existing `event_logs`/`export_logs` are useful but not enough to prove draw lifecycle integrity.
Recommended fix: Add `draw_audit_events` with actor, event type, payload, artifact hashes, and event hash chain.
Likely files/tables affected: New migration; future draw domain modules.
Confidence: Likely.
Evidence: Sections 3.4, 6, 9, and 13.

### Backend/API gaps

Gap: No deterministic ranking engine.
Severity: Critical
Why it matters: Manual winner entry cannot support public verification or prove the race is only a replay.
Recommended fix: Implement canonical manifest hashing, final seed derivation, deterministic Fisher-Yates shuffle with rejection sampling, ranking storage, and golden tests.
Likely files/tables affected: New `lib/domain/draws/*` modules; `draw_entry_snapshots`; `draw_results`.
Confidence: Likely.
Evidence: Sections 9 and 10.

Gap: No randomness adapter/proof verifier.
Severity: Critical
Why it matters: V1 needs verifiable public randomness and must not allow rerolls after a result is known.
Recommended fix: Add drand adapter, Random.org Signed API fallback adapter, proof verification, failure logging, and one-proof-per-draw idempotency.
Likely files/tables affected: New `lib/domain/draws/randomness/*`; `draw_randomness_proofs`; env names for fallback if Random.org is enabled.
Confidence: Likely.
Evidence: Section 10; Random.org and drand documentation inspected in Milestone 6.

Gap: No public verification endpoint/payload.
Severity: High
Why it matters: Public users need a stable way to verify manifest hash, randomness, seed, algorithm version, and ranking result.
Recommended fix: Add `/draws/[slug]/verify` and optional `/api/draws/[slug]/verify.json` using `draw_public_verification_records`.
Likely files/tables affected: `app/draws/[slug]/verify/page.tsx`, public API route, `draw_public_verification_records`.
Confidence: Likely.
Evidence: Sections 8, 9, and 10.

### Stripe/payment gaps

Gap: Refund/dispute/chargeback/expiration events are not implemented as eligibility-changing handlers.
Severity: Critical
Why it matters: A refunded or disputed payment may leave active entries unless manually reconciled.
Recommended fix: Add webhook handlers or require documented admin reconciliation before lock.
Likely files/tables affected: `app/api/stripe/webhook/route.ts`, `orders`, `promo_entries`, `stripe_webhook_events`, admin reconciliation UI.
Confidence: Confirmed.
Evidence: `app/api/stripe/webhook/route.ts`; Sections 4 and 13.

Gap: Live Stripe Dashboard configuration not verified.
Severity: High
Why it matters: Repo mappings may differ from live products/prices/webhook event subscriptions.
Recommended fix: Before implementation, inspect live Stripe products, prices, webhook endpoint URL, and enabled event list read-only.
Likely files/tables affected: Stripe Dashboard; `STRIPE_*` env names; checkout/domain config.
Confidence: Unknown.
Evidence: Active tool surface did not expose live Stripe account read access.

### Admin gaps

Gap: Existing `/admin/draws` is manual and not a verified execution console.
Severity: High
Why it matters: V1 needs preview, reconciliation, lock, manifest, randomness, execute, publish, audit pack, and void workflows.
Recommended fix: Extend `/admin/draws` and optionally add `/admin/draws/[drawId]` once draw runs are first-class.
Likely files/tables affected: `app/admin/(dashboard)/draws/page.tsx`, `app/api/admin/draws/*`, new draw domain modules/tables.
Confidence: Confirmed.
Evidence: Section 6; `app/admin/(dashboard)/draws/page.tsx`.

Gap: Admin roles are binary.
Severity: Medium
Why it matters: A high-trust draw may need separate execute/publish authority or two-person review.
Recommended fix: Keep V1 binary admin only if operator accepts risk; otherwise add draw-specific role checks.
Likely files/tables affected: `admin_profiles`, `lib/auth/admin.ts`, admin draw APIs.
Confidence: Confirmed.
Evidence: `lib/auth/admin.ts`, `supabase/migrations/20260512000000_create_core_schema.sql`, Section 6.

### Frontend/public page gaps

Gap: No `/draws` public route family exists.
Severity: High
Why it matters: Current `/draw-results/[slug]` is useful but not a live room or full verifier.
Recommended fix: Add `/draws/[slug]`, `/draws/[slug]/live`, `/draws/[slug]/verify`, `/draws/[slug]/results`; keep `/draw-results/[slug]` as alias/redirect.
Likely files/tables affected: New `app/draws/*`; existing `app/draw-results/[slug]/page.tsx`.
Confidence: Likely.
Evidence: Section 8.

Gap: No stored replay UI.
Severity: High
Why it matters: Elimination board/final-20 race must play stored replay events and not generate outcomes client-side.
Recommended fix: Build 2D/2.5D board/race components from `draw_replay_events`.
Likely files/tables affected: New public components; `draw_replay_events`; public draw routes.
Confidence: Likely.
Evidence: Sections 11.1 and 11.2.

### Legal/copy gaps

Gap: Promotion terms are not launch-final.
Severity: Critical
Why it matters: Draw launch may require final trade-promotion terms, permits/authority handling, no-purchase entry, winner publication, and electronic draw review.
Recommended fix: Complete legal/compliance review and update rules, terms, privacy, refund, live draw copy, emails, and host/reveal copy before production use.
Likely files/tables affected: `app/promo-rules/[slug]/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/refund-policy/page.tsx`, `lib/domain/campaigns/publicContent.ts`, `lib/domain/email/templates.ts`.
Confidence: Confirmed.
Evidence: Section 7.

Gap: Race/replay protective wording is not yet in existing public copy.
Severity: High
Why it matters: Users must understand the race does not choose the winner.
Recommended fix: Add required wording from Section 11.3 wherever the reveal is described.
Likely files/tables affected: Public draw routes, result/verify pages, rules, emails.
Confidence: Confirmed.
Evidence: Sections 7 and 11.3.

### Privacy gaps

Gap: Public display policy for finalists/non-winners is not finalized.
Severity: High
Why it matters: Public alias/entry display can identify entrants.
Recommended fix: Decide and document V1 display format; default to entry number/public alias or masked label plus row hash, no full names for non-winners.
Likely files/tables affected: Privacy page, promo rules, public manifest/verifier DTOs, `draw_public_verification_records`.
Confidence: Likely.
Evidence: Section 12.

### Analytics gaps

Gap: Draw event names are not yet registered.
Severity: Medium
Why it matters: V1 needs operational and product visibility without PII leakage.
Recommended fix: Add Section 14 event names to `lib/analytics/types.ts`, Supabase allow-list where needed, and draw admin/public event emitters.
Likely files/tables affected: `lib/analytics/types.ts`, `lib/analytics/trackEvent.ts`, `event_logs`, public/admin draw components.
Confidence: Confirmed.
Evidence: `lib/analytics/types.ts`, `lib/analytics/trackEvent.ts`, `app/api/events/route.ts`, Section 14.

### Testing gaps

Gap: No deterministic draw golden tests.
Severity: Critical
Why it matters: Verifiability depends on stable canonicalization and ranking across code changes.
Recommended fix: Add fixed manifest/seed fixtures, expected hashes, expected ranking, public verifier tests, replay consistency tests, and redaction tests.
Likely files/tables affected: New tests for draw domain modules and public API DTOs.
Confidence: Likely.
Evidence: Sections 9, 10, and 13.

### Operational gaps

Gap: No documented draw runbook.
Severity: High
Why it matters: Operators need a step-by-step process for reconciliation, lock, randomness, execute, publish, failure handling, voids, and audit pack export.
Recommended fix: Create an internal runbook before live use and mirror critical checks in admin UI.
Likely files/tables affected: Docs/admin copy; `draw_audit_events`; admin draw pages.
Confidence: Likely.
Evidence: Sections 6, 13, and 18.

## 16. Recommended implementation milestone order

Milestone 1 — Draw data model and migrations
Goal: Add first-class verified draw tables, RLS policies, indexes, and generated/maintained TypeScript types.
Dependencies: Operator decisions on public display, prize count, and public verifier fields.
Files likely affected: New Supabase migration, `lib/types/database.ts`.
Supabase changes: Add draw tables from Section 9; enable RLS; grant admin/service-role writes; public read only for published verification records.
Stripe changes: None.
Testing requirements: Migration/type checks; RLS policy review; public/private read tests if local Supabase is available.
Risk level: High.
Evidence basis: Sections 3.4 and 9.

Milestone 2 — Eligibility snapshot service
Goal: Build admin/server service to preview, reconcile, and lock eligible entries for a draw.
Dependencies: Milestone 1; final refund/dispute rule.
Files likely affected: New `lib/domain/draws/*`; `app/admin/(dashboard)/draws/page.tsx`; admin API routes.
Supabase changes: Writes `draw_entries` and draw lock state.
Stripe changes: None unless refund/dispute webhook work is included.
Testing requirements: Eligibility fixtures for 1x/5x/10x, refunded/cancelled/void/disqualified, redeemed code attribution, duplicate prevention.
Risk level: High.
Evidence basis: Sections 3, 4, 6, and 13.

Milestone 3 — Manifest canonicalisation and hashing
Goal: Generate private/public canonical manifests and SHA-256 hashes.
Dependencies: Milestones 1-2.
Files likely affected: New manifest modules; audit pack helpers.
Supabase changes: Writes `draw_entry_snapshots` and `draw_manifest_files`.
Stripe changes: None.
Testing requirements: Golden manifest serialization tests, hash tests, redaction tests.
Risk level: High.
Evidence basis: Existing `buildEligibleEntriesCsv.ts` and `hashCsvSha256.ts`; Sections 9 and 12.

Milestone 4 — Randomness adapter and proof storage
Goal: Integrate drand primary randomness and Random.org Signed API fallback.
Dependencies: Milestones 1 and 3; operator choice/credentials for fallback.
Files likely affected: New randomness modules; admin execute API; env docs if Random.org fallback is enabled.
Supabase changes: Writes `draw_randomness_proofs`.
Stripe changes: None.
Testing requirements: Mocked provider responses, signature/proof verification, failure/fallback/idempotency tests.
Risk level: High.
Evidence basis: Section 10.

Milestone 5 — Deterministic ranking engine
Goal: Derive final seed, shuffle/rank all entries, assign prizes, and store ranking/result hashes.
Dependencies: Milestones 1, 3, and 4.
Files likely affected: New ranking modules; draw result read models.
Supabase changes: Updates `draw_entry_snapshots`, writes `draw_results`.
Stripe changes: None.
Testing requirements: Golden ranking fixtures, modulo-bias/rejection-sampling tests, idempotency tests.
Risk level: Critical.
Evidence basis: Sections 9 and 10.

Milestone 6 — Admin draw controls
Goal: Extend `/admin/draws` for create, preview, lock, manifest, randomness, execute, publish, void, and audit status.
Dependencies: Milestones 1-5.
Files likely affected: `app/admin/(dashboard)/draws/page.tsx`, `app/api/admin/draws/*`, admin components.
Supabase changes: Writes draw state and audit events.
Stripe changes: None.
Testing requirements: Auth/authorization tests, idempotency tests, failure-state tests, redaction checks.
Risk level: High.
Evidence basis: Section 6.

Milestone 7 — Public draw hub and verification page
Goal: Add public draw routes and verification JSON/page.
Dependencies: Milestones 1, 3, 5, and 6.
Files likely affected: New `app/draws/[slug]/*`; existing `app/draw-results/[slug]/page.tsx`.
Supabase changes: Reads `draw_public_verification_records` and public-safe artifacts.
Stripe changes: None.
Testing requirements: Public redaction tests, unpublished/void/published state tests, SEO/noindex checks.
Risk level: High.
Evidence basis: Sections 8, 9, 10, and 12.

Milestone 8 — Elimination board reveal
Goal: Build stored-replay elimination board for public live page.
Dependencies: Milestones 5-7.
Files likely affected: New public draw components and route UI.
Supabase changes: Reads `draw_replay_events`; may write no new data if replay generated earlier.
Stripe changes: None.
Testing requirements: Performance tests for 100/500/5,000+ entries, reduced-motion tests, replay/ranking consistency tests.
Risk level: Medium.
Evidence basis: Section 11.1.

Milestone 9 — Final 20 race reveal
Goal: Build final-20 2D/2.5D race reveal from stored replay events.
Dependencies: Milestones 5-8.
Files likely affected: New race components; live/results route UI.
Supabase changes: Reads `draw_replay_events`.
Stripe changes: None.
Testing requirements: Ranking/replay consistency, mobile performance, reduced-motion fallback, crash fallback.
Risk level: Medium.
Evidence basis: Section 11.2.

Milestone 10 — Audit pack export
Goal: Provide admin audit pack export and public verifier downloads.
Dependencies: Milestones 1-7.
Files likely affected: New admin export route; `app/api/admin/export/route.ts` patterns.
Supabase changes: Reads draw artifacts/logs; writes export/audit log.
Stripe changes: None.
Testing requirements: Auth tests, artifact completeness tests, PII boundary tests.
Risk level: Medium.
Evidence basis: Sections 6, 9, and 12.

Milestone 11 — Analytics and logging
Goal: Add PII-free draw analytics and operational logs.
Dependencies: Milestones 6-9.
Files likely affected: `lib/analytics/types.ts`, public/admin draw components, `draw_audit_events`, `event_logs`.
Supabase changes: Event/audit inserts.
Stripe changes: None.
Testing requirements: Event allow-list tests, PII property checks, error logging tests.
Risk level: Medium.
Evidence basis: Section 14.

Milestone 12 — QA/security/passive compliance copy pass
Goal: Final verification before launch: tests, security review, copy/legal placeholders, public privacy wording, and live runbook.
Dependencies: Milestones 1-11 and legal/operator decisions.
Files likely affected: Draw routes/components, policy/rules/email copy, tests, docs.
Supabase changes: None unless defects require migration changes.
Stripe changes: Verify live Dashboard/webhook subscriptions read-only; add handlers only if deferred from earlier milestones.
Testing requirements: End-to-end dry run, public verifier recomputation, access control, redaction, mobile/reduced-motion, failure-mode rehearsals.
Risk level: Critical.
Evidence basis: Entire audit.

## 17. Recommended V1 scope

Recommended first implementation: Verified draw engine + public elimination board + final 20 race reveal + public verification/audit page.

### Must-have

- Deterministic verified draw engine using locked entries, canonical manifest, SHA-256 hashes, drand primary randomness, final seed, full ranking, and immutable result artifacts.
- Admin preview, reconciliation, lock, execute, publish, void, and audit pack controls in existing `/admin/draws`.
- Public `/draws/[slug]`, `/draws/[slug]/live`, `/draws/[slug]/verify`, and `/draws/[slug]/results` route family.
- Public verification record with manifest hash, public randomness proof, final seed hash, algorithm version, ranking hash, winner/result summary, and redacted manifest/replay evidence.
- Public elimination board driven by stored replay events.
- Final 20 2D/2.5D race reveal driven by stored replay events.
- Reduced-motion/static fallback for board and race.
- Public privacy-safe display: entry number, public/masked label, row hash; no full names for non-winners.
- Legal/compliance-approved rules/copy before launch.
- Pre-lock refund/dispute/webhook reconciliation process.

### Should-have

- Admin audit pack export with private manifest, public manifest, randomness proof, ranking, replay, audit events, and reconciliation summary.
- Public verifier JSON endpoint for independent recomputation.
- PII-free analytics events from Section 14.
- Member dashboard links to draw/live/verify pages from existing `/member`.
- "Find my entry" local-only highlight using entry number/private token without analytics leakage.

### Nice-to-have

- `/draws` index route for multiple current/archived draws.
- `/admin/draws/[drawId]` detail route if multiple draw runs become operationally complex.
- Public downloadable redacted ranking file if legal/privacy approves.
- Two-person admin approval for execute/publish.
- Hybrid drand + Random.org randomness for larger future campaigns.

### Explicitly out of scope for V1

- 5,000 fully animated 3D runners.
- Live chat.
- Custom avatars.
- Complex physics.
- Real-time multiplayer spectator mechanics.
- Public full-name display for all non-winners.
- Manual unverified draw result entry.
- Client-side random winner selection.
- `/account/entries` as a new route unless the product intentionally moves from `/member` to `/account`.
- Monthly membership draw eligibility unless Peter/legal explicitly define it.

## 18. Open questions for operator/Peter

Question: Does 1x Daypass equal 1 entry?
Why it matters: Entry quantity must be fixed before manifest generation.
Recommended default if Peter does not decide yet: Yes, 1x Daypass equals 1 entry, matching current checkout/entry behavior.

Question: Does 5x Daypass equal 5 entries?
Why it matters: Bundle quantity determines both entries and friend-code implications.
Recommended default if Peter does not decide yet: Yes, 5x Daypass equals 5 entries, matching current code/entry model.

Question: Does 10x Daypass equal 10 entries?
Why it matters: Same as above at larger quantity.
Recommended default if Peter does not decide yet: Yes, 10x Daypass equals 10 entries, matching current code/entry model.

Question: Do monthly/Ultra members receive entries?
Why it matters: Current draw eligibility is Daypass-focused; adding subscriptions changes legal/copy/payment mapping.
Recommended default if Peter does not decide yet: No for V1.

Question: Is there a free/no-purchase entry path?
Why it matters: May be legally required depending on final promotion structure and jurisdiction.
Recommended default if Peter does not decide yet: Do not launch until legal/compliance decides.

Question: Is the first draw one prize only or multiple prizes?
Why it matters: Ranking/prize assignment, copy, and winner publication depend on prize count.
Recommended default if Peter does not decide yet: One prize for V1.

Question: Are 2nd/3rd place prizes needed?
Why it matters: Final ranking can support them, but prize copy/claims/legal terms must specify them.
Recommended default if Peter does not decide yet: No 2nd/3rd place prizes for V1.

Question: What public name format should entrants see?
Why it matters: This controls privacy, live board labels, and finalist/winner reveal.
Recommended default if Peter does not decide yet: Entry number plus generated public alias/masked label, no full names for non-winners.

Question: Are draw results public forever or archived after a period?
Why it matters: Verification retention, SEO, storage, and privacy expectations depend on retention.
Recommended default if Peter does not decide yet: Keep audit page public indefinitely with privacy-safe data.

Question: Should Random.org or drand be used?
Why it matters: Randomness source affects implementation, cost, operations, and public trust.
Recommended default if Peter does not decide yet: drand primary, Random.org Signed API fallback.

Question: What is the intended draw frequency?
Why it matters: One-off draws can be simpler; recurring draws need reusable admin workflows and archiving.
Recommended default if Peter does not decide yet: Build reusable but optimize for the first one-off campaign.

Question: Should all entries be visible publicly or only hashed/proven?
Why it matters: Public visibility affects privacy and verifier UX.
Recommended default if Peter does not decide yet: Publicly show entry numbers/masked labels and hashes, not private manifest data.

Question: Who is allowed to execute/publish a draw?
Why it matters: Admin role separation and audit expectations depend on authority model.
Recommended default if Peter does not decide yet: Existing admins can execute/publish for V1, with audit logging; add two-person approval later if needed.

Question: What exact wording should appear in promotion terms?
Why it matters: The draw, race/replay, no-purchase, refund, privacy, claim, redraw, and publication rules need legal approval.
Recommended default if Peter does not decide yet: Do not launch; keep draft wording internal/pending.

Question: Should users have an `/account/entries` page in V1?
Why it matters: It affects routing and account UX scope.
Recommended default if Peter does not decide yet: No. Reuse/extend existing `/member`.

Question: Should the full ranking be downloadable publicly or admin-only?
Why it matters: Full ranking increases transparency but may increase privacy exposure.
Recommended default if Peter does not decide yet: Public ranking hash and optional redacted ranking; full private audit pack admin-only.

Question: Should losers be publicly identifiable at all?
Why it matters: Non-winner privacy risk is higher than verification value.
Recommended default if Peter does not decide yet: No. Show masked/public labels only.

Question: What is the minimum acceptable audit pack for launch?
Why it matters: Operators need a support/legal record after the draw.
Recommended default if Peter does not decide yet: Private manifest, public manifest, hashes, randomness proof, seed, algorithm version, ranking, replay events, audit events, and reconciliation summary.

Question: What legal/compliance review is required before production use?
Why it matters: Trade-promotion rules, permits, no-purchase entry, electronic draw method, winner publication, and privacy notices may all be jurisdiction-sensitive.
Recommended default if Peter does not decide yet: Require professional legal/compliance review before launch.

Question: Should refunds/disputes after lock void entries or leave them in the draw?
Why it matters: This must be known before lock and published in terms.
Recommended default if Peter does not decide yet: Exclude refunded/cancelled/void/disqualified before lock; post-lock handling must follow final rules and legal advice.

Question: What maximum entrant count should V1 support?
Why it matters: Board rendering, replay payload size, and Vercel/Supabase performance depend on scale.
Recommended default if Peter does not decide yet: Design for 5,000+ entries using virtualized/batched board, but only animate final 20 individually.

Question: Should winners be claim-checked before public reveal?
Why it matters: Revealing an ineligible winner can require correction or void workflows.
Recommended default if Peter does not decide yet: Publish winner as entry/public label immediately, with final claim/eligibility status handled according to terms.

## 19. Files/routes/tables reference appendix

Finalisation note: This appendix lists existing repo-confirmed files, routes, Supabase tables, Stripe object mappings, and environment/config names relevant to the future live draw build. It does not list proposed future files/routes/tables from Sections 9 and 16 as existing assets.

Milestones 1-8 inspected local repository files, route structure, admin/frontend integration points, safe config files, environment variable names, Supabase migrations/types, Stripe integration code, current campaign/legal copy, official Random.org/drand documentation, current analytics/PostHog event plumbing, and final implementation-scope recommendations. Live Supabase project state and live Stripe account objects remain pending later audit milestones.

### Existing relevant files

Path: `package.json`
Purpose: Defines Next.js/React/TypeScript app dependencies, npm scripts, Stripe, Supabase, PostHog, Resend, GSAP, Zod, and Tailwind dependencies.
Draw relevance: Confirms framework and available libraries for draw pages, API routes, analytics, payments, and animation.
Confidence: Confirmed.

Path: `next.config.ts`
Purpose: Next config export, currently empty.
Draw relevance: No custom Next deployment behavior was found in this file for draw routes or assets.
Confidence: Confirmed.

Path: `app/layout.tsx`
Purpose: Root metadata/layout and provider wrapper.
Draw relevance: Uses `NEXT_PUBLIC_APP_URL` metadata base and wraps all pages with analytics providers.
Confidence: Confirmed.

Path: `app/providers.tsx`
Purpose: Client-side PostHog provider initialization.
Draw relevance: Public draw room and verification pages can use the existing provider context.
Confidence: Confirmed.

Path: `lib/site.ts`
Purpose: Site-level Monroes metadata and public offer labels.
Draw relevance: Provides brand/currency context for draw copy.
Confidence: Confirmed.

Path: `app/l/[slug]/page.tsx`
Purpose: Public landing route for campaign and landing-test pages.
Draw relevance: Main public Campaign 001/Sun God acquisition route and metadata source for Daypass/promo entry copy.
Confidence: Confirmed.

Path: `lib/landing-tests/campaign001Fallback.ts`
Purpose: Campaign 001 landing fallback for canonical and legacy slugs.
Draw relevance: Defines campaign fallback copy, public entry cap fallback, Daypass offer, and checkout-enabled config.
Confidence: Confirmed.

Path: `components/landing/LandingPageRenderer.tsx`
Purpose: Composes landing hero, Daypass offer, progress, rules summary, FAQ, and final CTA.
Draw relevance: Main public composition surface for future draw-room links and race disclaimer placement.
Confidence: Confirmed.

Path: `components/landing/LandingHero.tsx`
Purpose: Campaign hero copy and visual treatment.
Draw relevance: Uses `WIN` and free-entry copy that must stay aligned with final verified draw terms.
Confidence: Confirmed.

Path: `components/landing/LandingPricingBlock.tsx`
Purpose: Daypass quantity selection and checkout CTA copy.
Draw relevance: Public place where 1/5/10 Daypass quantities are tied to free promo entries.
Confidence: Confirmed.

Path: `components/landing/LandingOfferCard.tsx`
Purpose: Public Daypass benefits card.
Draw relevance: States Daypass benefits and free promotional entry benefit.
Confidence: Confirmed.

Path: `components/landing/LandingFAQ.tsx`
Purpose: Campaign landing FAQ.
Draw relevance: Says eligible Daypass purchases receive free entry, limited to first 100 eligible purchases unless final rules say otherwise.
Confidence: Confirmed.

Path: `components/landing/DeckPromoDetailsSection.tsx`
Purpose: Public prize/deck description section.
Draw relevance: Prize facts need final proof/value/condition review before a live draw promotion.
Confidence: Confirmed.

Path: `components/landing/CampaignRulesSummary.tsx`
Purpose: Public campaign entry-mechanics summary.
Draw relevance: Concisely states paid Daypass access first and free promo entry second.
Confidence: Confirmed.

Path: `lib/supabase/client.ts`
Purpose: Browser Supabase client.
Draw relevance: Existing client auth pattern for member/admin login UI.
Confidence: Confirmed.

Path: `lib/supabase/server.ts`
Purpose: Server Supabase anon/auth clients, including cookie-aware auth client.
Draw relevance: Existing server-side auth pattern for member/admin session checks.
Confidence: Confirmed.

Path: `lib/supabase/admin.ts`
Purpose: Server-only Supabase service-role client.
Draw relevance: Existing privileged server pattern for draw locks, snapshots, and result writes.
Confidence: Confirmed.

Path: `lib/auth/admin.ts`
Purpose: Resolves admin auth state through Supabase Auth plus `admin_profiles`.
Draw relevance: Existing gate for private draw operator screens.
Confidence: Confirmed.

Path: `components/member/MemberAuthForm.tsx`
Purpose: Member OTP/magic-link sign-in.
Draw relevance: Existing member account auth for entrant-facing entry summaries.
Confidence: Confirmed.

Path: `components/admin/AdminLoginForm.tsx`
Purpose: Admin password sign-in.
Draw relevance: Existing admin login surface for draw operations.
Confidence: Confirmed.

Path: `components/admin/AdminShell.tsx`
Purpose: Private admin shell layout.
Draw relevance: Reusable shell for draw admin controls.
Confidence: Confirmed.

Path: `components/admin/AdminNav.tsx`
Purpose: Admin navigation, including Draws, Entries, Orders, Codes, Exports, Events, Funnels.
Draw relevance: Confirms draw and entry operations already have admin IA.
Confidence: Confirmed.

Path: `app/admin/layout.tsx`
Purpose: Admin metadata/root layout with robots disabled.
Draw relevance: Confirms admin draw pages should remain private/noindex.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/layout.tsx`
Purpose: Protected admin dashboard layout.
Draw relevance: Server-side gate for all dashboard child routes, including `/admin/draws`.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/campaigns/page.tsx`
Purpose: Admin campaign operating summary.
Draw relevance: Shows revenue, Daypass quantity, entries issued, active draw pool counts, refund/cancel flags, and operational caveats.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/orders/page.tsx`
Purpose: Admin order operations and reconciliation page.
Draw relevance: Lets operators review Daypass order status, quantity, campaign, payment session reference, and refund/cancel states before draw lock.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/entries/page.tsx`
Purpose: Admin promo entry ledger.
Draw relevance: Lets operators review entry numbers, aliases, owner/current holder context, code attribution, status, locked timestamp, and order linkage.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/codes/page.tsx`
Purpose: Admin Daypass code operations page.
Draw relevance: Helps review code redemption state and pre-lock attribution context without exposing full codes.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/exports/page.tsx`
Purpose: Admin CSV export surface.
Draw relevance: Existing private export pattern for internal draw audit/reconciliation data.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/events/page.tsx`
Purpose: Admin raw event stream view.
Draw relevance: Existing surface for draw snapshot/completion and future public draw interaction events.
Confidence: Confirmed.

Path: `components/admin/MetricCard.tsx`
Purpose: Admin metric card component.
Draw relevance: Reusable for draw counts, locked entries, excluded entries, and publish status.
Confidence: Confirmed.

Path: `components/admin/EmptyState.tsx`
Purpose: Admin empty-state component.
Draw relevance: Reusable for no draw, no snapshot, no result, or no replay artifact states.
Confidence: Confirmed.

Path: `components/admin/TableScrollHint.tsx`
Purpose: Responsive table scroll hint component.
Draw relevance: Reusable for admin draw artifact/audit tables on mobile.
Confidence: Confirmed.

Path: `components/admin/CsvExportButton.tsx`
Purpose: Admin CSV export link component.
Draw relevance: Existing internal export pattern; not suitable for public verifier downloads without a redacted public export path.
Confidence: Confirmed.

Path: `app/admin/(dashboard)/draws/page.tsx`
Purpose: Manual draw lock/snapshot/result workflow UI.
Draw relevance: Most direct existing admin foundation for Verified Live Draw V1.
Confidence: Confirmed.

Path: `app/api/admin/draws/lock/route.ts`
Purpose: Admin POST endpoint for locking active campaign entries.
Draw relevance: Existing lock action before manifest/snapshot creation.
Confidence: Confirmed.

Path: `app/api/admin/draws/snapshot/route.ts`
Purpose: Admin POST endpoint for creating a draw snapshot.
Draw relevance: Existing snapshot creation action and refund-rule confirmation.
Confidence: Confirmed.

Path: `app/api/admin/draws/result/route.ts`
Purpose: Admin POST endpoint for recording a manual draw result.
Draw relevance: Existing result persistence action; insufficient for deterministic full ranking.
Confidence: Confirmed.

Path: `app/api/admin/draws/snapshots/[snapshotId]/csv/route.ts`
Purpose: Admin CSV download for a draw snapshot.
Draw relevance: Existing internal snapshot export; public verification needs a redacted counterpart.
Confidence: Confirmed.

Path: `app/draw-results/[slug]/page.tsx`
Purpose: Public draw result page.
Draw relevance: Existing public result route to evolve or link to verification/audit page.
Confidence: Confirmed.

Path: `lib/domain/draws/buildEligibleEntriesCsv.ts`
Purpose: Builds locked active entry CSV for draw snapshots.
Draw relevance: Existing canonical entry export source, but currently includes internal emails/IDs.
Confidence: Confirmed.

Path: `lib/domain/draws/hashCsvSha256.ts`
Purpose: SHA-256 hash helper for CSV snapshots.
Draw relevance: Existing hash utility for manifest integrity.
Confidence: Confirmed.

Path: `lib/domain/draws/createDrawSnapshot.ts`
Purpose: Validates draw lock timing, checks unlocked entries, stores snapshot hash/count.
Draw relevance: Existing snapshot workflow foundation.
Confidence: Confirmed.

Path: `lib/domain/draws/recordDrawResult.ts`
Purpose: Records manual winning entry number/method after hash validation.
Draw relevance: Current result model to replace or extend with deterministic seeded ranking metadata.
Confidence: Confirmed.

Path: `lib/domain/draws/getAdminDrawWorkflowState.ts`
Purpose: Loads campaign draw state, counts, snapshots, and result for admin page.
Draw relevance: Existing admin read model for draw workflow.
Confidence: Confirmed.

Path: `lib/domain/draws/getDrawResultByCampaign.ts`
Purpose: Loads public-safe draw result details.
Draw relevance: Existing public result read model.
Confidence: Confirmed.

Path: `app/api/checkout/daypass/route.ts`
Purpose: Creates Daypass checkout sessions and pending orders.
Draw relevance: Upstream source for paid Daypass eligibility.
Confidence: Confirmed.

Path: `app/api/stripe/webhook/route.ts`
Purpose: Handles Stripe webhook verification, idempotency, and checkout fulfillment.
Draw relevance: Trusted payment completion path for issuing access and entries.
Confidence: Confirmed.

Path: `lib/domain/payments/stripe.ts`
Purpose: Stripe client/config and Daypass price resolution.
Draw relevance: Confirms Stripe price/env config names and checkout base URL convention.
Confidence: Confirmed.

Path: `lib/domain/payments/createCheckoutSession.ts`
Purpose: Creates Stripe Checkout sessions with campaign/order metadata.
Draw relevance: Links payment sessions to campaign/order context used for entries.
Confidence: Confirmed.

Path: `lib/domain/payments/fulfillCheckout.ts`
Purpose: Retrieves paid Stripe sessions, validates pricing, grants access, creates codes/entries, logs events, sends email.
Draw relevance: Main fulfillment path for entry issuance.
Confidence: Confirmed.

Path: `lib/domain/access/grantAccess.ts`
Purpose: Calls `fulfill_daypass_order` RPC and parses fulfillment summary.
Draw relevance: Connects checkout fulfillment to Supabase entry/access creation.
Confidence: Confirmed.

Path: `lib/domain/daypass-codes/generateDaypassCodes.ts`
Purpose: Generates friend Daypass code records with hash/encryption metadata.
Draw relevance: Friend codes can transfer entry holder attribution before draw lock.
Confidence: Confirmed.

Path: `lib/domain/daypass-codes/redeemDaypassCode.ts`
Purpose: Calls `redeem_daypass_code` RPC and parses redemption/attribution result.
Draw relevance: Defines pre-lock current-holder attribution behavior.
Confidence: Confirmed.

Path: `app/api/daypass/redeem/route.ts`
Purpose: Redeems a Daypass code for the authenticated member.
Draw relevance: Entrant attribution can change through this API before draw lock.
Confidence: Confirmed.

Path: `lib/domain/campaigns/config.ts`
Purpose: Campaign 001 seed/config with timing fields and placeholder launch warnings.
Draw relevance: Contains `entries_close_at`, `draw_lock_at`, and `draw_at` definitions.
Confidence: Confirmed.

Path: `lib/domain/campaigns/publicContent.ts`
Purpose: Public Campaign 001 promo copy/mechanics/draw process.
Draw relevance: Existing public draw and eligibility copy foundation.
Confidence: Confirmed.

Path: `lib/domain/campaigns/publicProgress.ts`
Purpose: Public campaign progress count for live/closed/locked/drawn statuses.
Draw relevance: Existing public entry-count pattern could support draw room status.
Confidence: Confirmed.

Path: `components/landing/LivePromotionProgressSection.tsx`
Purpose: Public promotion progress and timeline UI.
Draw relevance: Reusable concept for pre-draw progress and draw-status copy.
Confidence: Confirmed.

Path: `components/marketing/ScrollReveal.tsx`
Purpose: GSAP-powered scroll reveal helper with a `prefers-reduced-motion` guard.
Draw relevance: Confirms GSAP is available and provides a local accessibility pattern for motion-sensitive draw animations.
Confidence: Confirmed.

Path: `lib/domain/email/templates.ts`
Purpose: Transactional purchase/code email templates.
Draw relevance: Sends Daypass quantity, promo entry count, planned draw timing, rules/refund links, and attribution-lock copy to purchasers.
Confidence: Confirmed.

Path: `components/member/PromoEntriesCard.tsx`
Purpose: Member-facing promo entry summary.
Draw relevance: Existing entry number/alias display surface for entrants.
Confidence: Confirmed.

Path: `components/member/DrawProcessCard.tsx`
Purpose: Member-facing draw timing/process card.
Draw relevance: Existing draw timing display.
Confidence: Confirmed.

Path: `components/member/MemberOrderHistory.tsx`
Purpose: Member-facing order history.
Draw relevance: Shows Daypass purchase quantities/statuses that help entrants reconcile entries.
Confidence: Confirmed.

Path: `components/member/DaypassCodeList.tsx`
Purpose: Member-facing friend Daypass code status summary.
Draw relevance: Shows only last-four/status for friend codes, supporting private-code handling before draw lock.
Confidence: Confirmed.

Path: `components/member/MemberAccessStatusCard.tsx`
Purpose: Member-facing access status and activation card.
Draw relevance: Reinforces Daypass access as the purchased product and promo entry as an eligible benefit.
Confidence: Confirmed.

Path: `lib/domain/members/summaries.ts`
Purpose: Member order/code/entry summaries.
Draw relevance: Existing account data source for member entry visibility.
Confidence: Confirmed.

Path: `lib/analytics/types.ts`
Purpose: Analytics event name registry, including draw events.
Draw relevance: Existing event vocabulary for draw audit events.
Confidence: Confirmed.

Path: `lib/analytics/trackEvent.ts`
Purpose: Client event capture to PostHog, Meta Pixel, and Supabase event API.
Draw relevance: Existing client analytics dispatch path for public draw pages.
Confidence: Confirmed.

Path: `lib/db/events.ts`
Purpose: Server-side Supabase event log insert.
Draw relevance: Existing event log write path for admin/draw backend events.
Confidence: Confirmed.

Path: `lib/db/admin-v1-reports.ts`
Purpose: Admin reports for orders, entries, codes, access grants, webhooks, outbound emails.
Draw relevance: Existing operational read models for draw eligibility review.
Confidence: Confirmed.

Path: `app/api/admin/export/route.ts`
Purpose: Admin CSV exports for leads/events/orders/entries/codes/access/webhooks/emails.
Draw relevance: Existing internal export system; public verification must be separately redacted.
Confidence: Confirmed.

Path: `app/terms/page.tsx`
Purpose: Site terms.
Draw relevance: Mentions promotional entries and rules.
Confidence: Confirmed.

Path: `app/privacy/page.tsx`
Purpose: Privacy notice.
Draw relevance: Mentions payment/member/promo-entry records and analytics limits.
Confidence: Confirmed.

Path: `app/refund-policy/page.tsx`
Purpose: Refund/cancellation policy.
Draw relevance: Mentions promo entry impacts and draw-lock review.
Confidence: Confirmed.

Path: `app/promo-rules/[slug]/page.tsx`
Purpose: Public promotion rules.
Draw relevance: Existing rule copy for snapshot hash, transparent draw, and public privacy limits.
Confidence: Confirmed.

Path: `components/marketing/OfferCards.tsx`
Purpose: Homepage Daypass/Ultra offer cards.
Draw relevance: General product copy should avoid implying campaign entry outside campaign-specific surfaces.
Confidence: Confirmed.

Path: `components/marketing/FAQ.tsx`
Purpose: Homepage FAQ.
Draw relevance: Defines Daypass as one-time 12-hour access and Ultra as ongoing membership.
Confidence: Confirmed.

Path: `components/preview/MembershipPreviewBlock.tsx`
Purpose: Reusable member-market preview block.
Draw relevance: Supports product value framing separate from promotion/draw entry copy.
Confidence: Confirmed.

Path: `supabase/migrations/20260512000000_create_core_schema.sql`
Purpose: Core admin, landing, waitlist, analytics, export schema/RLS.
Draw relevance: Confirms event logs/admin profiles/export logs foundation.
Confidence: Confirmed.

Path: `supabase/migrations/20260519000000_create_lean_v1_schema.sql`
Purpose: Member, campaign, order, access, code, entry, listing, draw, email, Stripe webhook schema/RLS.
Draw relevance: Confirms core tables for draw eligibility, snapshots, and results.
Confidence: Confirmed.

Path: `supabase/migrations/20260519002000_create_daypass_fulfillment_rpc.sql`
Purpose: Fulfillment RPC for Daypass orders.
Draw relevance: Issues promo entries and reserves campaign entry numbers.
Confidence: Confirmed.

Path: `supabase/migrations/20260519003000_create_daypass_redemption_rpc.sql`
Purpose: Daypass redemption RPC.
Draw relevance: Updates promo entry holder attribution before draw lock.
Confidence: Confirmed.

Path: `lib/types/database.ts`
Purpose: Generated/maintained TypeScript database types.
Draw relevance: Confirms table/function type names used by the app.
Confidence: Confirmed.

### Existing relevant routes

Route: `/`
Purpose: Public Monroes homepage.
Draw relevance: Top-level marketing surface that can link to campaign/draw pages.
Confidence: Confirmed.

Route: `/l/[slug]`
Purpose: Public landing pages, including Campaign 001/Sun God fallback.
Draw relevance: Campaign acquisition and checkout entry point.
Confidence: Confirmed.

Route: `/l/sungod`
Purpose: Canonical public Campaign 001/Sun God landing page.
Draw relevance: Main customer-facing Daypass and free promo-entry purchase path.
Confidence: Confirmed.

Route: `/l/campaign-001`
Purpose: Legacy/fallback Campaign 001 landing slug.
Draw relevance: Still resolves to Campaign 001 fallback copy and checkout context.
Confidence: Confirmed.

Route: `/promo-rules/[slug]`
Purpose: Public promotion rules page.
Draw relevance: Existing rules/copy home for draw mechanics and verification language.
Confidence: Confirmed.

Route: `/promo-rules/sungod`
Purpose: Public Sun God promotion rules route.
Draw relevance: Current home for eligibility, entry, refund, snapshot, draw, winner, and privacy wording.
Confidence: Confirmed.

Route: `/draw-results/[slug]`
Purpose: Public draw result page.
Draw relevance: Existing public result surface to evolve into or connect with verification/audit page.
Confidence: Confirmed.

Route: `/draw-results/sungod`
Purpose: Public Sun God draw-result route aliasing to Campaign 001 result lookup.
Draw relevance: Existing public result route for winner alias, winning entry, snapshot hash, and draw method.
Confidence: Confirmed.

Route: `/redeem`
Purpose: Daypass code redemption page.
Draw relevance: Friend code redemption can change current entry holder before draw lock.
Confidence: Confirmed.

Route: `/member`
Purpose: Member dashboard.
Draw relevance: Shows member access, orders, codes, promo entries, and draw process.
Confidence: Confirmed.

Route: `/member/login`
Purpose: Member login by email OTP.
Draw relevance: Auth entry for entrants to see account-linked entries.
Confidence: Confirmed.

Route: `/member/listings`
Purpose: Private member listings.
Draw relevance: Confirms access gating pattern for member-only pages.
Confidence: Confirmed.

Route: `/checkout/success`
Purpose: Checkout success page.
Draw relevance: Post-checkout customer flow, but fulfillment relies on webhook.
Confidence: Confirmed.

Route: `/checkout/cancel`
Purpose: Checkout cancel page.
Draw relevance: Non-eligible abandoned checkout flow.
Confidence: Confirmed.

Route: `/terms`
Purpose: Site terms page.
Draw relevance: Legal/copy dependency for promotion and entries.
Confidence: Confirmed.

Route: `/privacy`
Purpose: Privacy notice.
Draw relevance: Public privacy framing for draw verification and analytics.
Confidence: Confirmed.

Route: `/refund-policy`
Purpose: Refund and cancellation policy.
Draw relevance: Eligibility/exclusion implications for draw snapshots.
Confidence: Confirmed.

Route: `/admin/login`
Purpose: Admin login.
Draw relevance: Operator access entry point.
Confidence: Confirmed.

Route: `/admin`
Purpose: Admin overview dashboard.
Draw relevance: Existing private operations area.
Confidence: Confirmed.

Route: `/admin/campaigns`
Purpose: Admin campaign overview.
Draw relevance: Campaign status/timing context for draw operations.
Confidence: Confirmed.

Route: `/admin/orders`
Purpose: Admin order operations.
Draw relevance: Review purchase/payment states before eligibility lock.
Confidence: Confirmed.

Route: `/admin/entries`
Purpose: Admin promo entry ledger.
Draw relevance: Review active/refunded/cancelled/void/disqualified entries before snapshot.
Confidence: Confirmed.

Route: `/admin/codes`
Purpose: Admin Daypass code operations.
Draw relevance: Review redemption state and attribution context.
Confidence: Confirmed.

Route: `/admin/draws`
Purpose: Admin draw lock/snapshot/result workflow.
Draw relevance: Existing draw operator route.
Confidence: Confirmed.

Route: `/admin/exports`
Purpose: Admin CSV exports.
Draw relevance: Existing internal export pattern for audit support.
Confidence: Confirmed.

Route: `/admin/events`
Purpose: Admin analytics events view.
Draw relevance: Existing event audit surface.
Confidence: Confirmed.

Route: `/admin/funnels`
Purpose: Admin funnel reporting.
Draw relevance: Existing analytics/report pattern.
Confidence: Confirmed.

Route: `/admin/leads`
Purpose: Admin lead review.
Draw relevance: Adjacent but not direct draw eligibility source.
Confidence: Confirmed.

Route: `/admin/tests`
Purpose: Admin landing test review.
Draw relevance: Adjacent campaign/landing operations surface.
Confidence: Confirmed.

Route: `/admin/tests/[id]/results`
Purpose: Admin landing test result detail page.
Draw relevance: Adjacent reporting pattern for campaign operations; not direct draw eligibility.
Confidence: Confirmed.

Route: `/auth/callback`
Purpose: Supabase Auth callback.
Draw relevance: Shared member/admin auth session flow.
Confidence: Confirmed.

Route: `/api/checkout/daypass`
Purpose: Starts Daypass Stripe Checkout.
Draw relevance: Upstream purchase source for entries.
Confidence: Confirmed.

Route: `/api/stripe/webhook`
Purpose: Processes Stripe webhook events.
Draw relevance: Trusted fulfillment path for eligibility records.
Confidence: Confirmed.

Route: `/api/daypass/redeem`
Purpose: Redeems Daypass codes.
Draw relevance: Can update entry holder attribution before draw lock.
Confidence: Confirmed.

Route: `/api/member/access/activate`
Purpose: Activates pending Daypass access.
Draw relevance: Member access lifecycle; not directly eligibility, but tied to Daypass records.
Confidence: Confirmed.

Route: `/api/events`
Purpose: Receives selected analytics events.
Draw relevance: Existing event logging endpoint for public draw interactions.
Confidence: Confirmed.

Route: `/api/waitlist`
Purpose: Waitlist lead submission.
Draw relevance: Adjacent marketing system; not direct entry eligibility.
Confidence: Confirmed.

Route: `/api/admin/export`
Purpose: Admin CSV export endpoint.
Draw relevance: Internal audit/export mechanism.
Confidence: Confirmed.

Route: `/api/admin/draws/lock`
Purpose: Locks eligible campaign entries.
Draw relevance: Existing pre-snapshot draw step.
Confidence: Confirmed.

Route: `/api/admin/draws/snapshot`
Purpose: Creates draw snapshot hash/count.
Draw relevance: Existing manifest integrity step.
Confidence: Confirmed.

Route: `/api/admin/draws/result`
Purpose: Records manual draw result.
Draw relevance: Existing result storage step; must be expanded for verified deterministic draw.
Confidence: Confirmed.

Route: `/api/admin/draws/snapshots/[snapshotId]/csv`
Purpose: Downloads internal draw snapshot CSV.
Draw relevance: Existing admin audit export; not public-safe as-is.
Confidence: Confirmed.

### Existing relevant Supabase tables

Table: `auth.users`
Purpose: Supabase-managed authenticated users.
Draw relevance: Source identity for admins/members; draw eligibility should reference `member_profiles`, not auth metadata.
Confidence: Confirmed.

Table: `admin_profiles`
Purpose: Admin allow-list tied to Supabase Auth users.
Draw relevance: Protects admin draw operations.
Confidence: Confirmed.

Table: `member_profiles`
Purpose: Member/customer profile records linked by auth user, email, and optional Stripe customer ID.
Draw relevance: Private holder/owner/referrer context for entries.
Confidence: Confirmed.

Table: `promo_campaigns`
Purpose: Campaign metadata, status, prize/timing/rules fields.
Draw relevance: Campaign scope, entry close, draw lock, planned draw, and terms version.
Confidence: Confirmed.

Table: `commerce_offers`
Purpose: Sellable/access offer records such as Daypass.
Draw relevance: Confirms active Daypass offer context for entry-issuing purchases.
Confidence: Confirmed.

Table: `orders`
Purpose: Checkout/order ledger with purchaser, payment, fulfillment, status, and attribution fields.
Draw relevance: Purchase source and refund/cancellation state behind entries.
Confidence: Confirmed.

Table: `order_items`
Purpose: Per-order line items with campaign, offer, type, and quantity.
Draw relevance: Daypass quantity determines promo entry count.
Confidence: Confirmed.

Table: `access_grants`
Purpose: Daypass/Ultra access grants and activation windows.
Draw relevance: Adjacent member access lifecycle; not canonical eligibility by itself.
Confidence: Confirmed.

Table: `daypass_codes`
Purpose: Friend Daypass code records with hash, encrypted code, last-four, redemption, and campaign/order linkage.
Draw relevance: Code redemption can transfer promo entry holder before draw lock.
Confidence: Confirmed.

Table: `promo_entries`
Purpose: Promotion entry/ticket ledger.
Draw relevance: Canonical internal source for eligible draw entries.
Confidence: Confirmed.

Table: `promo_campaign_entry_counters`
Purpose: Per-campaign sequential entry number counter.
Draw relevance: Prevents duplicate entry numbers during fulfillment.
Confidence: Confirmed.

Table: `draw_snapshots`
Purpose: Draw snapshot metadata with entry count and CSV SHA-256.
Draw relevance: Current internal manifest hash record; insufficient alone for public verification.
Confidence: Confirmed.

Table: `draw_results`
Purpose: Manual recorded draw result and winner reference.
Draw relevance: Current public result source; needs extension/replacement for deterministic verified ranking.
Confidence: Confirmed.

Table: `stripe_webhook_events`
Purpose: Stripe webhook idempotency and diagnostics.
Draw relevance: Payment fulfillment audit source for entry issuance.
Confidence: Confirmed.

Table: `event_logs`
Purpose: Analytics/business event log.
Draw relevance: Existing draw snapshot/completion event logging, but not a canonical draw audit ledger.
Confidence: Confirmed.

Table: `export_logs`
Purpose: Admin export action log.
Draw relevance: Internal audit for CSV exports.
Confidence: Confirmed.

Table: `outbound_emails`
Purpose: Transactional email delivery/idempotency log.
Draw relevance: Future winner/operator notification audit surface.
Confidence: Confirmed.

Table: `landing_page_tests`
Purpose: Public/live and admin/draft landing-page configuration.
Draw relevance: Campaign acquisition/source context; not eligibility.
Confidence: Confirmed.

Table: `waitlist_leads`
Purpose: Waitlist/access-list leads and marketing attribution.
Draw relevance: No direct eligibility role.
Confidence: Confirmed.

Table: `lead_preferences`
Purpose: Preferences attached to waitlist leads.
Draw relevance: No direct eligibility role.
Confidence: Confirmed.

Table: `visitor_sessions`
Purpose: Anonymous visitor/session attribution records.
Draw relevance: Analytics only, not eligibility.
Confidence: Confirmed.

Table: `listings`
Purpose: Member-only deck listing records.
Draw relevance: Not eligibility; may support prize/listing context and UI patterns.
Confidence: Confirmed.

### Existing relevant Stripe objects

Object: Campaign 001 1 Daypass Stripe Price (`STRIPE_DAYPASS_PRICE_ID`, with optional `commerce_offers.stripe_price_id` fallback)
Purpose: Price used for single-Daypass Checkout Sessions.
Draw relevance: A paid single Daypass should create one active promo entry after webhook fulfillment.
Confidence: Confirmed.

Object: Campaign 001 5 Daypass bundle Stripe Price (`STRIPE_5X_DAYPASS_PRICE_ID`)
Purpose: Price used for the 5-Daypass bundle Checkout option.
Draw relevance: A paid 5x bundle should create five active promo entries and four friend Daypass codes after webhook fulfillment.
Confidence: Confirmed.

Object: Campaign 001 10 Daypass bundle Stripe Price (`STRIPE_10X_DAYPASS_PRICE_ID`)
Purpose: Price used for the 10-Daypass bundle Checkout option.
Draw relevance: A paid 10x bundle should create ten active promo entries and nine friend Daypass codes after webhook fulfillment.
Confidence: Confirmed.

Object: Stripe Checkout Session (`checkout.session`)
Purpose: Hosted payment session created by the app for Daypass checkout.
Draw relevance: Carries `client_reference_id`, order/campaign/offer metadata, selected checkout option, expected totals, and Daypass quantity used by fulfillment.
Confidence: Confirmed.

Object: Stripe PaymentIntent created by Checkout
Purpose: Payment object behind the Checkout Session; app attaches the same metadata when creating the session.
Draw relevance: Stored on `orders.stripe_payment_intent_id` after fulfillment and useful for payment reconciliation.
Confidence: Confirmed.

Object: Stripe Customer attached to Checkout Session
Purpose: Customer identifier returned by Stripe Checkout.
Draw relevance: Stored on `member_profiles.stripe_customer_id` and `orders.stripe_customer_id` when present; helpful for support/reconciliation, not public verification.
Confidence: Confirmed.

Object: `checkout.session.completed` webhook event
Purpose: The only Stripe event type currently fulfilled by the app.
Draw relevance: Triggers paid-session validation and creation of access grants, Daypass codes, and promo entries.
Confidence: Confirmed.

Object: Stripe webhook endpoint/signing secret (`STRIPE_WEBHOOK_SECRET`)
Purpose: Verifies incoming Stripe webhook signatures before processing.
Draw relevance: Required to trust payment-completion events that create entries.
Confidence: Confirmed.

Object: `checkout.session.expired`, payment failure, refund, dispute, and chargeback Stripe events
Purpose: Payment lifecycle and reversal events that may affect eligibility.
Draw relevance: Needed to automatically remove or flag entries before draw lock if payment state changes.
Confidence: Confirmed.

Object: Monroes Ultra subscription Stripe product/price
Purpose: Potential subscription offer referenced by internal `ultra_monthly` seed.
Draw relevance: No confirmed V1 draw eligibility meaning or active checkout route.
Confidence: Unknown.

Object: Marketplace/listing Stripe products/prices
Purpose: Potential future listing purchase payments.
Draw relevance: No confirmed relationship to draw eligibility.
Confidence: Unknown.

### Existing relevant environment variables/config names

Name: `NEXT_PUBLIC_APP_URL`
Purpose: Public app base URL for metadata, auth redirects, checkout success/cancel URLs, and emails.
Draw relevance: Needed for public draw room/verification URLs and links.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `NEXT_PUBLIC_SUPABASE_URL`
Purpose: Public Supabase project URL used by browser/server clients and seed scripts.
Draw relevance: Required for all Supabase-backed draw reads/writes.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Purpose: Public Supabase anon key used by browser/server auth clients.
Draw relevance: Required for auth client creation.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `SUPABASE_SERVICE_ROLE_KEY`
Purpose: Server-only Supabase service role key.
Draw relevance: Used by privileged server operations that would include draw locking/snapshots/results.
Secret? yes
Do not expose value.
Confidence: Confirmed.

Name: `NEXT_PUBLIC_POSTHOG_KEY`
Purpose: Public PostHog project key.
Draw relevance: Enables client analytics for draw room/verification interactions.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `NEXT_PUBLIC_POSTHOG_HOST`
Purpose: Public PostHog host override.
Draw relevance: Analytics endpoint config for draw events.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `NEXT_PUBLIC_META_PIXEL_ID`
Purpose: Public Meta Pixel identifier.
Draw relevance: Existing marketing analytics config; draw pages must avoid PII in pixel events.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
Purpose: Public Cloudflare Turnstile site key.
Draw relevance: Could be reused if public draw forms/actions need bot protection.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `TURNSTILE_SECRET_KEY`
Purpose: Server-only Cloudflare Turnstile verification secret.
Draw relevance: Server validation for protected public/admin form submissions if needed.
Secret? yes
Do not expose value.
Confidence: Confirmed.

Name: `STRIPE_SECRET_KEY`
Purpose: Server-only Stripe API key.
Draw relevance: Existing checkout/webhook fulfillment path uses Stripe records to issue eligibility.
Secret? yes
Do not expose value.
Confidence: Confirmed.

Name: `STRIPE_WEBHOOK_SECRET`
Purpose: Server-only Stripe webhook signing secret.
Draw relevance: Ensures paid checkout events are trusted before entries are issued.
Secret? yes
Do not expose value.
Confidence: Confirmed.

Name: `STRIPE_DAYPASS_PRICE_ID`
Purpose: Stripe price ID for single Daypass checkout option.
Draw relevance: Price configuration for entry-issuing Daypass purchase flow.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `STRIPE_5X_DAYPASS_PRICE_ID`
Purpose: Stripe price ID for 5x Daypass checkout option.
Draw relevance: Bundle configuration affecting entry quantity.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `STRIPE_10X_DAYPASS_PRICE_ID`
Purpose: Stripe price ID for 10x Daypass checkout option.
Draw relevance: Bundle configuration affecting entry quantity.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `ALLOW_DRAFT_CAMPAIGN_CHECKOUT`
Purpose: Allows draft Campaign 001 checkout outside production guard.
Draw relevance: Operational setting that could affect test/draft entry issuance before launch.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `RESEND_API_KEY`
Purpose: Server-only Resend API key.
Draw relevance: Existing transactional email provider; could support winner/operator notifications later.
Secret? yes
Do not expose value.
Confidence: Confirmed.

Name: `TRANSACTIONAL_EMAIL_FROM`
Purpose: Transactional email sender address.
Draw relevance: Needed for any future draw/winner notification emails.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `SUPPORT_EMAIL`
Purpose: Support contact email fallback.
Draw relevance: Public draw/verification and winner support copy may reference it.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `DAYPASS_CODE_ENCRYPTION_KEY`
Purpose: Server-only Daypass code encryption key.
Draw relevance: Protects private Daypass code recovery data; must never enter public draw artifacts.
Secret? yes
Do not expose value.
Confidence: Confirmed.

Name: `DAYPASS_CODE_ENCRYPTION_KEY_VERSION`
Purpose: Daypass code encryption key version label.
Draw relevance: Operational metadata for private code records; not part of public draw verification.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `SEED_DEMO_DATA_CONFIRM`
Purpose: Confirmation guard for demo data seeding script.
Draw relevance: Helps avoid accidental seeded data in operational contexts; not used by draw runtime.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `VERCEL_ENV`
Purpose: Deployment environment indicator checked by demo seed script.
Draw relevance: Relevant to operational safeguards for non-production/prod data behavior.
Secret? no
Do not expose value.
Confidence: Confirmed.

Name: `NODE_ENV`
Purpose: Runtime environment mode.
Draw relevance: Used for draft checkout behavior and development logging.
Secret? no
Do not expose value.
Confidence: Confirmed.

## 20. Final recommendation

Recommended build path: Build the verified backend and audit artifacts first, then admin controls, then public verification, then animation/replay. Do not start with the race UI.

Recommended first implementation: Verified draw engine + public elimination board + final 20 race reveal + public verification/audit page.

Recommended randomness source: drand public randomness beacon.

Recommended fallback randomness/source approach: Random.org Signed API with signed response/proof storage. If drand and Random.org are both unavailable, pause the draw rather than using internal RNG.

Recommended animation approach: 2D/2.5D stored replay using CSS/GSAP/SVG/canvas. The elimination board should use batched/virtualized tiles, and the final 20 race should replay stored ranking events. The verified random draw determines the result. The live race is an animated reveal/replay of the already-determined result. The race does not choose, alter, or influence the winner.

Recommended public verification approach: Publish a redacted verification record showing locked manifest hash, public manifest/row hashes, randomness source/proof, final seed hash, algorithm version, ranking hash, replay hash, winner entry number/public label, and verification JSON. Keep private manifest, emails, payment IDs, order IDs, member IDs, and Daypass code data admin-only.

Estimated complexity: Medium-high. The current app has enough foundation, but the verified draw engine, public verifier, replay artifacts, and operational safeguards are non-trivial and should be built in staged milestones with tests.

Biggest risk: Trust/compliance failure from launching before legal terms, no-purchase/refund rules, public display rules, and deterministic audit artifacts are final.

Best immediate next step: Peter/operator should answer the Section 18 decisions, especially entry quantities, no-purchase entry, prize count, public display format, randomness choice, refund/dispute handling, and legal/compliance review path. After that, start Milestone 1: draw data model and migrations.
