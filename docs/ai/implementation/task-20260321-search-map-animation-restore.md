---
phase: implementation
title: Search Map Animation Restore
date: 2026-03-21
owner: Codex
status: completed
---

# Summary

- Restored smooth selected-room camera motion on the `/search` mini-map after the previous map-focus pass
- Removed the accidental Mapbox re-initialization that was happening on every selected-room change
- Kept marker selection callbacks up to date through refs so interaction behavior stays current without tearing down the map instance

# Files

- Updated `packages/web/src/components/maps/MapboxRoomMap.tsx`
- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

# Validation

- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with the same 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass
- Playwright canvas-persistence check on `http://127.0.0.1:4175/search`
  - confirmed the same `.mapboxgl-canvas` node survives after switching focus to another room (`sameCanvas: true`)
  - confirmed the marker layer stays stable during the transition (`11 -> 11`)

# Notes

- This pass specifically restores the smooth zoom/pan behavior; it does not change the selected-room viewport strategy added in the previous map-focus pass
