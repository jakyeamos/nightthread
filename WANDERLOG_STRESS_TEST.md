# Wanderlog Trip Stress Test

## Fixture

Source: [Trip to Budapest, Prague, and more](https://wanderlog.com/plan/kbtkhysjlxosqhzv/trip-to-budapest-prague-and-more/shared)

The public trip was transcribed into a local, non-persisted fixture at `/trips/demo-wanderlog`. Participant identity, account data, reservations, and private attachments were not copied. The fixture preserves the product-relevant shape:

- 18 stable day ordinals from June 10–27, 2027.
- Eight ordered city or transfer stops across five countries.
- 17 stay nights, including a zero-night Bern transfer stop.
- 36 scheduled activities and placeholders.
- Untimed ordered places, long travel blocks, recovery time, weather buffers, blank days, and one permanently closed venue.
- Four unscheduled ideas from different cities.

## What held up

- The light workspace remains readable with the denser trip.
- All 18 days render and Day 18 remains reachable at 1024, 1440, and 1728 widths.
- The journey map and night globe accept eight city-only pins and the full route.
- The page does not introduce body-level horizontal scrolling.
- Flexible items no longer require a fabricated exact time.
- Fixture imagery and content link back to the source trip instead of receiving false Unsplash attribution.

## Weaknesses resolved

| Priority | Weakness | Resolution |
| --- | --- | --- |
| P0 | Planner context did not follow the active day | The scroll container now tracks the active day. Header city, IANA timezone, direct-day selector, previous/next city controls, and assistant context update together. |
| P0 | Saved-idea city filters were presentational | The default filter now follows the active city, filters the rendered cards, and exposes current counts beside an explicit all-cities state. |
| P1 | Long trips became one undifferentiated scroll | Days are grouped into collapsible city sections, city/day jumps bypass the long scroll, and repeated open days collapse into a single expandable planning surface. |
| P1 | Planning signals were detached from viewport context | Day load, unknown durations, reservations, open decisions, place health, and add suggestions now derive from the active day. Transport and lodging gaps remain trip-wide. |
| P1 | The overview stop rail did not scale | Compact snap-aligned stop cards retain native scrolling and add visible, disabled-aware previous/next controls. |
| P1 | Transfer and stay semantics were too quiet | Travel blocks now have transport styling and provenance; zero-night Bern is a transfer stop; stay nights, travel nights, lodging status, and unresolved transport are explicit. |
| P2 | Flexible duration was over-specified | Duration is optional. The UI distinguishes open, estimated, confirmed, and provider-sourced values without fabricating defaults. |
| P2 | Provider health was not actionable | Structured closed-place metadata now produces a checked-date warning with replacement and dismissal actions. |
| P2 | Consecutive empty days were visually repetitive | The four open Rome days render as one summary and expand only when someone chooses to plan them. Departure remains distinct. |

## Verification

Pure planner-view tests protect grouping, open-day compression, day-local signals, duration provenance, and city filtering. Playwright exercises the long trip at 1024×768, 1440×900, and 1728×1117; it also verifies the Rome context, actual idea filtering, provider-health action, transfer semantics, stop timeline controls, transfer-stop language, map modes, and body overflow.
