---
phase: implementation
title: Search Interaction Bugfix Pass
date: 2026-03-21
owner: Codex
status: completed
---

# Summary

- Fixed the refined `/search` page so the search console no longer starts underneath the fixed desktop navbar
- Changed secondary listing cards to open room detail on the first click instead of first promoting the room into the selected-listing hero slot
- Updated `Xem tren ban do` and split-map marker selection to smooth-scroll users back toward the selected-listing hero card from lower positions in the list

# Files

- Updated `packages/web/src/pages/SearchPage.tsx`
- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

# Validation

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`
  - pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass
- Playwright scripted check on `http://127.0.0.1:4173/search`
  - confirmed the refined search console clears the fixed desktop navbar (`inputTop: 177`, `headerBottom: 73`)
  - confirmed clicking the first secondary listing card navigates directly to its detail route on the first click
  - confirmed triggering `Xem tren ban do` from the lower results list scrolls the viewport back toward the selected-listing hero area (`scrollY: 2739 -> 337`)

# Notes

- The full-map mode remains unchanged in this pass; the new auto-focus behavior is only applied to the split list/map search layout
- The temporary legacy branch inside `SearchPage.tsx`, gated by `VITE_ENABLE_LEGACY_SEARCH`, is still intentionally kept for rollback safety while the refined search port continues to stabilize
