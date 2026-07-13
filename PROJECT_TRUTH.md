# Nightthread Project Truth

## Current State

Nightthread's light workspace, journey maps, Cloudflare foundation, domain rules, and long-trip demo are implemented on the feature branch. A hands-on authenticated browser test created a real Budapest trip in local D1, but exposed that the planner, saved ideas, settings, and activity surfaces still render Tokyo demo data and do not provide the D1-backed mutations required to enter the itinerary. Release 1 is therefore not production-complete despite the passing fixture and build checks.

## Current Position

- Phase: authenticated product implementation
- Branch: `codex/nightthread-v1`
- Foundation commit: `688418f`
- Implementation commit: `1d55d5e`
- Collaboration mutation commit: `b22e0bd`
- Light workspace and night globe commit: `f80cea3`
- Wanderlog stress fixture commit: `6a5e5de`
- Long-trip usability commit: `5cda5b6`
- Local test authentication commit: `5491330`
- Build: passing Next.js and OpenNext production builds
- Tests: 33 unit/contract tests and 15 fixture-focused Chromium critical-flow checks passing
- Deployment: Wrangler dry run passes; live resources and credentials are not configured
- Remote: `https://github.com/jakyeamos/nightthread.git`

## Next Step

Replace demo-backed authenticated surfaces with authoritative D1 loaders and mutations, beginning with city/day/night setup, then saved ideas and itinerary editing. Repeat the full Wanderlog entry through the browser before resuming deployment readiness.

## Blockers

- Production deployment requires Cloudflare, Google OAuth, Geoapify, Unsplash, Resend, and a verified sending-domain configuration.
- Real trip entry is blocked after initial creation: authenticated planner, saved ideas, settings, and activity pages still use Tokyo demo data, and visible add controls do not create product records.
- Trip creation writes the trip and first city but creates no days or stay nights, causing the dated Budapest trip to open with zero days and label Budapest as a transfer stop.
- The map tile proxy references the Workers Cache API directly, which throws `caches is not defined` under the current Next.js local development runtime.

## Risks

- External free-tier limits and provider availability may change.
- Full multi-client realtime, OAuth callback, magic-link delivery, and private-R2 integration require deployed Cloudflare resources for final validation.
- Wrangler warns that an internal Durable Object is unavailable inside Next's local dev proxy; the custom OpenNext Worker bundle exports it and passes the Wrangler deployment dry run.
- Fixture-focused browser tests can pass while authenticated product routes remain demo-backed; release gates must include creation and mutation of a fresh D1 trip.

## Recent Progress

- 2026-07-13: Committed the product, design, truth, and repository foundation (`688418f`).
- 2026-07-13: Approved Nightthread Production V1 plan and design direction.
- 2026-07-13: Implemented the full V1 application and Cloudflare architecture (`1d55d5e`).
- 2026-07-13: Passed lint, typecheck, 14 unit tests, D1 migration, five browser flows, Next/OpenNext builds, and Worker dry run.
- 2026-07-13: Added the repository-local Pre-CR security, checklist, and test command contract (`8931425`).
- 2026-07-13: Kept machine-local AIOS audit output outside project source control (`a96875a`).
- 2026-07-13: Added membership-checked vote, reaction, invitation regeneration, deletion, and strict-window undo endpoints (`b22e0bd`).
- 2026-07-13: Replaced app-wide darkness with the light planning system, dusk welcome, protected Geoapify tiles, and NASA night globe (`f80cea3`).
- 2026-07-13: Added the 18-day, eight-city Wanderlog stress fixture and prioritized the resulting long-trip weaknesses (`6a5e5de`).
- 2026-07-13: Fixed the Wanderlog stress weaknesses across planner navigation, filtering, signals, trip semantics, health actions, open-day compression, and the overview stop timeline (`5cda5b6`).
- 2026-07-13: Added a development/demo/loopback-gated local test identity and visible auth error feedback (`5491330`).
- 2026-07-13: Created a fresh Budapest trip through the browser and confirmed the authenticated planner, ideas, settings, and activity routes are still demo-backed.

## Quick Tasks Completed

| Date | Task |
| --- | --- |
| 2026-07-13 | Captured product and design context for implementation. |
| 2026-07-13 | Verified the planner at 1024×768, 1440×900, and 1728×1117. |
| 2026-07-13 | Applied the 48-command initial migration to local D1 state. |
| 2026-07-13 | Configured project-local Pre-CR checks. |
| 2026-07-13 | Verified the light workspace and both journey map modes at all three target desktop sizes. |
| 2026-07-13 | Verified the Wanderlog fixture reaches Day 18 at 1024, 1440, and 1728 widths. |
| 2026-07-13 | Verified the resolved Wanderlog stress flow, 31 unit tests, both production builds, and Worker dry run. |
| 2026-07-13 | Hands-on entry created the real trip shell and exposed D1 product-flow blockers hidden by fixtures. |
