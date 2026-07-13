# Nightthread Project Truth

## Current State

Nightthread's light workspace, journey maps, Cloudflare foundation, domain rules, long-trip fixture, and authenticated D1 planning flows are implemented on the feature branch. Real trips now create or recover stable days and nights, load one shared workspace contract, and persist route stops, editable city map details and day titles, manual ideas, direct itinerary activities, votes, scheduling, exact-minute placeholders, placeholder replacement, deletion undo, settings, invitations, and activity history. Route stops can be reordered and existing cities can reclaim a stable day tail after out-of-order entry.

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
- Planner navigation-race fix commit: `178e253`
- Planner navigation-ownership fix commit: `ac06e7d`
- Exact itinerary durations commit: `af8def8`
- Direct activity entry commit: `863fa75`
- Editable day titles commit: `796a133`
- Editable city map details commit: `91533bd`
- Build: passing Next.js and OpenNext production builds
- Tests: 37 unit/contract tests and 15 fixture-focused Chromium critical-flow checks passing
- Deployment: Wrangler dry run passes; live resources and credentials are not configured
- Remote: `https://github.com/jakyeamos/nightthread.git`

## Next Step

Finish the embedded-browser map compositor repair, then add an isolated fresh-D1 browser test that proves the completed itinerary persists across reloads.

## Blockers

- Production deployment requires Cloudflare, Google OAuth, Geoapify, Unsplash, Resend, and a verified sending-domain configuration.

## Risks

- External free-tier limits and provider availability may change.
- Full multi-client realtime, OAuth callback, magic-link delivery, and private-R2 integration require deployed Cloudflare resources for final validation.
- Wrangler warns that an internal Durable Object is unavailable inside Next's local dev proxy; the custom OpenNext Worker bundle exports it and passes the Wrangler deployment dry run.
- The existing Playwright suite remains fixture-focused; authenticated route GETs and the real 18-day recovery action are verified, but a clean-database create-to-reload browser flow is still required.

## Recent Progress

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
- 2026-07-13: Made explicit city/day jumps authoritative until the next user scroll, replacing the insufficient timer guard (`178e253`, `ac06e7d`).
- 2026-07-13: Allowed exact-minute itinerary durations after native step validation rejected Wanderlog's 453-minute Prague transfer (`af8def8`).
- 2026-07-13: Added direct manual activity entry with canonical ideas, flexible or exact timing, duration, notes, priority, and activity history (`863fa75`).
- 2026-07-13: Made the existing day-options control edit and persist itinerary day titles (`796a133`).
- 2026-07-13: Added editable existing-city country, timezone, and coordinates after Budapest was omitted from the live map (`91533bd`).

## Quick Tasks Completed

| Date | Task |
| --- | --- |
| 2026-07-13 | Verified the light workspace and both journey map modes at all three target desktop sizes. |
| 2026-07-13 | Verified the Wanderlog fixture reaches Day 18 at 1024, 1440, and 1728 widths. |
| 2026-07-13 | Verified the resolved Wanderlog stress flow, 31 unit tests, both production builds, and Worker dry run. |
| 2026-07-13 | Hands-on entry created the real trip shell and exposed D1 product-flow blockers hidden by fixtures. |
| 2026-07-13 | Verified all four authenticated product routes return the real Budapest trip with no Tokyo fallback. |
| 2026-07-13 | Passed 37 tests, lint, typecheck, Next/OpenNext builds, and the Wrangler deployment dry run. |
| 2026-07-13 | Browser-tested route entry and added correction controls for late or missed city stops. |
| 2026-07-13 | Browser-tested and fixed the Kandersteg-to-Rome navigation race with interaction-owned selection. |
| 2026-07-13 | Entered and reload-verified the exact 453-minute Budapest-to-Prague transfer. |
| 2026-07-13 | Entered KIOSK Budapest directly on Day 1 and reload-verified its canonical saved idea. |
| 2026-07-13 | Entered all 18 Wanderlog day titles through the planner and reload-verified Days 1 and 18. |
| 2026-07-13 | Repaired Budapest map data through settings and verified all eight overview pins. |
