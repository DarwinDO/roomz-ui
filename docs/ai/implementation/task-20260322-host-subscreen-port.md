---
phase: implementation
title: Host Sub-Screen Port Pass
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

Ported the reviewed landlord sub-screen concepts into the existing `/host` shell while keeping the shared host top navigation and horizontal tab bar.

# Changes

- Extended [LandlordDashboardPage.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/LandlordDashboardPage.tsx)
  - added tab-aware hero copy for `Tổng quan`, `Tin đăng`, `Lịch hẹn`, `Tin nhắn`, and `Thu nhập`
  - added a listings insight strip with portfolio mix, spotlight listings, and quick actions
  - added an appointments overview strip with a next-up queue and lightweight monthly calendar
  - added a messages overview strip with conversation triage and a selected-conversation focus card
  - added an income overview strip with revenue-health and live listing momentum cards
- Preserved existing RommZ landlord behavior inside the new shell
  - listing groups still use the current room data and statuses
  - booking confirm / reject / complete flows still run through the existing dialog actions
  - inbox actions still route into the full `/messages` experience
  - income stays framed as a live operational estimate instead of a reconciled payments ledger

# Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

# Notes

- The repo intentionally keeps the host top-nav + horizontal-tab shell even if a Stitch concept shows a sidebar.
- Live authenticated review is still required for `/host` because automation cannot pass the landlord guard.
