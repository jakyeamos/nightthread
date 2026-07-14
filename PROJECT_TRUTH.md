# Nightthread Project Truth

## Current State

Nightthread's light workspace, journey maps, Cloudflare foundation, domain rules, long-trip fixture, authenticated D1 planning flows, desktop device authorization, and hardened Electron delivery shell are implemented on the feature branch. The Electron client runs remote Nightthread content with sandboxing, context isolation, disabled Node integration, exact-origin navigation and credential injection, encrypted session storage, closed typed IPC, deny-by-default permissions, deep links, window restoration, native navigation/sign-out/update commands, and local starting/sign-in/offline/update/fatal surfaces. Better Auth accepts only the macOS and Windows desktop clients for ten-minute device codes, exposes browser approval after normal sign-in, and authenticates exchanged sessions through bearer headers backed by D1. Real trips and both map modes remain Cloudflare-authoritative and continue to use the shared web product.

## Current Position

- Phase: Electron private-beta delivery shell
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
- Planner navigation-race fix commit: `178e253`
- Planner navigation-ownership fix commit: `ac06e7d`
- Exact itinerary durations commit: `af8def8`
- Direct activity entry commit: `863fa75`
- Editable day titles commit: `796a133`
- Editable city map details commit: `91533bd`
- Embedded journey-map rendering commit: `0a652b8`
- Unified planner creation commit: `4f5f8c8`
- Chronological itinerary ordering commit: `025eb90`
- Desktop device authorization commit: `08e5bf0`
- Secure Electron shell commit: `b929af3`
- Desktop packaging and release commit: `45685ac`
- Build: passing Next.js and OpenNext production builds
- Desktop packaging: unsigned universal macOS DMG/ZIP smoke passes; signed release workflow targets universal macOS and Windows x64
- Tests: 39 unit/contract tests and 15 fixture-focused Chromium critical-flow checks passing
- Deployment: Wrangler dry run passes; live resources and credentials are not configured
- Remote: `https://github.com/jakyeamos/nightthread.git`

## Next Step

Finish desktop delivery documentation, then run the complete web, Worker, Electron, and packaging verification ladder.

## Blockers

- Production deployment requires Cloudflare, Google OAuth, Geoapify, Unsplash, Resend, and a verified sending-domain configuration.
- Signed beta artifacts additionally require a stable HTTPS Worker origin, Apple Developer ID and notarization credentials, and a Windows Authenticode certificate.

## Risks

- External free-tier limits and provider availability may change.
- Full multi-client realtime, OAuth callback, magic-link delivery, and private-R2 integration require deployed Cloudflare resources for final validation.
- Wrangler warns that an internal Durable Object is unavailable inside Next's local dev proxy; the custom OpenNext Worker bundle exports it and passes the Wrangler deployment dry run.
- The existing Playwright suite remains fixture-focused; authenticated route GETs and the real 18-day recovery action are verified, but a clean-database create-to-reload browser flow is still required.

## Recent Progress

- 2026-07-13: Added the 18-day, eight-city Wanderlog stress fixture and prioritized the resulting long-trip weaknesses (`6a5e5de`).
- 2026-07-13: Fixed the Wanderlog stress weaknesses across planner navigation, filtering, signals, trip semantics, health actions, open-day compression, and the overview stop timeline (`5cda5b6`).
- 2026-07-13: Added a development/demo/loopback-gated local test identity and visible auth error feedback (`5491330`).
- 2026-07-13: Created a fresh Budapest trip through the browser and confirmed the authenticated planner, ideas, settings, and activity routes are still demo-backed.
- 2026-07-13: Replaced authenticated demo fallbacks with a shared D1 workspace, persistent planning/settings/activity flows, accurate membership, and local-safe map caching (`6f4b4ce`).
- 2026-07-13: Recovered the browser-created Budapest trip to 18 stable days and 17 stay nights through the authenticated server action.
- 2026-07-13: Added route reordering and explicit existing-city day-tail assignment after the live Wanderlog entry exposed out-of-order repair gaps (`3bf36f6`).
- 2026-07-13: Made explicit city/day jumps authoritative until the next user scroll, replacing the insufficient timer guard (`178e253`, `ac06e7d`).
- 2026-07-13: Allowed exact-minute itinerary durations after native step validation rejected Wanderlog's 453-minute Prague transfer (`af8def8`).
- 2026-07-13: Added direct manual activity entry with canonical ideas, flexible or exact timing, duration, notes, priority, and activity history (`863fa75`).
- 2026-07-13: Made the existing day-options control edit and persist itinerary day titles (`796a133`).
- 2026-07-13: Added editable existing-city country, timezone, and coordinates after Budapest was omitted from the live map (`91533bd`).
- 2026-07-13: Fixed embedded WebGL compositing with synchronized retained MapLibre frames, accurate sizing, route anchors, and collision-aware pins (`0a652b8`).
- 2026-07-13: Unified planner creation and added distinct daytime-travel, overnight-travel, and stay persistence flows (`4f5f8c8`).
- 2026-07-13: Sorted each day by exact time or period after live entry exposed insertion-order chronology (`025eb90`).
- 2026-07-13: Added Better Auth device authorization, bearer sessions, approved desktop client IDs, a D1 migration, and the browser approval surface (`08e5bf0`).
- 2026-07-13: Added the sandboxed Electron shell, encrypted token store, exact-origin policy, typed bridge, deep links, native commands, updater runtime, and local recovery surfaces (`b929af3`).
- 2026-07-13: Added macOS universal and Windows x64 packaging, product artwork, beta updater metadata, native signing/notarization inputs, and the tag-driven GitHub prerelease workflow (`45685ac`).

## Quick Tasks Completed

| Date | Task |
| --- | --- |
| 2026-07-13 | Browser-tested route entry and added correction controls for late or missed city stops. |
| 2026-07-13 | Browser-tested and fixed the Kandersteg-to-Rome navigation race with interaction-owned selection. |
| 2026-07-13 | Entered and reload-verified the exact 453-minute Budapest-to-Prague transfer. |
| 2026-07-13 | Entered KIOSK Budapest directly on Day 1 and reload-verified its canonical saved idea. |
| 2026-07-13 | Entered all 18 Wanderlog day titles through the planner and reload-verified Days 1 and 18. |
| 2026-07-13 | Repaired Budapest map data through settings and verified all eight overview pins. |
| 2026-07-13 | Browser-dragged both real map modes and verified synchronized frames, yarn anchors, and eight legible pins. |
| 2026-07-13 | Saved Day 1's Budapest stay through the unified control and verified history plus unchanged journey totals. |
| 2026-07-13 | Verified Day 1 renders Afternoon before Evening and preserves the three Evening stops' order. |
| 2026-07-13 | Passed 39 unit/contract tests, lint, and strict typecheck with the desktop authorization boundary. |
| 2026-07-13 | Launched Electron on macOS, exercised Offline/Retry and Chrome handoff, and passed 13 desktop unit tests plus the Electron Playwright smoke. |
| 2026-07-13 | Produced local universal macOS DMG/ZIP updater artifacts and passed all 15 self-starting web Playwright checks. |
