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

## Performance Rules

- Keep desktop parity work 2D-only in this phase
- Preserve route stability and existing code-splitting behavior
- Treat current Vite chunk warnings as known debt, not a blocker for this task

## Current Boundary

- The six in-scope desktop routes now follow a Stitch-first Living Atlas shell
- Search, swap, profile, landlord dashboard, Atlas Plus, admin, motion, and 3D are outside the current port boundary
- The next implementation target is not more web redesign by guesswork; it is generating the next missing Stitch screens before coding them
- Before generating new Stitch screens, the current bugfix pass should be visually re-reviewed against the user-reported issues list
