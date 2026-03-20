---
phase: testing
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Testing Strategy
description: Validation plan for RoomZ UI refresh, services hub, and future 3D accents
---

# RoomZ UI Refresh — Testing

## Coverage Goals

- Validate routing and redirects for `/services`
- Validate visual primitives after token changes
- Validate no regressions on landing, login, search, room detail, profile

## Manual Scenarios

- Open `/services` and switch tabs
- Visit `/support-services` and confirm redirect
- Visit `/local-passport` and confirm redirect
- Navigate from desktop and mobile nav to the new hub
- Verify buttons, tabs, inputs, and badges retain keyboard/focus usability

## Validation Commands

- `npx ai-devkit@latest lint`
- `npm run lint --workspace=@roomz/web`
- `npm run build --workspace=@roomz/web`
- `python .agents/skills/frontend-design/scripts/ux_audit.py packages/web`
- `python .agents/skills/frontend-design/scripts/accessibility_checker.py packages/web`
- `python .agents/skills/seo-fundamentals/scripts/seo_checker.py packages/web`

## Acceptance

- Canonical services hub works
- Token / primitive refresh does not break build
- Audit results are at least as good as the baseline, with obvious regressions removed
