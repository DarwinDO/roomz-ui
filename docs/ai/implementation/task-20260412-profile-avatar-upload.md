---
phase: implementation
task: profile-avatar-upload
date: 2026-04-12
status: complete
---

# Task Log: Profile Avatar Upload

## Goal

- Implement the missing avatar upload path in the existing profile edit modal so users can change their profile picture without leaving the profile flow.

## Files

- `packages/web/src/components/modals/ProfileEditModal.tsx`
- `packages/web/src/services/profile.ts`
- `packages/web/src/services/profile.utils.ts`
- `packages/web/src/services/profile.test.ts`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Replaced the disabled `Thay đổi ảnh (Sắp có)` placeholder in `ProfileEditModal` with a working file picker, local preview, validation feedback, and a reset action.
- Kept avatar persistence inside the same submit flow as the rest of the profile form, so saving profile text and avatar still happens as one user action.
- Added a web-specific avatar upload helper that compresses uploads toward `webp`, reuses the existing `user-avatars` storage path, and appends a cache-busting query suffix to the returned public URL.
- Mapped common upload failures to user-facing errors so missing storage permissions or bucket configuration do not surface as raw Supabase messages.
- Extracted pure helper logic for avatar validation and profile update payload shaping into `profile.utils.ts`.
- Added unit coverage for avatar file validation and the generated profile update payload.

## Validation

- `npx eslint packages/web/src/components/modals/ProfileEditModal.tsx packages/web/src/services/profile.ts packages/web/src/services/profile.utils.ts packages/web/src/services/profile.test.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npx playwright test --config ./playwright.unit.config.ts src/services/profile.test.ts` in `packages/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260412-profile-avatar-upload.md`

## Follow-ups

- Run a live authenticated smoke check against the real `user-avatars` bucket to confirm the current Supabase storage policy allows end-user avatar uploads in production.
