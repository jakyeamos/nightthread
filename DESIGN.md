# Nightthread Design System

## Direction

Nightthread is a bright, photography-led planning desk. The workspace uses sky-washed canvas, crisp white surfaces, blue-charcoal ink, restrained indigo controls, and a coral route thread. “Night” describes the optional journey visualization, not the application theme.

Destination photography supplies warmth and atmosphere. Dark UI is confined to the Globe at night stage; planning, navigation, forms, drawers, toasts, errors, and empty states stay light.

## Color

All production colors use semantic OKLCH roles.

```css
:root {
  --canvas: oklch(0.97 0.015 235);
  --surface: oklch(0.995 0.004 235);
  --surface-soft: oklch(0.945 0.022 235);
  --surface-raised: oklch(1 0 0);
  --line: oklch(0.855 0.028 235);
  --ink: oklch(0.22 0.032 250);
  --muted: oklch(0.455 0.035 248);
  --indigo: oklch(0.48 0.17 276);
  --thread: oklch(0.62 0.19 18);
  --thread-soft: oklch(0.94 0.035 18);
  --globe-space: oklch(0.065 0.018 260);
}
```

- Indigo identifies selection, primary actions, and focus.
- Coral is reserved for the route, votes, priorities, and rare emphasis. Darker coral is used for small text on light surfaces.
- Pale blue distinguishes secondary rails and unresolved placeholders.
- Warning, positive, and destructive states use dedicated semantic foreground and soft-fill pairs.
- Cream, beige, decorative gradients, glass effects, and dark card stacks are excluded.

## Typography

- Geist Sans for body, controls, labels, and data.
- Instrument Serif only for destination titles and journey-story headings.
- Fixed product scale: 12, 13, 14, 16, 20, 28, 40, and 64px.
- Display tracking never tighter than `-0.03em`; body copy stays within 70 characters.

## Layout

- 1440px planner: 300px ideas rail, flexible itinerary canvas, 360px context rail.
- 1024px planner: ideas and context become drawers; itinerary stays primary.
- Long itineraries keep a sticky active-day context with city-local timezone, previous/next city controls, a direct day jump, collapsible city sections, and compact summaries for consecutive open days.
- Saved ideas default to the active city and offer an explicit all-cities state. Planning signals follow the active day; trip-wide lodging and transport gaps remain a separate summary.
- 8px base spacing; section rhythm uses 16, 24, 32, 48, and 64px.
- Cards use 8–16px radii and either a border or compact functional shadow.
- The night globe is a large 65–75vh in-page stage inside the otherwise light overview shell.
- Journey Overview uses a compact, ordered stop timeline with native scrolling and visible previous/next controls. Zero-night stops are named transfer stops, while lodging status and unresolved transport remain explicit route facts.

## Desktop Shell

The Electron window is a frame around the shared light workspace, not a separate native visual system. The remote product owns trip navigation and content; native menus provide Back, Forward, Reload, Check for Updates, and Sign Out without duplicating those controls inside planning pages.

Local desktop states use the same sky canvas, white surface, indigo action, coral thread, and restrained photography logic as the public welcome surface. Starting, sign-in, offline, update, and fatal states remain useful without accepting offline edits. The shell never introduces dark chrome around the light planner; darkness remains confined to the night-globe stage.

Window behavior is desktop-first: 1440×900 by default, 1024×768 minimum, restored bounds, and one running instance. External destinations open in the system browser. `nightthread://` links navigate to validated trips or invitations only after authentication.

## Components

- Buttons: primary, secondary, quiet, destructive, and icon variants share height, focus ring, loading, and disabled behavior.
- Ideas: editorial rows with photography, priority, city, votes, and scheduled state.
- Itinerary items: confirmed activities are crisp white surfaces; placeholders use pale blue fills and an unresolved-decision mark.
- Panels: solid light surfaces. Drawers, toasts, invitation states, errors, and empty states never switch to dark chrome.
- Empty states teach the next action and retain manual creation when a provider is unavailable.

## Motion

- 150–220ms ease-out transitions communicate state changes.
- The Journey / Globe at night control adapts Amicro’s state-driven color morph pattern through `motion/react`.
- Mode changes crossfade and move the camera over 200ms. Recenter uses the full journey bounds.
- Reduced motion swaps modes and camera position instantly.

## Imagery and Map

- The public welcome surface pairs a dusk destination photograph with a sky-white sign-in panel; form controls remain light and high contrast.
- Destination photography retains visible source attribution and is not used as application chrome.
- Journey mode defaults to a light Geoapify `osm-bright-smooth` raster map served through a membership-checked Worker proxy.
- Globe at night uses MapLibre globe projection with NASA Black Marble imagery, numbered luminous city pins, and no attraction or navigation overlays.
- Both modes show one pin per geocoded city. Curved GeoJSON routes use a solid underlay plus a seamless coral yarn pattern with round caps.
- If nighttime imagery fails, the interface returns to Journey mode with an inline explanation. If WebGL is unavailable, a light explanatory state replaces the canvas.
