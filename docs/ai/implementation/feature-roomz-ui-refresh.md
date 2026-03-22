---
phase: implementation
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Implementation Guide
description: Implementation rules and technical boundaries for the RoomZ Stitch-first desktop port
---

# RoomZ UI Refresh - Implementation

## Development Setup

- Validate docs with `npx ai-devkit@latest lint`
- Read `docs/ai/monitoring/project-status.md` before making repo changes
- Create or update task logs after each code task

## Core Rules

- Use Stitch as the direct visual source of truth for the six in-scope desktop routes
- Port production UI manually into React; do not ship generated HTML
- Keep RoomZ auth, routing, data flow, modal flow, and Supabase behavior intact
- Do not introduce mobile-only decisions, motion polish, or 3D into this phase

## Route Strategy

- Canonical route: `/services`
- Legacy compatibility:
  - `/support-services` -> `/services?tab=services`
  - `/local-passport` -> `/services?tab=deals`
  - `/partners` -> `/services?tab=deals`

## Completed Work

- Updated `AGENTS.md` to make `dev-lifecycle` the default for repo work
- Established living docs with `project-status.md` and task-based implementation logs
- Refreshed global tokens, typography, and UI primitives in the web package
- Added `stitchAssets.ts` and `StitchFooter.tsx` to support the Stitch-first desktop port
- Ported `/`, `/login`, `/services`, `/community`, `/roommates`, and `/room/:id` manually from Stitch screens
- Kept RoomZ auth, routing, modal flows, room data, and Supabase-backed behavior intact while remapping them into Stitch-first layouts
- Completed desktop parity screenshots with Playwright for the six in-scope routes
- Cleared the scripted accessibility and SEO regressions introduced during the port
- Added direct Stitch typography aliases and color token aliases so headline/body roles resolve correctly in production code
- Rebalanced landing, login, services, and room detail for the `1024-1440` desktop band after the first user review surfaced overflow and cramped composition
- Fixed the first post-port parity bug pass from user review:
  - landing search controls now use dropdown-based selections
  - landing community grid now follows the intended Stitch span pattern
  - room detail gallery and inline map now reflect the expected structure more closely
  - roommate results now use a real location dropdown and readable action/navigation styling
  - community featured posts now render imagery
  - public brand strings are normalized to `RommZ`
- Fixed the second post-port parity bug pass from user review:
  - landing search now uses the full province dataset and a wider first column so the desktop filter bar stays aligned
  - roommate filter labels compact long city names and keep the action CTA readable in the Stitch shell
  - community featured cards now support both single-image and multi-image media layouts
  - services deals now expand in-place into a full voucher catalog plus a nearby-partners section
  - login trims the floating copy panel, removes the public admin-login shortcut, and clarifies that the profile is created after first successful sign-in
- Fixed the third post-port parity bug pass from user review:
  - landing `Vi tri` now uses a searchable combobox with compact trigger labels for better hero-filter ergonomics
  - landing budget trigger labels are shortened so the Stitch rail stays readable at desktop widths
  - services deal tags now use higher-contrast Stitch-style media capsules
  - community post detail now provides a lightbox viewer for attached images
- Ported `/search` manually from the refined Stitch screen:
  - replaced the old search intro shell with a Stitch-first console and results overview
  - introduced a selected-listing hero card linked directly to the map selection state
  - upgraded `MapboxRoomMap` to support controlled selection, price-pill markers, and popup suppression inside split layouts
  - preserved live RoomZ query, favorite, pagination, and room-detail navigation behavior underneath the new layout
- Ported `/profile` manually from the generated Stitch profile screen:
  - replaced the old tab-first profile shell with a Stitch-first two-column dashboard
  - mapped the live RoomZ auth profile, favorites, bookings, premium entitlements, and roommate matches into the new Atlas layout
  - preserved detailed account management flows by keeping full favorites, booking management, and settings reachable through dialogs inside the new route
- Polished the Stitch-first `/profile` pass after live review:
  - upgraded the premium promo card to clearer `RommZ+` branding with stronger contrast
  - reduced over-wide tracking on profile micro-labels and metric captions
  - connected `Vung tim kiem uu tien` to the search journey by persisting the last preferred search area from `/search` and reusing it inside `/profile`
- Stabilized the protected `/profile` route after the next live review:
  - repaired the visible text-encoding regression that was causing mojibake across the Stitch-first profile dashboard
  - disabled Radix dropdown scroll locking in the shared dropdown wrapper so the avatar menu no longer shifts the fixed navbar horizontally
  - upgraded the preferred-area card to use a live Mapbox mini-map whenever the saved search context has or can recover usable coordinates
- Ported `/swap` manually from the generated Stitch short-stay screen:
  - replaced the old short-stay hub shell with a Stitch-first search console and editorial card composition
  - kept `create-sublet`, `my-sublets`, `swap-matches`, `apply`, and `swap request` reachable through the new layout
  - added `stitchAssets.swap` to hold fallback imagery for the new route
- Fixed the first `/search` interaction bug pass after live user review:
  - added top spacing so the refined search console clears the fixed desktop navbar
  - changed secondary listing cards to navigate directly to room detail on the first click instead of requiring a promote-then-click flow
  - made `Xem tren ban do` re-focus the selected listing state and smooth-scroll back to the selected hero card from lower positions in the results list
  - wired the split-map marker selection to the same selected-listing focus behavior while keeping the full-map mode unchanged
- Fixed the first `/search` map viewport bug pass after the next live review:
  - added a controlled `selected-room` viewport mode to `MapboxRoomMap`
  - the split search mini-map now zooms into the currently selected room instead of fitting every marker across the country
  - the full search map now also defaults to the selected room's local context instead of opening on an all-Vietnam extent when no location filter is active
- Restored smooth search-map camera animation after the viewport pass:
  - stopped recreating the Mapbox instance on every selected-room change
  - moved the latest `onSelectRoom` callback through a ref so marker clicks keep working without forcing a full map re-init
  - kept camera motion in the dedicated `easeTo` effect, which restores the smooth zoom/pan feel when users switch focus between rooms
- Extended the search-map animation fix to location switches with results:
  - stopped recreating the Mapbox instance when quick area chips or other non-empty location changes replace the result set
  - split marker updates and radius overlay updates out of the map initialization effect so the canvas stays mounted while the data changes
  - preserved the single-room map behavior by adding a dedicated camera update effect instead of relying on remounts
- Stabilized the `/search` catalog-selection flow:
  - paused free-text room search while internal location-catalog suggestions are active so typing a place name no longer wipes the current map/list before the user chooses a catalog card
  - added a location-focus transition state so selecting a catalog, Mapbox suggestion, or current location clears the old selected room first and lets the map camera prioritize the new location center
  - restored visible continuity between the current results, the chosen catalog location, and the new room dataset
- Standardized user-facing VND form inputs:
  - added a shared `CurrencyInput` for grouped display like `3.000.000`
  - applied it to post-room, post-sublet, edit-sublet, and the current quick-post dialogs
  - kept raw-digit form state underneath and switched submit parsing to a shared `parseCurrencyInput` helper
- Stabilized user-facing posting dropdowns against layout shift:
  - added a global stable-scrollbar guard so body scroll locking no longer changes centered form width
  - migrated the remaining user-facing posting selects to `FormSelectPopover` in `post-room`, `create-sublet`, and `PostListingModal`
  - recorded the rule that future inline user-facing dropdowns should avoid raw Radix `Select`

## Performance Rules

- Keep desktop parity work 2D-only in this phase
- Preserve route stability and existing code-splitting behavior
- Treat current Vite chunk warnings as known debt, not a blocker for this task

## Current Boundary

- The eight in-scope desktop routes now follow a Stitch-first Living Atlas shell
- Swap and landlord dashboard remain the generated desktop screens that still need direct-port implementation
- Atlas Plus, admin, motion, and 3D are outside the current port boundary
- The next implementation target is not more web redesign by guesswork; it is porting the remaining generated Stitch screens only after user review
- Before generating new Stitch screens, the current bugfix pass should be visually re-reviewed against the user-reported issues list
