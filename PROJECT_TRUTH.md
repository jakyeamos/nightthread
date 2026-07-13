# Nightthread Project Truth

## Current State

Nightthread's light workspace, journey maps, Cloudflare foundation, domain rules, long-trip fixture, and authenticated D1 planning flows are implemented on the feature branch. Real trips now create or recover stable days and nights, load one shared workspace contract, and persist route stops, manual ideas, votes, scheduling, placeholders, placeholder replacement, deletion undo, settings, invitations, and activity history. Route stops can be reordered and existing cities can reclaim a stable day tail after out-of-order entry.

## Current Position

- Phase: authenticated product verification and itinerary entry
- Branch: `codex/nightthread-v1`
- Foundation commit: `688418f`
- Implementation commit: `1d55d5e`
- Collaboration mutation commit: `b22e0bd`
- Light workspace and night globe commit: `f80cea3`
- Wanderlog stress fixture commit: `6a5e5de`
- Long-trip usability commit: `5cda5b6`
- Local test authentication commit: `5491330`
- Authenticated planning recovery commit: `6f4b4ce`
- Route correction controls commit: `3bf36f6`
- Build: passing Next.js and OpenNext production builds
- Tests: 37 unit/contract tests and 15 fixture-focused Chromium critical-flow checks passing
- Deployment: Wrangler dry run passes; live resources and credentials are not configured
- Remote: `https://github.com/jakyeamos/nightthread.git`

## Next Step

Complete the hands-on Budapest–Prague–Alps entry using the repaired route ordering/day-assignment controls and manual idea flow, then add an isolated fresh-D1 browser test that proves persistence across reloads.

## Blockers

- Production deployment requires Cloudflare, Google OAuth, Geoapify, Unsplash, Resend, and a verified sending-domain configuration.

## Risks

- External free-tier limits and provider availability may change.
- Full multi-client realtime, OAuth callback, magic-link delivery, and private-R2 integration require deployed Cloudflare resources for final validation.
- Wrangler warns that an internal Durable Object is unavailable inside Next's local dev proxy; the custom OpenNext Worker bundle exports it and passes the Wrangler deployment dry run.
- The existing Playwright suite remains fixture-focused; authenticated route GETs and the real 18-day recovery action are verified, but a clean-database create-to-reload browser flow is still required.

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
- 2026-07-13: Replaced authenticated demo fallbacks with a shared D1 workspace, persistent planning/settings/activity flows, accurate membership, and local-safe map caching (`6f4b4ce`).
- 2026-07-13: Recovered the browser-created Budapest trip to 18 stable days and 17 stay nights through the authenticated server action.
- 2026-07-13: Added route reordering and explicit existing-city day-tail assignment after the live Wanderlog entry exposed out-of-order repair gaps (`3bf36f6`).

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
| 2026-07-13 | Verified all four authenticated product routes return the real Budapest trip with no Tokyo fallback. |
| 2026-07-13 | Passed 37 tests, lint, typecheck, Next/OpenNext builds, and the Wrangler deployment dry run. |
| 2026-07-13 | Browser-tested route entry and added correction controls for late or missed city stops. |
