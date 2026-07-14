# Product

## Register

product

## Users

Small groups of friends planning private, multi-city trips together on desktop. They begin with possibilities, negotiate priorities, and gradually turn loose ideas into a shared itinerary without needing every detail decided up front.

## Product Purpose

Nightthread is a collaborative planning workspace for collecting places, voting on ideas, arranging days, preserving placeholders, and understanding a trip's route at a glance. Release 1 succeeds when a group can plan a complete trip without returning to a cluttered general-purpose itinerary tool. “Night” belongs to the optional illuminated globe that reveals the journey after dark; it does not make the planning workspace a dark-mode product.

## Delivery Surfaces

Nightthread has one cloud product with two delivery surfaces: the responsive authenticated web app and a focused Electron client. Cloudflare remains authoritative for identity, trip data, private assets, collaboration, and history. The desktop client adds native windowing, menus, deep links, secure session storage, and beta updates; it does not add offline planning or a second product database.

Desktop authentication deliberately leaves credentials out of custom-protocol URLs. The installed app starts a short-lived device request, the person authenticates and explicitly approves it in their system browser, and the exchanged session remains encrypted in operating-system storage. Downloading a public beta installer never grants access to a trip.

## Brand Personality

Cinematic, composed, and exploratory. Nightthread should feel like planning beside a bright atlas filled with destination photography, then dimming the room for one intentional view of the route illuminated at night. It is calm enough for careful decisions, vivid enough to make the trip feel real, and never precious at the expense of usability.

## Anti-references

- Wanderlog's dense controls, attraction-pin clutter, and pressure to resolve details too early.
- Generic dark SaaS dashboards with neon gradients, glass panels, or decorative metrics.
- Nostalgic scrapbook interfaces that trade clarity for stamps, paper textures, or faux handwriting.
- Booking and navigation products that turn planning into a transactional funnel.

## Design Principles

1. Ideas before calendars: discovery and voting remain useful before dates are known.
2. Uncertainty is real data: placeholders and unresolved decisions receive first-class treatment.
3. Show the journey, not the database: photography, route, and daily rhythm lead the experience.
4. Collaboration stays legible: presence, locks, votes, and history explain what changed without notifications.
5. Manual paths always work: external services enrich planning but never gate it.
6. Night is a destination: the immersive globe is deliberate and bounded; the planning workspace remains inviting and light.
7. One product across surfaces: native delivery may improve access and focus, but planning behavior and cloud authority do not diverge from the web product.

## Accessibility & Inclusion

Best-effort accessible product UI with semantic structure, keyboard operation, visible focus, readable contrast, reduced-motion behavior, screen-reader labels, and non-drag alternatives for itinerary moves. Formal WCAG certification is not a Release 1 gate.
