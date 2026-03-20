---
phase: design
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Design System & IA
description: Design decisions for RoomZ trust-first system, services hub, motion, and 3D boundaries
---

# RoomZ UI Refresh — Design

## Architecture Overview

```mermaid
graph TD
  Tokens[Design Tokens] --> Primitives[UI Primitives]
  Primitives --> PublicPages[Landing / Login / Search / Detail / Profile]
  Primitives --> ServicesHub[/services Hub]
  Motion[Framer Motion Presets] --> PublicPages
  ThreeRuntime[Three + R3F + Drei] --> AccentSurfaces[Landing / Login / Empty States]
  Docs[docs/ai/*] --> Governance[Task Logs + Project Status]
```

## Design Decisions

- **Emotion target:** trust first, youthful second
- **Layout stance:** clean and breathable, but not generic SaaS
- **Typography:** one UI sans family + one display/editorial accent family
- **3D stance:** accent only, never core navigation or core decision workflow
- **IA change:** `Dịch vụ + Ưu đãi` becomes one hub with tabs

## Component Boundaries

- Tokens live in `packages/web/src/index.css`
- Primitives start in `button`, `card`, `badge`, `input`, `tabs`
- Canonical services hub lives at `/services`
- Legacy routes redirect to the tabbed hub

## Non-Functional Requirements

- Must remain responsive on desktop and mobile web
- Must not degrade LCP or interaction speed with 3D
- Must preserve accessibility on tab navigation, buttons, inputs, and focus states
