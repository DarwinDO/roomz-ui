---
phase: design
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Stitch-First Design
description: Design decisions for the Stitch-first Living Atlas desktop port and its system boundaries
---

# RoomZ UI Refresh - Design

## Architecture Overview

```mermaid
graph TD
  StitchScreens[Stitch Screens + Theme Tokens] --> Tokens[Design Tokens]
  Tokens --> Primitives[UI Primitives]
  Primitives --> DesktopRoutes[/ /login /services /community /roommates /room/:id]
  Docs[docs/ai/*] --> Governance[Task Logs + Project Status]
```

## Design Decisions

- **Emotion target:** trust first, youthful second
- **Visual language:** Stitch-first Living Atlas, not a reinterpretation of the prior RoomZ shell
- **Typography:** `Plus Jakarta Sans` for display and CTA, `Manrope` for body, form, and metadata
- **Typography enforcement:** global aliases must preserve Stitch roles via `.font-headline`, `.font-display`, `.font-body`, and `.font-label`
- **Palette:** lavender-tinted off-white surfaces, deep blue primary, amber secondary, emerald tertiary
- **Stitch role:** direct visual source of truth for the six in-scope desktop routes; production UI is still ported manually into the repo
- **Desktop scope:** `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`
- **Out of scope in this phase:** search, swap, profile, landlord dashboard, Atlas Plus, admin, mobile, motion, and 3D
- **IA change retained:** `Dich vu + Uu dai` remains one canonical `/services` hub

## Component Boundaries

- Tokens live in `packages/web/src/index.css`
- Primitives start in `button`, `card`, `badge`, `input`, `tabs`
- Shared Stitch assets live in `packages/web/src/lib/stitchAssets.ts`
- Shared Stitch-first footer lives in `packages/web/src/components/common/StitchFooter.tsx`
- Canonical services hub lives at `/services`
- Legacy routes redirect to the tabbed hub
- Stitch color aliases such as `on-surface` and `on-primary-container` must resolve in the token layer so direct Stitch class names remain valid in repo code

## Non-Functional Requirements

- Must match Stitch section order, hierarchy, spacing cadence, and CTA emphasis on the six desktop routes in scope
- Must preserve RoomZ auth, routing, modal flows, and live data behavior
- Must preserve accessibility on tab navigation, buttons, inputs, and focus states
- Must keep app surfaces to a maximum of two font families
- Must remain stable at `1024`, `1280`, and `1440` desktop widths on the highest-traffic stitched routes
- Must not ship raw Stitch HTML or generated runtime code into production
- Mobile is not an acceptance target for this phase
