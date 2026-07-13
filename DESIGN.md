# Nightthread Design System

## Direction

Nighttime trip planning at a large desk: the room is dim, destination photography supplies the light, and a crimson thread traces the route across a quiet atlas. The product register is restrained; imagery and the route motif provide the emotion.

## Color

All production colors use OKLCH.

```css
:root {
  --color-bg: oklch(0.08 0 0);
  --color-canvas: oklch(0.115 0.012 272);
  --color-surface: oklch(0.15 0.018 272);
  --color-surface-raised: oklch(0.205 0.022 272);
  --color-ink: oklch(0.96 0.006 272);
  --color-ink-muted: oklch(0.72 0.022 272);
  --color-border: oklch(0.31 0.025 272);
  --color-selection: oklch(0.56 0.16 269);
  --color-thread: oklch(0.56 0.20 10);
  --color-thread-bright: oklch(0.72 0.16 18);
  --color-focus: oklch(0.82 0.12 210);
  --color-success: oklch(0.72 0.14 150);
  --color-warning: oklch(0.78 0.14 78);
  --color-danger: oklch(0.64 0.20 25);
}
```

- Near-white text on saturated mid-tone fills.
- Thread colors are reserved for route, active collaboration, and rare emphasis.
- Indigo marks selection and current context; it is not decorative background color.
- Photography is never color-washed with gradients. Use a solid scrim only when text requires it.

## Typography

- Geist Sans for body, controls, labels, and data.
- Instrument Serif for destination titles and journey-story headings only.
- Fixed product scale: 12, 13, 14, 16, 20, 28, 40, and 64px.
- Display tracking never tighter than `-0.03em`; body copy stays within 70 characters.

## Layout

- 1440px planner: 300px ideas rail, flexible itinerary canvas, 360px context rail.
- 1024px planner: ideas and context become drawers; itinerary stays primary.
- 8px base spacing; section rhythm uses 16, 24, 32, 48, and 64px.
- Cards use 12px radii and either a border or a compact shadow, never both decoratively.
- Overlays follow dropdown, sticky, modal-backdrop, modal, toast, tooltip order.

## Components

- Buttons: primary, secondary, quiet, destructive, and icon variants share height, focus ring, loading, and disabled behavior.
- Ideas: editorial rows with optional thumbnail, priority, city, votes, and scheduled state; not a repeated icon-card grid.
- Itinerary items: confirmed activities are crisp surfaces; placeholders use softer fills and an unresolved-decision mark.
- Panels: native dialog/popover or portal-backed drawers to avoid clipping.
- Empty states teach the next action and always offer manual creation when a provider is unavailable.

## Motion

- 150–220ms ease-out transitions communicate state changes.
- Adapt Amicro color-morph for saved/voted state and morph for copy/save completion using `motion/react`.
- Drag overlays lift slightly without bounce; route drawing may reveal once when the journey changes.
- Reduced motion removes transform choreography and uses crossfades or instant updates.

## Imagery and Map

- Large destination photography supplies atmosphere and must retain source attribution.
- The overview map shows one pin per city and no attraction pins.
- Curved GeoJSON routes use a solid underlay plus a seamless crimson yarn raster pattern with round caps.
- Missing imagery becomes a purposeful color field with city typography, never a generic stock illustration.
