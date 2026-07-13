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

## Weaknesses exposed

| Priority | Weakness | Evidence | Iteration |
| --- | --- | --- | --- |
| P0 | Planner context does not follow the active day | The sticky header still says Budapest while Day 18 in Rome is visible. The timezone copy becomes a generic disclaimer. | Track the centered day, update city/timezone context, and add a city/day jump control. |
| P0 | Saved-idea city filters are presentational | “Budapest · 2” remains selected while Kandersteg and Rome ideas are visible. | Implement real city filtering, counts, and an explicit all-cities state. |
| P1 | Long trips become one undifferentiated scroll | Five late Rome days require scrolling past every preceding city and transfer. | Add city sections with collapse, a day index, and previous/next city navigation. Consider virtualization after the interaction model is stable. |
| P1 | Planning signals are detached from viewport context | The right rail continues to discuss Day 2 while the planner is positioned at Day 18. | Make signals follow the active day, with a separate trip-wide issues summary. |
| P1 | The overview stop rail does not scale | At eight stops the horizontal row ends on a clipped half-card with no strong overflow affordance. | Replace large cards with a compact ordered stop timeline and explicit scroll controls. |
| P1 | Transfer and stay semantics are too quiet | Seven-hour transfers look like ordinary placeholders; Bern renders as “0 nights”; lodging gaps are absent. | Surface travel nights, transfer stops, accommodation status, and unresolved transport choices in both planner and overview. |
| P2 | Flexible duration is still over-specified | Untimed source places can be marked Flexible, but the fixture still needs estimated durations for every item. | Allow unknown duration and distinguish estimate, confirmed duration, and travel-provider duration. |
| P2 | Provider health is not actionable | A permanently closed food stop survives as subtitle text rather than a warning with replacement action. | Add source-health metadata, last-checked time, and replace/dismiss actions. |
| P2 | Consecutive empty days are visually repetitive | Four Rome open days repeat the same large empty card and CTA. | Compress empty runs, offer destination-level templates, and expand a day on demand. |

## Recommended next slice

Build scroll-aware planner context first: active day/city detection, real city filters, and a compact day/city navigator. That single slice resolves the two P0 failures and gives contextual planning signals a reliable anchor.
