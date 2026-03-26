---
phase: implementation
title: Landlord Dashboard Stitch Port
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

Ported `/host` to the generated Stitch landlord dashboard while preserving live RoomZ landlord workflows and legacy compatibility.

# Changes

- Replaced the old host dashboard shell in [LandlordDashboardPage.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/LandlordDashboardPage.tsx)
  - added the Stitch-first overview with four metrics, listing management, request queue, content quality, and income snapshot
  - kept deeper sections for `Tin đăng`, `Lịch hẹn`, `Tin nhắn`, and `Thu nhập` in the same route
  - preserved the existing landlord booking action dialog for confirm / reject / complete
- Updated legacy host-booking redirects in [router.tsx](e:/RoomZ/roomz-ui/packages/web/src/router/router.tsx)
  - `/host/bookings/:id` -> `/host?tab=appointments`
  - `/landlord/bookings/:id` -> `/host?tab=appointments`
- Normalized old landlord query params inside the new dashboard
  - `my-rooms` -> `listings`
  - `pending` / `confirmed` / `history` / `bookings` -> `appointments`

# Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

# Notes

- Authenticated visual review is still required for `/host` because automation cannot pass the landlord guard in an anonymous session.
- The current host `Thu nhập` view is intentionally framed as a live-data estimate from active listings, not a fully reconciled payments dashboard.
