---
phase: implementation
task: swap-sublet-premium-avatar-surface-fix
date: 2026-04-13
status: complete
---

# Task Log: Swap/Sublet Premium Avatar Surface Fix

## Goal

- Close the remaining premium-avatar gaps on the live swap/sublet surfaces by propagating `is_premium` through the relevant data paths and rendering `PremiumAvatar` for real-user avatars.

## Files

- `packages/shared/src/types/swap.ts`
- `packages/web/src/services/sublets.ts`
- `packages/web/src/services/swap.ts`
- `packages/web/src/components/ui/PremiumAvatar.tsx`
- `packages/web/src/components/ui/PremiumAvatar.test.tsx`
- `packages/web/src/components/swap/SubletCard.tsx`
- `packages/web/src/components/swap/SwapRequestCard.tsx`
- `packages/web/src/pages/SubletApplicationsPage.tsx`
- `packages/web/src/pages/SwapRoomPage.tsx`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Propagated premium metadata into the swap/sublet data contracts:
  - `SwapRequest.requester` and `SwapRequest.recipient` now allow `is_premium`
  - `SubletApplication.applicant` now allows `is_premium`
  - the sublet application fetch now selects `is_premium` for applicants
  - the swap request fetches now select `is_premium` for requesters and recipients
- Replaced the plain avatar renderers on the live swap/sublet surfaces with `PremiumAvatar`:
  - `SubletCard` now shows premium owners with the ring
  - `SwapRequestCard` now shows premium request participants with the ring
  - `SubletApplicationsPage` now shows premium applicants with the ring
  - `SwapRoomPage` now shows premium owners in the lower swap cards with the ring
- Fixed the shared `PremiumAvatar` component so the premium branch compiles cleanly and keeps the className contract for both the wrapper and the inner avatar.
- Extended the existing `PremiumAvatar` regression test to cover the premium className path.

## Root Cause

- The swap/sublet read paths were still dropping `is_premium` before the data reached the live avatar surfaces.
- Several cards still rendered plain `img` or plain `Avatar`, so even correctly hydrated premium metadata would not have produced the premium ring.
- The shared `PremiumAvatar` implementation had a malformed premium branch and needed a cleanup before the new surfaces could build.

## Validation

- `npx eslint packages/web/src/components/ui/PremiumAvatar.tsx packages/web/src/components/ui/PremiumAvatar.test.tsx packages/web/src/services/sublets.ts packages/web/src/services/swap.ts packages/web/src/components/swap/SubletCard.tsx packages/web/src/components/swap/SwapRequestCard.tsx packages/web/src/pages/SubletApplicationsPage.tsx packages/web/src/pages/SwapRoomPage.tsx packages/shared/src/types/swap.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260413-swap-sublet-premium-avatar-surface-fix.md`

## Follow-ups

- `SwapMatchesPage` and the potential-match RPC path were left untouched by scope; if that route is considered part of the same premium-avatar surface, it needs a separate follow-up pass.
