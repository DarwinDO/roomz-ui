---
phase: implementation
title: Search Map Focus Pass
date: 2026-03-21
owner: Codex
status: completed
---

# Summary

- Updated `MapboxRoomMap` so search-specific maps can prioritize the selected room instead of fitting every marker in the result set
- Applied the new selected-room viewport mode to both the compact split-map and the full map view on `/search`
- This removes the previous nationwide map extent that made selected rooms hard to locate when no location filter was active

# Files

- Updated `packages/web/src/components/maps/MapboxRoomMap.tsx`
- Updated `packages/web/src/pages/SearchPage.tsx`
- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

# Validation

- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass
- Playwright screenshot review on rebuilt preview `http://127.0.0.1:4175/search`
  - confirmed the compact split-map now centers on the selected room's local area
  - confirmed the selected room's price marker remains visible in the mini-map card instead of being lost inside an all-country extent

# Notes

- `viewportMode="fit-results"` remains the default for other map contexts, so room detail and generic map usage do not change unless explicitly opted in
- A local `vite preview` server was started on `127.0.0.1:4175` for this verification pass
