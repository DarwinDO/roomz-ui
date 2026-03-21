---
phase: implementation
title: Landing Filter Popover Scroll Fix
date: 2026-03-21
owner: Codex
status: completed
---

# Summary

- Replaced the landing hero `Ngan sach` and `Loai phong` controls in `packages/web/src/pages/LandingPage.tsx` from Radix `Select` to popover-based menu triggers
- Kept the compact Stitch-style trigger appearance while removing the body scroll-lock side effect that caused the fixed navbar to shift

# Why

- The user reported that opening a dropdown on the landing page made the navbar move horizontally and temporarily removed the page scrollbar
- Runtime inspection showed the old Radix `Select` path was setting `body` to `overflow: hidden` and compensating with right margin, changing viewport width while the menu was open

# Implementation

- Removed landing-page usage of `Select`, `SelectTrigger`, `SelectContent`, and `SelectItem`
- Added `isBudgetOpen` and `isRoomTypeOpen` state controls
- Rebuilt both menus with `Popover`, `PopoverTrigger`, and `PopoverContent`
- Kept compact trigger labels (`2-5tr`, `Căn hộ`) and added explicit selected-state checkmarks inside the popovers

# Verification

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- Playwright runtime inspection on `http://127.0.0.1:4173/`:
  - baseline: `body overflow = visible`, `margin-right = 0px`, `clientWidth = 1425`
  - after opening `Ngan sach`: unchanged
  - after opening `Loai phong`: unchanged

# Notes

- Accessibility labels for the two new trigger buttons were kept simple to avoid mojibake drift in the current file encoding state
- The location control remains on the searchable popover-combobox introduced in the earlier landing parity pass
