# Monroes

Lean V1 build for Monroes, an Australia-only private member deck market concept for OG, rare, vintage, and interesting skateboard decks.

The repo now includes the V0 demand-validation foundation plus additive V1 Daypass, member access, listings, checkout, fulfilment, redemption, transactional email, and campaign trust scaffolding. It still avoids seller tools, listing submissions, wishlist, cart, auctions, and CMS complexity.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- shadcn/ui-compatible `components/` and `lib/` structure

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Development Workflow

The intended workflow is:

```text
Codex -> GitHub branch/PR -> Vercel preview -> review -> merge to main -> Vercel production deploy
```

Use short-lived feature branches for each milestone. Vercel preview deployments should be reviewed before merging to `main`, and `main` should remain the production deployment source.

## Environment Variables

Copy `.env.example` to `.env.local` when local environment values are needed. The placeholders are present for future milestones only; no environment variables are required for Milestone 0.

Supabase schema notes and manual migration steps live in `docs/database-schema.md`.
