---
phase: implementation
title: Global Scroll Lock Shell Pass
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

- Fixed the navbar and top-shell shift caused by Radix `Select` overlays that trigger `react-remove-scroll`
- Added a shared `scroll-lock-shell` utility in `packages/web/src/index.css`
- Applied that utility to all current fixed or sticky top shells in the web package
- Added a project memory note so future top shells using Radix `Select` keep the same protection

# Root Cause

- `@radix-ui/react-select` mounts `react-remove-scroll`
- When a select opens, the body can receive `data-scroll-locked` and scrollbar compensation
- Fixed and sticky top shells without compensation appear to jump horizontally even though the content itself did not move

# Files

- Updated `packages/web/src/index.css`
- Updated `packages/web/src/router/AppShell.tsx`
- Updated `packages/web/src/router/AdminShell.tsx`
- Updated `packages/web/src/pages/CompatibilityPage.tsx`
- Updated `packages/web/src/pages/EditSubletPage.tsx`
- Updated `packages/web/src/pages/LandlordDashboardPage.tsx`
- Updated `packages/web/src/pages/LocalPassportPage.tsx`
- Updated `packages/web/src/pages/MySubletsPage.tsx`
- Updated `packages/web/src/pages/PaymentPage.tsx`
- Updated `packages/web/src/pages/PostRoomPage.tsx`
- Updated `packages/web/src/pages/PostSubletPage.tsx`
- Updated `packages/web/src/pages/SearchPage.tsx`
- Updated `packages/web/src/pages/SubletApplicationsPage.tsx`
- Updated `packages/web/src/pages/SubletDetailPage.tsx`
- Updated `packages/web/src/pages/SupportServicesPage.tsx`
- Updated `packages/web/src/pages/SwapMatchesPage.tsx`
- Updated `packages/web/src/pages/SwapRequestsPage.tsx`
- Updated `packages/web/src/pages/VerificationPage.tsx`
- Updated `docs/ai/monitoring/project-status.md`

# Validation

- `cmd /c "C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint"`
  - pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with the same 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass

# Follow-up Rule

- For future work in this repo:
  - any fixed or sticky top shell must include `scroll-lock-shell` if the page can open a Radix `Select`
  - prefer popover/listbox patterns for compact inline filters instead of modal-style dropdown behavior
