---
phase: implementation
task: admin-room-editor-single-save
date: 2026-04-11
status: completed
---

# Task Log: Admin Room Editor Single Save

## Goal

- Investigate why the admin room editor looked like it required two save clicks
- Fix the underlying UI race instead of changing the mutation flow blindly
- Add a regression test so one successful save closes the drawer exactly once

## Root Cause

- `packages/web/src/pages/admin/RoomsPage.tsx` auto-opened the editor whenever the `focus` query param existed and no room was selected.
- During `closeEditor(false)`, `selectedRoomForEdit` was cleared before the `focus` search param had fully disappeared from React Router state.
- That intermediate render satisfied the auto-open effect again, so the drawer reopened immediately after a successful save.
- Result: the first save mutation already fired, but the UI looked unsaved because the drawer appeared to stay open.

## Files

- `packages/web/src/pages/admin/RoomsPage.tsx`
- `packages/web/tests/e2e/helpers/mockApi.ts`
- `packages/web/tests/e2e/admin-room-editor.spec.ts`
- `docs/ai/monitoring/project-status.md`

## Validation

- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings in unrelated files
- `npm run test:e2e --workspace=@roomz/web -- admin-room-editor.spec.ts`: pass
- `npm run build --workspace=@roomz/web`: pass

## Summary

- Guarded the focus-driven auto-open flow with a ref so closing the editor no longer looks like a fresh deep-link open.
- Switched the `focus` search-param cleanup to `replace: true` so the URL is cleared without leaving extra admin-history noise behind.
- Added an E2E regression that proves one click sends one save mutation and the drawer closes instead of reopening.
