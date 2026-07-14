# Nightthread

Nightthread is a private, desktop-first collaborative trip planner for collecting saved places, shaping flexible days, and seeing a multi-city journey emerge.

The Next.js product is the shared interface and Cloudflare remains the only durable backend. `apps/desktop` is a hardened Electron delivery shell for the same product; it does not fork trip behavior or introduce an offline database.

## Stack

- Next.js 16 App Router on Cloudflare Workers through OpenNext
- D1 and Drizzle for relational state and generated migrations
- Private R2 assets behind membership-checked handlers
- One hibernating Durable Object per trip for presence, 30-second edit leases, and ordered patches
- Better Auth with Google and Resend-backed 10-minute magic links
- Better Auth device authorization and bearer sessions for the Electron client
- MapLibre, Motion, dnd-kit, Zod, Vitest, and Playwright
- Electron, electron-builder, and electron-updater for signed desktop beta delivery

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate:local
pnpm dev
```

Set `NEXT_PUBLIC_DEMO_MODE=true` during local development to expose the realistic Tokyo–Kyoto–Osaka journey and a loopback-only local test sign-in. The sign-in requires development mode and a localhost address in addition to the flag; production requests are rejected even if the flag is set. Demo fixtures remain separate from authenticated product data.

The larger `/trips/demo-wanderlog` fixture transcribes the public Budapest–Prague–Alps trip documented in [WANDERLOG_STRESS_TEST.md](./WANDERLOG_STRESS_TEST.md). It exists to exercise long-trip navigation, transfers, flexible items, empty days, and eight-city map behavior without writing to D1.

## Desktop development

Run the web app on port 3000, then launch the Electron shell separately:

```bash
pnpm dev
pnpm desktop:dev
```

The desktop app opens authentication in the system browser, encrypts the exchanged session with the operating system credential store, and injects it only for the exact configured Nightthread origin. The renderer receives the narrow contract in `packages/desktop-contract`; it never receives the bearer token or generic IPC access.

Desktop checks are `pnpm desktop:test` and `pnpm --filter @nightthread/desktop e2e`. Packaging requires a clean HTTPS `NIGHTTHREAD_WEB_ORIGIN`; `pnpm desktop:package` produces the platform artifacts defined in `apps/desktop/electron-builder.yml`.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm desktop:test
pnpm build
pnpm e2e
pnpm --filter @nightthread/desktop e2e
pnpm exec opennextjs-cloudflare build
pnpm exec wrangler deploy --dry-run
```

## Cloudflare setup

Create a D1 database, private R2 bucket, and Worker, then replace the placeholder D1 ID in `wrangler.jsonc`. Populate Worker secrets from `.env.example`; never commit them. Google OAuth must use the stable Worker callback URL, and Resend magic links require a verified user-owned sending domain.

Generate schema changes with `pnpm db:generate`, review the SQL, and apply them locally before using `pnpm db:migrate:remote`. Deploy with `pnpm deploy` after the required credentials and Cloudflare resources exist.

The scheduled Worker purge runs every five minutes. Deleted records disappear immediately, accept undo strictly within ten seconds, and are permanently purged after expiry.

## Desktop beta releases

Tags matching `desktop-v*` run `.github/workflows/desktop-release.yml`. The workflow verifies the web, Worker, and Electron boundaries; signs and notarizes a universal macOS DMG/ZIP; signs a Windows x64 NSIS installer; and publishes one public GitHub prerelease with beta updater metadata. Public installers do not bypass Nightthread authentication or trip invitations.

The repository does not contain signing material. Release setup requires the stable Worker origin as the `NIGHTTHREAD_WEB_ORIGIN` repository variable, Apple and Windows signing certificates, and Apple notarization credentials in GitHub Actions secrets. Until those prerequisites exist, local unsigned packaging is a smoke check rather than a distributable beta.
