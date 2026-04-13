---
phase: implementation
title: Premium Avatar Review Follow-ups
date: 2026-04-13
status: completed
---

# Premium Avatar Review Follow-ups

## Goal

Close the remaining review findings after the premium avatar rollout so the gold-ring UI is backed by the correct `is_premium` data on every live web path that was still missing it.

## Scope

- Fix the `PremiumAvatar` premium branch contract.
- Patch the legacy host messaging path to keep `is_premium`.
- Patch swap/sublet request and application paths to keep `is_premium`.
- Add `landlord_is_premium` to the `search_rooms` RPC path.
- Stop `updateReview()` from dropping reviewer premium metadata after edits.

## Changes

- `packages/web/src/components/ui/PremiumAvatar.tsx`
  - fixed the premium branch markup and moved the crown badge to a stable icon implementation
  - preserved wrapper sizing while keeping the inner avatar aligned to the ring wrapper
- `packages/web/src/components/ui/PremiumAvatar.test.tsx`
  - added regression coverage for the premium branch class/style pass-through
- `packages/shared/src/services/messages.ts`
- `packages/web/src/hooks/useMessages.ts`
- `packages/web/src/pages/LandlordDashboardPage.tsx`
  - propagated `is_premium` through the legacy host inbox path and replaced the remaining plain avatars with `PremiumAvatar`
- `packages/shared/src/types/swap.ts`
- `packages/web/src/services/sublets.ts`
- `packages/web/src/services/swap.ts`
- `packages/web/src/components/swap/SubletCard.tsx`
- `packages/web/src/components/swap/SwapRequestCard.tsx`
- `packages/web/src/pages/SubletApplicationsPage.tsx`
- `packages/web/src/pages/SwapRoomPage.tsx`
  - propagated `is_premium` through the live swap/sublet surfaces and rendered premium rings there
- `supabase/migrations/20260413153000_add_landlord_is_premium_to_search_rooms.sql`
- `packages/shared/src/services/rooms.ts`
- `packages/shared/src/types/database.ts`
- `packages/shared/src/services/database.types.ts`
  - added landlord premium metadata to the `search_rooms` RPC contract and mapped it into `RoomWithDetails.landlord`
- `packages/shared/src/services/reviews.ts`
- `packages/web/src/services/reviews.shared.test.ts`
  - `updateReview()` now re-selects the joined reviewer payload including `is_premium`
- `packages/web/src/services/rooms.shared.test.ts`
  - added coverage for the `search_rooms` landlord-premium mapping

## Validation

- `npx eslint packages/shared/src/services/messages.ts packages/web/src/hooks/useMessages.ts packages/web/src/pages/LandlordDashboardPage.tsx packages/shared/src/types/swap.ts packages/web/src/services/sublets.ts packages/web/src/services/swap.ts packages/web/src/components/swap/SubletCard.tsx packages/web/src/components/swap/SwapRequestCard.tsx packages/web/src/pages/SubletApplicationsPage.tsx packages/web/src/pages/SwapRoomPage.tsx packages/web/src/components/ui/PremiumAvatar.tsx packages/web/src/components/ui/PremiumAvatar.test.tsx packages/shared/src/services/rooms.ts packages/shared/src/types/database.ts packages/shared/src/services/database.types.ts packages/shared/src/services/reviews.ts packages/web/src/services/rooms.shared.test.ts packages/web/src/services/reviews.shared.test.ts`
- `npm run test:unit --workspace=@roomz/web -- src/components/ui/PremiumAvatar.test.tsx src/services/rooms.shared.test.ts src/services/reviews.shared.test.ts`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `npm run build --workspace=@roomz/web`

## Live Rollout

- Applied `supabase/migrations/20260413153000_add_landlord_is_premium_to_search_rooms.sql` to Supabase project `vevnoxlgwisdottaifdn`.
- Verified directly on the database that `public.search_rooms(...)` now returns `landlord_is_premium` and selects `u.is_premium AS landlord_is_premium`.
- Normalized remote migration history so the live project now records the local repo version `20260413153000 / add_landlord_is_premium_to_search_rooms` instead of the temporary auto-generated MCP migration version.

## Residual Risk

- `SwapMatchesPage` still was not expanded in this batch. If the product wants premium rings on the potential-match route too, that page needs a separate pass.
