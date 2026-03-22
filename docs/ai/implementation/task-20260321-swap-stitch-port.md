---
phase: implementation
task: swap-stitch-port
date: 2026-03-21
owner: codex
---

# Task Log: Swap Stitch Port

## Goal

Port `/swap` from the generated Stitch screen `Ở Ngắn Hạn & Đổi Phòng - Living Atlas` while keeping RoomZ short-stay actions reachable.

## Changes

### Stitch-first route shell

- Replaced the old hub-first layout in `packages/web/src/pages/SwapRoomPage.tsx`
- Added a Stitch-style search console with:
  - route-local tabs `Ở ngắn hạn`, `Sublet`, `Đổi phòng`
  - area query input
  - date range inputs
  - price-range selector
  - primary CTA and advanced-filter toggle

### Editorial browse surface

- Added a featured short-stay card that maps to the first live sublet result
- Added a secondary sublet card and a trust card in the right column
- Added a lower `Cơ hội dời đến sớm` section with:
  - one swap-opportunity card
  - two early move-in cards
  - a six-card live listing grid below

### Flow preservation

- Kept these existing flows reachable from the new layout:
  - `create-sublet`
  - `my-sublets`
  - `swap-matches`
  - `ApplySubletDialog`
  - `SwapRequestDialog`
- Kept public access to `/swap`, matching the previous route behavior

### Shared assets

- Added `stitchAssets.swap` in `packages/web/src/lib/stitchAssets.ts`
- This stores fallback imagery for the featured card, secondary card, and move-in avatars when live data is missing images

## Validation

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`: pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass
- `C:\nvm4w\nodejs\npx.cmd playwright screenshot --device="Desktop Chrome HiDPI" http://127.0.0.1:4181/swap .tmp-swap-preview.png`: pass

## Known Limits

- The local smoke screenshot showed `0 tin đang mở`, so the visual check in this turn primarily verified the new shell and compile state rather than full live-data parity
- A manual review on the project's real dataset is still needed before calling `/swap` parity-complete
