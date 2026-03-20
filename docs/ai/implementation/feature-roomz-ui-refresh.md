---
phase: implementation
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Implementation Guide
description: Implementation rules and technical boundaries for RoomZ design system and services hub work
---

# RoomZ UI Refresh — Implementation

## Development Setup

- Validate docs with `npx ai-devkit@latest lint`
- Read `docs/ai/monitoring/project-status.md` before making repo changes
- Create or update task logs after each code task

## Core Rules

- Refactor tokens before page-level redesign
- Avoid purple / generic AI design accents
- Keep motion light and meaningful
- Keep 3D isolated to accent surfaces
- Do not introduce raw `three.js` imperative scenes unless R3F is insufficient

## Route Strategy

- Canonical route: `/services`
- Legacy compatibility:
  - `/support-services` -> `/services?tab=services`
  - `/local-passport` -> `/services?tab=deals`
  - `/partners` -> `/services?tab=deals`

## Performance Rules

- Lazy-load 3D scenes
- Provide static poster fallback
- Respect `prefers-reduced-motion`
- Do not mount 3D on search/detail/profile/community in phase 1
