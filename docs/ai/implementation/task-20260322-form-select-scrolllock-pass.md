---
phase: implementation
title: Posting Dropdown Scroll-Lock Pass
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

Removed the remaining user-facing posting dropdown layout shift by fixing the root scroll-lock behavior globally and migrating posting-form dropdowns away from raw Radix `Select`.

# Changes

- Added global scrollbar stabilization in [index.css](e:/RoomZ/roomz-ui/packages/web/src/index.css)
  - reserved a stable scrollbar gutter on `html`
  - cleared Radix body compensation while `data-scroll-locked` is active
- Kept `scroll-lock-shell` for fixed and sticky top shells
- Added and used shared [FormSelectPopover](e:/RoomZ/roomz-ui/packages/web/src/components/ui/form-select-popover.tsx) for inline user-facing posting dropdowns
- Replaced posting-form selects in:
  - [StepBasicInfo.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/post-room/components/StepBasicInfo.tsx)
  - [PostSubletPage.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/PostSubletPage.tsx)
  - [PostListingModal.tsx](e:/RoomZ/roomz-ui/packages/web/src/components/modals/PostListingModal.tsx)
- Updated workspace protocol in [AGENTS.md](e:/RoomZ/roomz-ui/AGENTS.md) so future inline user-facing dropdowns should prefer `FormSelectPopover` over raw Radix `Select`

# Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

# Notes

- Remaining raw Radix `Select` usages still exist in admin and some non-posting flows, but the global scrollbar stabilization now prevents the old navbar/form width jump at the layout level.
- For future user-facing centered forms, `FormSelectPopover` is the default pattern.
