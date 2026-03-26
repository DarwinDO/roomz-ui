---
phase: implementation
title: Host Entry Navigation Pass
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

Exposed the host surface from the shared web shell so users no longer need to know `/host` manually.

# Changes

- Updated [AppShell.tsx](e:/RoomZ/roomz-ui/packages/web/src/router/AppShell.tsx)
  - landlords now see `Chủ nhà` in the desktop primary navigation
  - avatar menu now links to `/host` for landlords
  - avatar menu now links to `/become-host` for non-landlords
- Updated [BottomNav.tsx](e:/RoomZ/roomz-ui/packages/web/src/components/common/BottomNav.tsx)
  - mobile quick-access sheet now shows `Chủ nhà` for landlords
  - mobile quick-access sheet now shows `Trở thành chủ nhà` for non-landlords

# Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

# Notes

- Manual authenticated review is still needed because the host route is protected by the landlord guard.
