---
phase: implementation
title: Search Location Switch Animation Pass
date: 2026-03-21
owner: Codex
status: completed
---

# Summary

- Restored smooth `/search` map animation when the result set changes through non-empty location switches such as quick area chips
- Stopped the Mapbox instance from being recreated when the room dataset changes, which was the remaining cause of the missing zoom/pan transition
- Split marker and radius updates into their own effects so the canvas can stay mounted while the map data updates

# Files

- Updated `packages/web/src/components/maps/MapboxRoomMap.tsx`
- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

# Validation

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`
  - pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with the same 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass
- Playwright runtime check on `http://127.0.0.1:4177/search`
  - confirmed the same `.mapboxgl-canvas` node survives after a non-empty quick-chip location change (`sameCanvas: true`)
  - confirmed the map still rebuilds into the empty placeholder state when a location search yields `0` rooms, which is expected because there is no room dataset left to animate

# Notes

- This pass fixes the missing animation for location changes that still return rooms
- Empty-result transitions intentionally replace the map with the no-results state and therefore do not animate like the in-results camera changes
