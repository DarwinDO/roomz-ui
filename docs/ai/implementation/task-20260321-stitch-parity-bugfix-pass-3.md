---
phase: implementation
title: Stitch Parity Bugfix Pass 3
date: 2026-03-21
feature: roomz-ui-refresh
---

# Task Summary

Fix the remaining user-reported Stitch parity issues around:

- landing hero filter density and long location labels
- low-contrast offer tags on services cards
- missing image enlargement flow inside the community post detail modal

# Files Updated

- `packages/web/src/pages/LandingPage.tsx`
- `packages/web/src/pages/ServicesHubPage.tsx`
- `packages/web/src/components/modals/PostDetailModal.tsx`
- `docs/ai/monitoring/project-status.md`
- `docs/ai/implementation/feature-roomz-ui-refresh.md`
- `docs/ai/testing/feature-roomz-ui-refresh.md`

# Implementation Notes

## Landing

- Replaced the compact `Vi tri` select with a searchable popover-combobox that can handle the full 63-province dataset without making the rail unreadable.
- The trigger now shows compact display labels such as `TP.HCM` while the dropdown still exposes the full canonical province names.
- Shortened budget labels in the trigger so the desktop Stitch rail no longer wastes width on verbose values.

## Services

- Reworked the deal category tag treatment to be more Stitch-like over photography:
  - stronger contrast
  - translucent white capsule
  - tighter uppercase tracking
  - clearer category labels

## Community

- Added a lightbox viewer inside `PostDetailModal`.
- Clicking a post image now opens a larger overlay with:
  - close action
  - next / previous navigation
  - thumbnail strip for quick switching when a post has multiple images

# Verification

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`: pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass
- Playwright preview check:
  - `/`: landing filter now shows `TP.HCM` compactly and exposes the full searchable province list
  - `/services`: deal tags are visually stronger over the card images
  - `/community`: clicking a thumbnail inside post detail opens the new lightbox viewer

# Recommended Next Step

Review the remaining desktop parity surfaces again with focus on:

- `/`
- `/services`
- `/community`

If those pass, the next implementation step should move back to missing Stitch screen generation rather than more ad-hoc redesign on already-ported routes.
