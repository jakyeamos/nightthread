# Nightthread

Nightthread is a private, desktop-first collaborative trip planner for collecting saved places, shaping flexible days, and seeing a multi-city journey emerge.

## Stack

- Next.js 16 App Router on Cloudflare Workers through OpenNext
- D1 and Drizzle for relational state and generated migrations
- Private R2 assets behind membership-checked handlers
- One hibernating Durable Object per trip for presence, 30-second edit leases, and ordered patches
- Better Auth with Google and Resend-backed 10-minute magic links
- MapLibre, Motion, dnd-kit, Zod, Vitest, and Playwright

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate:local
pnpm dev
```

Set `NEXT_PUBLIC_DEMO_MODE=true` to expose the realistic Tokyo–Kyoto–Osaka journey at `/trips/demo/planner`. It is intentionally separate from authenticated product data.

The larger `/trips/demo-wanderlog` fixture transcribes the public Budapest–Prague–Alps trip documented in [WANDERLOG_STRESS_TEST.md](./WANDERLOG_STRESS_TEST.md). It exists to exercise long-trip navigation, transfers, flexible items, empty days, and eight-city map behavior without writing to D1.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm exec opennextjs-cloudflare build
pnpm exec wrangler deploy --dry-run
```

## Cloudflare setup

Create a D1 database, private R2 bucket, and Worker, then replace the placeholder D1 ID in `wrangler.jsonc`. Populate Worker secrets from `.env.example`; never commit them. Google OAuth must use the stable Worker callback URL, and Resend magic links require a verified user-owned sending domain.

Generate schema changes with `pnpm db:generate`, review the SQL, and apply them locally before using `pnpm db:migrate:remote`. Deploy with `pnpm deploy` after the required credentials and Cloudflare resources exist.

The scheduled Worker purge runs every five minutes. Deleted records disappear immediately, accept undo strictly within ten seconds, and are permanently purged after expiry.
