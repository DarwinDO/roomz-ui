---
phase: monitoring
title: Project Status Snapshot
description: Living project memory for RoomZ product scope, architecture, roadmap, and current implementation state
updated: 2026-04-18
---

# RommZ Project Status

## Snapshot

- **Project name:** RommZ
- **Workspace type:** Monorepo
- **Packages:** `packages/web`, `packages/mobile`, `packages/shared`
- **Primary web stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Radix UI + TanStack Query + Supabase
- **Primary mobile stack:** Expo / React Native with NativeWind
- **Current design direction:** `Stitch-first` Living Atlas direct port for eleven desktop routes
- **Motion direction:** Framer Motion only; shared motion foundation plus public and product polish are now active on `/`, `/login`, `/services`, `/community`, `/search`, `/messages`, and `/host`
- **Hero accent direction:** Draftly-like layered illustration hero on landing/login; no runtime WebGL is active now

## Latest Update (2026-04-18, user-facing copy cleanup across ROMI and messaging surfaces)

- Cleaned user-facing copy that still read like internal implementation notes across ROMI, inbox, host dashboard, search/location suggestion surfaces, and Local Passport.
- Root cause:
  - several public strings were written too close to internal product/state terminology during implementation
  - labels like `thread`, `session`, `workspace`, `listing`, `room context`, `console`, `lane`, and `live` leaked into renter/host-facing UI
  - shared ROMI journey summaries were built as bullet-separated state fragments instead of end-user-readable sentences
- Fix:
  - updated `packages/web/src/pages/RomiPage.tsx` to use end-user terms such as `cuộc trò chuyện`, `lịch sử trò chuyện`, and clearer explanatory / error copy
  - updated `packages/shared/src/services/ai-chatbot/journey.ts` so `buildJourneySummary(...)` now produces natural Vietnamese sentences and no longer emits status-dump strings like `... • đang mở room`
  - updated `packages/shared/src/services/ai-chatbot/api.ts` to soften ROMI preview/error fallbacks away from streaming/data-pipeline jargon
  - updated `packages/web/src/pages/MessagesPage.tsx` and `packages/web/src/pages/LandlordDashboardPage.tsx` to remove `thread / listing / room context / console / lane / live` wording from user-facing surfaces
  - updated `packages/web/src/pages/SearchPage.tsx`, `packages/web/src/pages/LocalPassportPage.tsx`, and `packages/web/src/components/listings/ListingLocationContext.tsx` to remove `nội bộ`, `Catalog nội bộ`, `Local context`, and other internal catalog wording
- Regression coverage:
  - `packages/web/src/services/romi.test.ts` now verifies ROMI summaries stay sentence-based and do not regress back to bullet-fragment state dumps
- Latest validation:
  - `npx eslint packages/shared/src/services/ai-chatbot/journey.ts packages/shared/src/services/ai-chatbot/api.ts packages/web/src/pages/RomiPage.tsx packages/web/src/pages/MessagesPage.tsx packages/web/src/pages/LandlordDashboardPage.tsx packages/web/src/pages/SearchPage.tsx packages/web/src/components/listings/ListingLocationContext.tsx packages/web/src/pages/LocalPassportPage.tsx packages/web/src/services/romi.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/services/romi.test.ts`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-18, room view count guard fix)

- Fixed the host-side room view counter inflation where opening one listing could add `2` views and where admin / landlord previews were also counted as public views.
- Root cause:
  - `packages/shared/src/services/rooms.ts` incremented `view_count` inside `getRoomById(...)`
  - that fetch helper is reused by the public detail page, landlord edit and preview flows, and post-create / post-update reloads
  - because the mutation lived inside the fetch path, repeat query execution and non-public previews could still increment the listing counter
- Fix:
  - removed the `increment_view_count` RPC side effect from `getRoomById(...)`
  - added a dedicated `incrementRoomView(...)` helper in the shared room service and exposed it through the web wrappers
  - updated `packages/web/src/pages/RoomDetailPage.tsx` so room views are only counted when:
    - auth state is resolved
    - the room status is `active`
    - the viewer is not an admin
    - the viewer is not the landlord who owns the listing
  - aligned `trackRoomViewed(...)` analytics with the same public-view guard so telemetry stays closer to the visible room counter
- Regression coverage:
  - `packages/web/src/services/rooms.shared.test.ts` now verifies `getRoomById(...)` no longer mutates `view_count` and `incrementRoomView(...)` is the only path that calls the RPC
  - `packages/web/src/utils/roomViewTracking.test.ts` now verifies the guard for auth-loading, pending rooms, admin previews, landlord self-previews, and valid public views
- Latest validation:
  - `npx eslint packages/shared/src/services/rooms.ts packages/web/src/services/rooms.ts packages/web/src/services/index.ts packages/web/src/pages/RoomDetailPage.tsx packages/web/src/services/rooms.shared.test.ts packages/web/src/utils/roomViewTracking.ts packages/web/src/utils/roomViewTracking.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/services/rooms.shared.test.ts src/utils/roomViewTracking.test.ts`: pass

## Latest Update (2026-04-14, outcome 1 mvp product brief)

- Added a dedicated evaluator-facing product brief for `Outcome 1 / item 3` at [docs/features/outcome-1-mvp-product-brief.md](/e:/RoomZ/roomz-ui/docs/features/outcome-1-mvp-product-brief.md).
- Why this was added:
  - the repo already contained enough real product context to support a strong MVP brief, but the information was fragmented across lifecycle docs, README copy, premium entitlement notes, and ROMI audit material
  - the team needed one defensible document that clearly states the current `persona / ICP`, `core value proposition`, and `core metrics dự kiến đo` without overclaiming future scope
- What the brief now locks:
  - the current Outcome 1 submission should be framed as a `web-first RommZ MVP`
  - the primary ICP is students and young renters who need clearer room discovery and faster decision-making
  - the current thesis is `Tìm phòng rõ hơn, chốt nhanh hơn`
  - the recommended metric model now includes a North Star based on qualified housing decision actions plus core MVP metrics such as search activation, search-to-detail CTR, detail-to-contact conversion, ROMI action CTR, and D7 return
- Submission artifact added:
  - [docs/features/outcome-1-mvp-product-brief-submission.md](/e:/RoomZ/roomz-ui/docs/features/outcome-1-mvp-product-brief-submission.md) is now the short evaluator-facing version intended for direct submission
  - [docs/features/outcome-1-mvp-product-brief.md](/e:/RoomZ/roomz-ui/docs/features/outcome-1-mvp-product-brief.md) remains the longer backing document for internal alignment and live Q&A support
- Submission cleanup follow-up:
  - removed template placeholders and non-final checklist sections from the short submission brief
  - corrected the short brief so it no longer understates live surfaces such as ROMI and RommZ+
  - normalized the short brief toward Vietnamese-first wording to reduce unnecessary English/Vietnamese mixing
  - compressed the short brief further after review feedback so the scope reads more like a submission artifact and less like an internal note
  - clarified the RommZ+ wording so live core entitlements and still-planned higher-tier benefits are separated more explicitly
- Accuracy guardrails captured in the brief:
  - do not present mobile parity as complete for Outcome 1
  - do not present planned or not-yet-live premium benefits as current public promises
  - do not present the proposed metrics as historical business results; they are the MVP measurement framework to track next
- Latest validation:
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-14, become-landlord pending contrast fix)

- Fixed the pending-host application screen where the main title and subtitle became too faint against the pale warning background.
- Root cause:
  - `packages/web/src/pages/become-landlord/components/BecomeLandlordPending.tsx` used `text-warning-foreground` and `text-warning-foreground/80`
  - those foreground tokens are intended for strong warning surfaces, but this card uses a very light `bg-warning/5`
  - the resulting contrast was too weak, especially on the centered pending-state heading block
- Fix:
  - kept the warning-tinted card, icon, and layout intact
  - changed the title to `text-warning`
  - changed the supporting description to `text-slate-600`
  - no new UI copy, badges, or extra note content were added to the screen
- Latest validation:
  - `npx eslint packages/web/src/pages/become-landlord/components/BecomeLandlordPending.tsx`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-14, community social feed with 10-post incremental loading)

- Reworked the public `/community` page again after product feedback so `Tin đăng` behaves like a real social/community feed instead of a numbered blog archive.
- Why this changed:
  - the first 2026-04-14 iteration moved the page toward a blog-style grid with numbered pagination
  - product feedback clarified that the intended experience is closer to Facebook-style vertical post browsing while keeping the existing community page shell
  - the final direction is now: stacked full-width post cards, 10 posts per load, and a visible `Xem thêm bài viết` CTA instead of page numbers
- Implemented:
  - `packages/web/src/hooks/useCommunity.ts`
    - restored `usePosts` to `useInfiniteQuery`
    - the hook now accumulates posts across pages again and exposes `hasNextPage`, `fetchNextPage`, and `isFetchingNextPage`
  - `packages/web/src/services/community.ts`
    - kept server-side `searchQuery` filtering on `title` and `content`
  - `packages/web/src/hooks/useCommunityCache.ts`
    - retained cache update support for both single-page and infinite feed shapes touched during the pivot
  - `packages/web/src/pages/community/types.ts`
    - kept `searchQuery` in `PostsFilter`
  - `packages/web/src/pages/CommunityPage.tsx`
    - removed the numbered pagination / blog-grid presentation
    - now renders a single vertical feed of full-width social post cards in the main column
    - loads 10 posts at a time and appends the next batch through `Xem thêm bài viết`
    - keeps live author avatars, `PremiumAvatar`, server-side search, filter chips, and the right-hand sidebar modules
- Regression coverage:
  - updated `packages/web/src/pages/CommunityPage.test.tsx` to validate:
    - feed cards and contributor cards still use live author avatar data
    - the feed renders as a vertical stack, starts with 10 posts, and appends more posts through `Xem thêm bài viết`
- Latest validation:
  - `npx eslint packages/web/src/pages/CommunityPage.tsx packages/web/src/pages/CommunityPage.test.tsx packages/web/src/hooks/useCommunity.ts packages/web/src/hooks/useCommunityCache.ts packages/web/src/services/community.ts packages/web/src/pages/community/types.ts`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/CommunityPage.test.tsx`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run build --workspace=@roomz/web`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-13, payment order subscription reuse fix)

- Fixed the live SePay premium-payment failure where a valid payment could reach the webhook but still fail to activate RommZ+ for users who already had an older subscription row.
- Root cause:
  - `public.subscriptions` is modeled as a single-row state table with `UNIQUE(user_id)`
  - `process_payment_order` only looked for an existing subscription where `status = 'active'`
  - users with an older `expired` or `cancelled` row therefore fell into the `INSERT INTO subscriptions` path and hit `duplicate key value violates unique constraint "subscriptions_user_id_key"`
  - the same function also wrote `users.premium_until = v_period_end` directly, which could drift from the real subscription end when extending an active term
- Fix:
  - added migration `supabase/migrations/20260413222500_fix_payment_order_reuse_existing_subscription.sql`
  - `process_payment_order` now locks and reuses any existing subscription row for the user, reactivating it when needed instead of attempting a second insert
  - removed the direct `users` premium write from the payment function and let the existing `sync_user_premium_cache_on_subscriptions` trigger remain the single source of truth for `users.is_premium` / `users.premium_until`
  - kept order locking and idempotent `already_paid` behavior intact
- Live recovery:
  - applied on Supabase project `vevnoxlgwisdottaifdn`
  - replayed failed order `ROMMZ20260413153241908678` while it was still pending
  - verified the order is now `paid`, the existing subscription row was reactivated instead of duplicated, and `users.is_premium = true` with `premium_until = 2026-05-13 15:48:41+00`
- Latest validation:
  - Supabase migration apply: pass
  - direct SQL replay of `process_payment_order('ROMMZ20260413153241908678', 19500, 'TF26104679222900', null)`: pass
  - direct SQL verification of `payment_orders`, `subscriptions`, and `users`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-13, roommate conversation routing fix)

- Fixed the roommate messaging flow so accepted matches and accepted connection requests now open the exact direct thread instead of dumping the user into a generic inbox view.
- Root cause:
  - roommate surfaces in `packages/web/src/pages/roommates/components/results/RoommateResults.tsx` and `packages/web/src/pages/roommates/components/requests/RequestsList.tsx` only redirected to `/messages?user=<id>`
  - `packages/web/src/pages/MessagesPage.tsx` only treats that query param as a best-effort lookup against already-loaded conversations
  - when no existing thread matched, the inbox silently fell back to the first conversation, making the `Nhắn tin` CTA feel implemented while actually opening the wrong chat
- Fix:
  - added `packages/web/src/pages/roommates/utils/openRoommateConversation.ts` as a shared helper that calls `startConversation(otherUserId, currentUserId)` and navigates to `/messages/<conversationId>`
  - wired both roommate results and roommate requests to use that helper instead of `window.location.href` / query-param redirects
  - added loading/disabled states on the roommate `Nhắn tin` buttons while the direct thread is being opened
  - corrected the component-level relative imports to `../../utils/openRoommateConversation` so Vite can resolve the shared helper from both `components/results` and `components/requests`
- Regression coverage:
  - added `packages/web/src/pages/roommates/utils/openRoommateConversation.test.ts`
- Latest validation:
  - `npx eslint packages/web/src/pages/roommates/components/results/RoommateResults.tsx packages/web/src/pages/roommates/components/requests/RequestsList.tsx packages/web/src/pages/roommates/utils/openRoommateConversation.ts packages/web/src/pages/roommates/utils/openRoommateConversation.test.ts`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/roommates/utils/openRoommateConversation.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run build --workspace=@roomz/web`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-13, contact landlord existing-thread fix)

- Fixed the room-detail contact modal regression where messaging a landlord could fail only after a conversation for that room already existed.
- Root cause:
  - `packages/web/src/components/modals/ContactLandlordModal.tsx` opens by calling `get_or_create_conversation(user, landlord, roomId, roomTitle)`
  - the live PostgreSQL function `public.get_or_create_conversation` worked for brand-new conversations, but its existing-thread update branch used `room_title_snapshot` ambiguously
  - PostgreSQL raised `column reference "room_title_snapshot" is ambiguous`, so the modal dropped into its catch block and surfaced `Không thể tải tin nhắn`
- Fix:
  - added migration `supabase/migrations/20260413211500_fix_get_or_create_conversation_room_title_snapshot_ambiguity.sql`
  - qualified the function parameter explicitly as `get_or_create_conversation.room_title_snapshot` so the existing-thread path can update safely without changing the RPC signature
- Live validation:
  - applied on Supabase project `vevnoxlgwisdottaifdn`
  - live Postgres logs previously showed the exact ambiguity error on `get_or_create_conversation`; the function definition is now aligned with the fixed parameter qualification
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-13, community feed expansion after featured cards)

- Adjusted the public `/community` page so it no longer feels artificially limited to two visible posts.
- Root cause:
  - `CommunityPage` fetched paginated feed data through `usePosts`
  - but the UI only rendered `slice(0, 2)` for featured cards and `slice(2, 4)` for the second section, silently dropping the rest of the already-fetched feed
  - the hook already exposed `hasNextPage` / `fetchNextPage`, but the page had no visible continuation control
- Implemented the lighter-weight hybrid fix instead of a full feed redesign:
  - kept the first two posts as featured discussion cards
  - expanded the second section to render all remaining loaded posts via `slice(2)`
  - changed that second section to use an adaptive layout: short feeds with only `1-2` remaining posts now stretch across the full width as a grid, while longer feeds switch to a horizontal content rail
  - added a visible `Xem thêm bài viết` CTA that calls the existing infinite-query `fetchNextPage`
- Also normalized several mojibake / irregular-whitespace lines touched by the page so lint can pass on the file cleanly.
- Regression coverage:
  - `packages/web/src/pages/CommunityPage.test.tsx` now verifies the page still uses real author avatars on the featured/community-author surfaces
  - the same test file now verifies short latest-post lists stay full-width instead of collapsing into a left-aligned rail, and that the load-more CTA calls `fetchNextPage`
- Latest validation:
  - `npx eslint packages/web/src/pages/CommunityPage.tsx packages/web/src/pages/CommunityPage.test.tsx`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/CommunityPage.test.tsx`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-13, community author avatar source fix)

- Investigated the community report where the public `/community` feed showed non-real author avatars and no premium ring on featured discussion cards.
- Root cause:
  - the community data services already return `author.avatar` and `author.isPremium` from `users.avatar_url` / `users.is_premium`
  - `packages/web/src/pages/CommunityPage.tsx` still had stale presentation-only avatar paths using `stitchAssets.community.discussionAvatars` and `stitchAssets.community.contributors`
  - those stale paths bypassed `PremiumAvatar`, so both the real avatar and premium ring were lost on those surfaces
- Fixed the page-level render paths:
  - featured discussion cards now use live author avatar data with `PremiumAvatar`
  - sidebar `Thành viên tích cực` cards now use live author avatar data with `PremiumAvatar`
  - missing-avatar fallback now uses author initials instead of static art
- Live data verification:
  - queried the reported post `Chào mọi ngườiii` on Supabase project `vevnoxlgwisdottaifdn`
  - confirmed the author already has a real `avatar_url`
  - confirmed the same author currently has `users.is_premium = false` and no active subscription, so the missing premium ring on that specific post was expected from current data
- Regression coverage:
  - added `packages/web/src/pages/CommunityPage.test.tsx` to assert featured/community contributor avatars come from author data instead of static Stitch avatar assets
- Latest validation:
  - `npx eslint packages/web/src/pages/CommunityPage.tsx packages/web/src/pages/CommunityPage.test.tsx`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/CommunityPage.test.tsx`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-13, staging demo user profile refresh)

- Replaced the obviously fake staging/demo user identities in the live `public.users` dataset with deterministic Vietnamese-looking personas instead of leaving `Chu nha Demo xx` / `Sinh vien Demo xxx` visible across room, roommate, and messaging surfaces.
- Live data refresh:
  - applied migration `20260413102410_refresh_staging_demo_user_profiles` on Supabase project `vevnoxlgwisdottaifdn`
  - refreshed all `125` `staging_demo` users (`24` landlords, `100` students, `1` admin)
  - `full_name`, `email`, `phone`, `avatar_url`, and `bio` now look realistic while staying safely scoped to records marked with `preferences.seed_group = 'staging_demo'`
  - no matching records exist in `auth.users`, so this pass only touched app-domain display data in `public.users`
- Seed-source alignment:
  - [supabase/seeds/staging_demo.sql](/e:/RoomZ/roomz-ui/supabase/seeds/staging_demo.sql) now generates deterministic Vietnamese identities, realistic bios, safer `example.com` email addresses, and persona avatars for demo users
  - the user inserts in that seed now use `ON CONFLICT ... DO UPDATE` so rerunning the staging seed refreshes existing demo users instead of preserving stale fake names
  - local migration source is tracked in [supabase/migrations/20260413102410_refresh_staging_demo_user_profiles.sql](/e:/RoomZ/roomz-ui/supabase/migrations/20260413102410_refresh_staging_demo_user_profiles.sql)
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - direct SQL verification on `vevnoxlgwisdottaifdn`: `old_demo_emails = 0`, `old_demo_names = 0`, `staging_total = 125`
  - direct SQL spot check confirms refreshed rows such as `Bùi Anh Khoa`, `Bùi Đức Huy`, `Đặng Khánh Uyên`, with `seed_profile_style = 'vn_realistic'`

## Latest Update (2026-04-13, premium avatar review follow-up batch)

- Closed the remaining review findings around premium-avatar coverage instead of leaving the implementation split between UI-only fixes and stale data paths.
- Shared avatar contract + live surfaces:
  - `packages/web/src/components/ui/PremiumAvatar.tsx` now keeps the premium branch compiling cleanly, preserves wrapper sizing, and passes caller styling through the inner avatar path where it matters
  - host legacy messaging and swap/sublet surfaces now render `PremiumAvatar` on the live user-avatar paths that were still plain before this batch
- Data-path and backend alignment:
  - `packages/shared/src/services/messages.ts`, `packages/web/src/hooks/useMessages.ts`, and `packages/web/src/pages/LandlordDashboardPage.tsx` now carry `is_premium` through the legacy host messaging flow
  - `packages/web/src/services/sublets.ts`, `packages/web/src/services/swap.ts`, and `packages/shared/src/types/swap.ts` now carry `is_premium` through the swap/sublet request and application flows
  - new migration `supabase/migrations/20260413153000_add_landlord_is_premium_to_search_rooms.sql` adds `landlord_is_premium` to `search_rooms`, so landlord avatar metadata stays available on the RPC path instead of only on room detail fetches
  - `packages/shared/src/services/rooms.ts`, `packages/shared/src/types/database.ts`, and `packages/shared/src/services/database.types.ts` now map that RPC field into the shared room contract
  - `packages/shared/src/services/reviews.ts` now re-selects `user:users(..., is_premium)` on update, so edited reviews do not lose reviewer premium metadata until a later refetch
- Live rollout status:
  - applied on Supabase project `vevnoxlgwisdottaifdn`
  - direct SQL verification confirms `public.search_rooms(...)` now includes `landlord_is_premium` in the return contract and selects `u.is_premium AS landlord_is_premium`
  - migration history was aligned to the local repo version `20260413153000 / add_landlord_is_premium_to_search_rooms` so future migration runs should not see a synthetic version drift
- Regression coverage:
  - `packages/web/src/components/ui/PremiumAvatar.test.tsx`
  - `packages/web/src/services/rooms.shared.test.ts`
  - `packages/web/src/services/reviews.shared.test.ts`
- Latest validation:
  - `npx eslint packages/shared/src/services/messages.ts packages/web/src/hooks/useMessages.ts packages/web/src/pages/LandlordDashboardPage.tsx packages/shared/src/types/swap.ts packages/web/src/services/sublets.ts packages/web/src/services/swap.ts packages/web/src/components/swap/SubletCard.tsx packages/web/src/components/swap/SwapRequestCard.tsx packages/web/src/pages/SubletApplicationsPage.tsx packages/web/src/pages/SwapRoomPage.tsx packages/web/src/components/ui/PremiumAvatar.tsx packages/web/src/components/ui/PremiumAvatar.test.tsx packages/shared/src/services/rooms.ts packages/shared/src/types/database.ts packages/shared/src/services/database.types.ts packages/shared/src/services/reviews.ts packages/web/src/services/rooms.shared.test.ts packages/web/src/services/reviews.shared.test.ts`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/components/ui/PremiumAvatar.test.tsx src/services/rooms.shared.test.ts src/services/reviews.shared.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run build --workspace=@roomz/web`: pass
- Known remaining gap:
  - `SwapMatchesPage` / potential-match surfaces were not expanded in this batch because they were outside the approved swap/sublet worker scope

## Latest Update (2026-04-13, host legacy messaging premium avatars)

- Patched the remaining live host-dashboard and legacy messaging surfaces that were still dropping premium metadata or rendering plain avatars:
  - the shared legacy messaging service now selects `is_premium` for conversation participants and message senders
  - the `useMessages` hook preserves `is_premium` on the optimistic sender payload so local send behavior stays consistent with the fetched data shape
  - the host dashboard now renders `PremiumAvatar` for the booking queue avatar plus both visible conversation avatars in the messages tab
- Scope stayed inside the allowed messaging path files:
  - `packages/shared/src/services/messages.ts`
  - `packages/web/src/hooks/useMessages.ts`
  - `packages/web/src/pages/LandlordDashboardPage.tsx`
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - `npx eslint packages/shared/src/services/messages.ts packages/web/src/hooks/useMessages.ts packages/web/src/pages/LandlordDashboardPage.tsx`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- Tests:
  - no new test file was added because there was no nearby messaging-specific test pattern inside the approved scope

## Latest Update (2026-04-13, swap/sublet premium avatar surface fix)

- Closed the remaining premium-avatar gaps on the live swap/sublet routes and aligned the shared avatar primitive with the existing premium-ring contract.
- Data-path updates now propagate `is_premium` into the swap/sublet reads that feed the live cards and request lists:
  - `packages/web/src/services/sublets.ts` now returns `is_premium` for sublet applicants
  - `packages/web/src/services/swap.ts` now returns `is_premium` for swap request requesters and recipients
  - `packages/shared/src/types/swap.ts` now reflects the premium metadata on `SwapRequest` and `SubletApplication` joined user objects
- Live route updates now render `PremiumAvatar` instead of plain `img` / `Avatar` on real-user avatar surfaces:
  - `packages/web/src/components/swap/SubletCard.tsx`
  - `packages/web/src/components/swap/SwapRequestCard.tsx`
  - `packages/web/src/pages/SubletApplicationsPage.tsx`
  - `packages/web/src/pages/SwapRoomPage.tsx`
- The shared avatar primitive was also corrected so the premium branch builds cleanly and preserves the className contract for both wrapper and inner avatar.
- Added a regression assertion in `packages/web/src/components/ui/PremiumAvatar.test.tsx` to cover the premium branch className contract.
- Latest validation:
  - `npx eslint packages/web/src/components/ui/PremiumAvatar.tsx packages/web/src/components/ui/PremiumAvatar.test.tsx packages/web/src/services/sublets.ts packages/web/src/services/swap.ts packages/web/src/components/swap/SubletCard.tsx packages/web/src/components/swap/SwapRequestCard.tsx packages/web/src/pages/SubletApplicationsPage.tsx packages/web/src/pages/SwapRoomPage.tsx packages/shared/src/types/swap.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run build --workspace=@roomz/web`: pass

## Latest Update (2026-04-13, room contact UTC reset alignment)

- Aligned the backend room phone-reveal quota contract with the UTC-based roommate quota model instead of leaving phone views on a timezone-dependent `CURRENT_DATE` boundary.
- Added migration `supabase/migrations/20260413133000_align_room_contact_daily_reset_to_utc.sql`:
  - `public.get_room_contact(uuid)` now counts `phone_number_views` inside an explicit UTC day window
  - free and premium limits remain unchanged at `3/day` and `100/day`
  - masked/unmasked reveal behavior is unchanged outside the day-boundary fix
- Added coverage for the room-contact service contract:
  - `packages/web/src/services/rooms.shared.test.ts` now verifies the `get_room_contact` RPC mapping alongside the existing shared room-search coverage
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/services/rooms.shared.test.ts`: pass
  - `npx eslint packages/web/src/services/rooms.shared.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- Live rollout status:
  - applied live on Supabase project `vevnoxlgwisdottaifdn` with `supabase db query --linked` because the repo-root `.env.local` BOM still blocks normal linked CLI runs unless a temporary workdir is used
  - direct SQL verification confirms `public.get_room_contact(uuid)` now uses the explicit UTC window and checks premium status against `plan = 'rommz_plus'`
  - direct SQL verification confirms `supabase_migrations.schema_migrations.version = 20260413133000` with name `align_room_contact_daily_reset_to_utc`

## Latest Update (2026-04-13, daily limit rollover refresh)

- Fixed two stale client-side quota surfaces that could look "stuck" after a new day started even though the backend reset logic had already rolled over:
  - roommate free-tier limits now refresh when the UTC day changes instead of waiting for a later incidental refetch
  - the room phone-reveal CTA no longer stays trapped in the masked-result branch after a day rollover if the page remains open
- Added a shared UTC rollover helper for the web package:
  - `packages/web/src/utils/dailyReset.ts` now centralizes UTC date keys and the delay until the next UTC midnight
  - the helper is used by both roommate limits and the phone reveal flow so rollover timing stays consistent across both features
- Roommate limit UI is now resilient across midnight and tab lifecycle edges:
  - `packages/web/src/hooks/useRoommatesQuery.ts` now remembers the last successful limit-sync UTC date
  - active roommate limit queries now invalidate on the next UTC midnight, on window focus, and on visibility restore if the cached day is stale
  - this prevents `canViewMore` and the limit bar from blocking a newly reset day with yesterday's cached values
- Phone reveal now recovers without a full page reload:
  - `packages/web/src/components/PhoneRevealButton.tsx` stores the UTC day for masked responses
  - masked phone state now clears on the next UTC day rollover or when the user returns to the tab after rollover, so the normal reveal action becomes available again
- Added regression coverage:
  - `packages/web/src/utils/dailyReset.test.ts` covers the UTC rollover helper contract
  - `packages/web/src/components/PhoneRevealButton.test.tsx` covers clearing stale masked phone state after the day changes
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - `npx eslint packages/web/src/hooks/useRoommatesQuery.ts packages/web/src/components/PhoneRevealButton.tsx packages/web/src/components/PhoneRevealButton.test.tsx packages/web/src/utils/dailyReset.ts packages/web/src/utils/dailyReset.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/components/PhoneRevealButton.test.tsx src/utils/dailyReset.test.ts src/services/roommates.test.ts`: pass

## Latest Update (2026-04-12, user avatar storage bucket)

- Fixed the live backend gap behind the new profile-avatar UI:
  - the Supabase project `vevnoxlgwisdottaifdn` was missing the `user-avatars` bucket entirely, so avatar uploads failed with `StorageApiError: Bucket not found`
  - new migration `supabase/migrations/20260412170000_add_user_avatar_storage_bucket.sql` now creates or normalizes the `user-avatars` bucket as a public image bucket with a `5 MB` limit and allowed mime types `jpeg/png/webp/jpg`
- Added storage policies that match the current client upload contract instead of copying the room-image folder policy blindly:
  - avatar files are currently stored as `${userId}.${ext}`, so insert/update/delete policies validate ownership via `split_part(name, '.', 1) = auth.uid()`
  - public read access is enabled for `user-avatars`, matching the current use of public avatar URLs across the app
- Applied the migration directly to the live Supabase project:
  - bucket verification now returns `user-avatars` with `public = true`, `file_size_limit = 5242880`, and the expected mime whitelist
  - storage policy verification now shows `User avatars public read`, `Users can upload own avatar`, `Users can update own avatar`, and `Users can delete own avatar`
- Latest validation:
  - direct SQL verification on `vevnoxlgwisdottaifdn`: pass, bucket `user-avatars` exists with expected config
  - direct SQL verification on `vevnoxlgwisdottaifdn`: pass, avatar storage policies exist and target `user-avatars`
  - `npx ai-devkit@latest lint`: pass
  - Supabase security advisors still report multiple pre-existing unrelated warnings; no new avatar-bucket-specific warning was introduced

## Latest Update (2026-04-12, profile avatar upload)

- Completed the missing avatar-edit path in the existing profile flow instead of leaving `Thay đổi ảnh` as a disabled placeholder:
  - `packages/web/src/components/modals/ProfileEditModal.tsx` now supports image picking, local preview, validation feedback, reset-to-current-avatar, and upload on save
  - the modal keeps avatar persistence inside the same save flow as the rest of the profile form, so the user does not end up with a partially updated profile state
- Added a dedicated avatar upload helper for the web package:
  - `packages/web/src/services/profile.ts` now compresses avatar uploads toward a `webp` target before sending them to Supabase Storage
  - uploaded avatar URLs now receive a cache-busting query suffix so the profile surface does not keep showing a stale image after an upsert to the same storage path
  - upload errors now map to user-facing messages for missing storage permission or bucket configuration
- Added regression coverage for the new profile helpers:
  - `packages/web/src/services/profile.utils.ts` centralizes avatar validation and profile update payload shaping
  - `packages/web/src/services/profile.test.ts` now covers supported avatar file types, max-size rejection, and `avatar_url` persistence in the update payload
- Latest validation:
  - `npx eslint packages/web/src/components/modals/ProfileEditModal.tsx packages/web/src/services/profile.ts packages/web/src/services/profile.utils.ts packages/web/src/services/profile.test.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npx playwright test --config ./playwright.unit.config.ts src/services/profile.test.ts` in `packages/web`: pass

## Latest Update (2026-04-12, ROMI tool-loop investigation)

- Investigated live ROMI incident data directly from `ai_chat_sessions`, `ai_chat_messages`, and `analytics_events` for the latest broken sessions instead of assuming the repeated `search_locations` / `search_deals` replies were just UI rendering noise:
  - session `67d7eec2-ac25-42dd-8692-786eebe30a8f` stored an assistant turn with `functionCalls.length = 34`, all `search_locations`, and the user-visible content was the raw fallback aggregation `Kết quả 1...Kết quả 34...`
  - session `092c9fba-274b-4c97-a896-b222aa05804f` showed the same failure mode for `search_deals`, proving the issue was tool-loop fallback hardening, not a single location-search edge case
  - live telemetry also showed `selected_tools = ["search_locations"]` for the `"ngáo à?"` turn, while the current local planner does not select tools that way, which strongly indicates the deployed Supabase edge function is behind the repo code
- Hardened the local ROMI code against the exact failure pattern:
  - `packages/shared/src/services/ai-chatbot/intake.ts` no longer keeps forcing `room_search` for short meta reactions with no room cue just because the previous journey goal was `find_room`
  - the same intake layer now repairs likely UTF-8 mojibake before Vietnamese normalization, so accented prompts still classify correctly even if an upstream layer mangles text into sequences like `tÃ´i muá»‘n...`
  - room-search follow-up hints now use word-boundaried matching, preventing short complaint text like `ngáo à?` from accidentally matching the `ga` token inside `ngao`
  - `supabase/functions/ai-chatbot/index.ts` now caches identical tool executions within a single request and deduplicates identical tool results before fallback formatting, metadata persistence, action building, and telemetry fan-out
  - new helper `supabase/functions/ai-chatbot/tool-result-utils.ts` centralizes exact tool-result deduplication so ROMI cannot dump the same result dozens of times into the final assistant message
- Live deployment + verification:
  - redeployed `supabase/functions/ai-chatbot` to project `vevnoxlgwisdottaifdn` with `npx supabase@2.84.2 functions deploy ai-chatbot --project-ref vevnoxlgwisdottaifdn --no-verify-jwt`
  - used a temporary workdir with junctions to `supabase/` and `packages/` because the repo-root `.env.local` currently has a UTF-8 BOM and Supabase CLI fails early if it parses that file directly
  - production stream smoke verification now passes for the previously broken room flow:
    - `tôi muốn tìm phòng ở thủ đức dưới 5 triêu` => `intent = room_search`, tool `search_rooms`
    - `phòng số 2 đi` => `intent = room_detail`, tool `get_room_details`, `selection.resolvedFrom = ordinal`
    - `ngáo à?` => `intent = general`, no tool calls, so the old repeated-tool failure path is no longer reachable from that complaint turn
- Latest validation:
  - `npm run test:unit --workspace=@roomz/web -- src/services/romi.test.ts`: pass
  - `deno test supabase/functions/ai-chatbot/planner_test.ts supabase/functions/ai-chatbot/tool-result-utils_test.ts`: pass
  - `deno check supabase/functions/ai-chatbot/index.ts`: pass
  - `npm run build --workspace=@roomz/web`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-12, community counter sync)

- Fixed the `/community` like/comment counter drift across feed cards and the post-detail modal instead of treating it as a single stale-label bug:
  - community cache updates now sync `feed`, `detail`, and `topPosts` query data together for like toggles and comment mutations
  - `/community` now tracks `selectedPostId` and resolves the modal from live query data instead of freezing a copied `selectedPost` snapshot
  - single-post fetches now hydrate the viewer-specific `liked` state so the modal no longer loses heart-state parity with the feed
- Added and applied the missing database-side counter sync contract for persisted aggregates:
  - migration `20260412093000_sync_community_post_counters.sql` now adds counter refresh functions, sync triggers, and backfill logic for `community_posts.likes_count` and `community_posts.comments_count`
  - the live Supabase project `vevnoxlgwisdottaifdn` now runs only the new sync triggers on `community_likes` and `community_comments`; legacy increment/decrement triggers were dropped so counters no longer drift after insert/delete ordering
  - migration version `20260412093000` is now present in `supabase_migrations.schema_migrations`, so future Supabase CLI runs should treat it as already applied
  - new indexes now support the trigger-side recount path on `community_likes.post_id` and `community_comments(post_id, status)`
- Fixed the unrelated build blocker uncovered during the community pass:
  - `/services` and `/support-services` now route `"voucher"` partners through voucher-aware flows instead of passing them into the service-request modal path that only accepts `ServiceRequestMode`
  - `npm run build --workspace=@roomz/web` no longer fails on the `"voucher"` union mismatch in `ServicesHubPage.tsx` and `SupportServicesPage.tsx`
- Added regression coverage for the cache-sync layer:
  - new unit test `packages/web/src/hooks/useCommunityCache.test.ts` verifies feed/list/detail cache updates for likes and comments
- Latest validation:
  - `npx eslint packages/web/src/hooks/useCommunity.ts packages/web/src/hooks/useCommunityCache.ts packages/web/src/hooks/useCommunityCache.test.ts packages/web/src/services/community.ts packages/web/src/pages/CommunityPage.tsx`: pass
  - `npx eslint packages/web/src/pages/ServicesHubPage.tsx packages/web/src/pages/SupportServicesPage.tsx`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/hooks/useCommunityCache.test.ts src/services/community.shared.test.ts`: pass
  - `npm run test:e2e --workspace=@roomz/web -- community.spec.ts`: pass
  - direct SQL verification on `vevnoxlgwisdottaifdn`: pass, only `sync_community_post_counters_from_likes` and `sync_community_post_counters_from_comments` remain active, counter mismatches = `0`, `schema_migrations.version = 20260412093000` is present
  - `npm run build --workspace=@roomz/web`: pass
  - `npx ai-devkit@latest lint`: pass

## Latest Update (2026-04-11, services area bugfixes)

- Stabilized the services-area booking experience across `/services`, `/support-services`, partner detail modals, admin leads, and profile settings instead of treating each bug as an isolated patch:
  - resident testimonial stars on `/services` now render the correct `Star` icon instead of the incorrect gift icon
  - the hero `Xem voucher` CTA now disables cleanly and explains the empty-deals state instead of silently doing nothing
  - partner booking no longer ejects the user back to the generic catalog; booking now stays aligned to the selected partner and service type
- Service booking flows are now more complete and trustworthy:
  - moving leads now submit the admin-facing detail fields that were previously always missing, including floors, elevator flags, item list, and contact phone
  - cleaning pricing now reacts to cleaning type, room count, bathroom count, and add-ons instead of showing a static total
  - student discounts now appear only for verified student profiles in both moving and cleaning flows
  - the narrow-screen cleaning modal layout was rebuilt so service-type choices wrap responsively instead of colliding into each other
- Missing service-request coverage is now implemented:
  - `repair`, `laundry`, and `setup` requests now open a real request modal and create service leads instead of falling back to the hardcoded `SetupCare` chat drawer
  - support leads now carry category-aware details so admin views can distinguish repair vs laundry requests
- Partner, voucher, admin, and settings surfaces were tightened:
  - partner detail now fetches and displays real review rows, plus an explicit empty state when no reviews exist
  - voucher detail now shows an invalid-code state instead of rendering a meaningless empty QR payload
  - admin notes now use the signed-in admin identity instead of the hardcoded string `Admin`
  - admin lead stats now include `confirmed`, and admins can mark a lead as `cancelled`
  - profile settings now let users jump into profile editing when a phone number is missing instead of dead-ending on a disabled button
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - `npx eslint packages/web/src/pages/ServicesHubPage.tsx packages/web/src/pages/SupportServicesPage.tsx packages/web/src/pages/admin/ServiceLeadsPage.tsx packages/web/src/pages/profile/components/SettingsTab.tsx packages/web/src/components/modals/BookMovingModal.tsx packages/web/src/components/modals/CleaningScheduleModal.tsx packages/web/src/components/modals/PartnerDetailModal.tsx packages/web/src/components/modals/ShopDetailModal.tsx packages/web/src/components/modals/ServiceRequestModal.tsx packages/web/src/components/modals/serviceBookingPricing.ts packages/web/src/components/modals/serviceBookingPricing.test.ts packages/web/src/components/modals/serviceRequestRouting.ts`: pass
  - `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/components/modals/serviceBookingPricing.test.ts`: pass
  - `npm run build --workspace=@roomz/web`: pass

## Latest Update (2026-04-11, live DB cleanup)

- Cleaned mixed demo/test catalog data directly in live Supabase project `vevnoxlgwisdottaifdn` while preserving a user-approved whitelist of `30` admin-visible rooms from screenshot review.
- Partner cleanup now removes the room-photo placeholder cluster:
  - deleted `50` partners whose avatar used the same room-photo image family
  - deleted `112` linked service leads first so partner deletion stayed referentially clean
  - partner deletion then cascaded `14` deals and `10` reviews
- Room cleanup now keeps only the whitelisted room set:
  - deleted `283` non-whitelisted rooms
  - room deletion cascaded `576` room images, `282` room amenities, `110` favorites, `48` bookings, `34` reviews, `6` phone-number views, `1` sublet listing, and `2` sublet applications
  - `2` conversations lost room context through the FK `SET NULL` path instead of being deleted
- Current post-cleanup volume:
  - `rooms = 30`
  - `partners = 26`
  - `service_leads = 41`
- Latest validation:
  - direct SQL verification confirms `remaining_partners_with_target_image = 0`
  - direct SQL verification confirms `remaining_rooms = 30`
  - direct SQL verification confirms `remaining_service_leads_with_missing_partner = 0`

## Latest Update (2026-04-11, ROMI stabilization)

- Stabilized ROMI follow-up routing across edge, web, and mobile instead of continuing prompt-by-prompt fixes:
  - edge routing now goes through a single planner that decides `primary intent`, `turn mode`, `target entity`, and allowed tools for each turn
  - `journey_state` now stores active entity memory plus ordered shortlist IDs so follow-up turns like `phòng số 2`, explicit UUIDs, and `chi tiết phòng đó` resolve deterministically
  - resolved detail turns for room, deal, and partner flows no longer fall back into a fresh shortlist reply
- Search correctness is improved for non-room catalogs:
  - `search_partners` and `search_deals` now filter and sort active rows before slicing to the requested limit
  - new `get_partner_details` and `get_deal_details` tools bring `list -> select -> detail` parity beyond rooms
- Guest and client parity are tightened:
  - guest rate limiting is now backed by Postgres minute buckets keyed by hashed request fingerprints instead of process memory
  - web and mobile now share the same ROMI workspace reducer and stream-event contract from `packages/shared`
  - mobile guest mode is now first-class and renders clarification, handoff, and action CTA metadata instead of flattening everything into plain text
- ROMI telemetry is cleaner:
  - `/romi` route-open tracking stays on `romi_opened`
  - launcher clicks now use a separate `romi_launcher_clicked` event
  - selection follow-up success and failure now emit dedicated analytics events
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - `deno test supabase/functions/ai-chatbot/viewer-mode_test.ts supabase/functions/ai-chatbot/planner_test.ts supabase/functions/ai-chatbot/guest-rate-limit_test.ts supabase/functions/ai-chatbot/catalog-search_test.ts`: pass
  - `deno check supabase/functions/ai-chatbot/index.ts`: pass
  - `npm run typecheck --workspace=@roomz/shared`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/romi/reducer.test.ts src/pages/romi/sessionSelection.test.ts src/services/romi.test.ts`: pass
  - `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `npm run build --workspace=@roomz/web`: pass
  - `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`: pass
  - `npx tsc -p packages/mobile/tsconfig.json --noEmit`: fail on the pre-existing missing type definition `mapbox__point-geometry`

## Latest Update (2026-04-11, ROMI bugfixes)

- Fixed a ROMI chatbot bug bundle across `/romi` and `supabase/functions/ai-chatbot`:
  - authenticated callers can no longer force `guest` mode when a valid user token is present, so ROMI now always uses the authenticated persistence + rate-limit path for signed-in requests
  - `/romi` now clears stale clarification and handoff cards when the next turn resolves them instead of keeping the old follow-up banner pinned under the composer
  - switching saved ROMI sessions now blanks the prior thread immediately while hydration runs, so the new session title does not momentarily sit above the previous conversation history
  - ROMI stream failures now replace the assistant placeholder with an error bubble instead of leaving a stuck “still composing” state in the thread
  - the session history rail no longer renders a `button` inside another `button`; rows are now keyboard-accessible wrappers with a separate delete button
- Added regression coverage for the ROMI fixes:
  - new Deno helper test `supabase/functions/ai-chatbot/viewer-mode_test.ts`
  - expanded reducer tests in `packages/web/src/pages/romi/reducer.test.ts`
  - expanded browser coverage in `packages/web/tests/e2e/romi.spec.ts` for clarification reset and stream-failure recovery
- Latest validation:
  - `deno test supabase/functions/ai-chatbot/viewer-mode_test.ts`: pass
  - `deno check supabase/functions/ai-chatbot/index.ts`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/romi/reducer.test.ts src/pages/romi/sessionSelection.test.ts`: pass
  - `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`: pass
  - `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `npm run build --workspace=@roomz/web`: pass

## Latest Update (2026-04-11)

- Fixed an admin room-editor close race on `/admin/rooms`:
  - after a successful save, the room editor drawer no longer reopens itself from the stale `focus` query-param handshake
  - the reopen loop came from the auto-open effect in `RoomsPage` observing `selectedRoomForEdit` during close, so a single save could look like it “needed” a second click even though the first mutation had already fired
  - `closeEditor` now clears the `focus` param with `replace: true`, and the focus-driven reopen logic now guards through a ref instead of treating the in-flight close as a fresh deep-link open
- Added regression coverage for the admin flow:
  - new E2E spec `packages/web/tests/e2e/admin-room-editor.spec.ts`
  - new admin mock helper state in `packages/web/tests/e2e/helpers/mockApi.ts` verifies a single save sends one room patch and closes the drawer
- Latest validation:
  - `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `npm run test:e2e --workspace=@roomz/web -- admin-room-editor.spec.ts`: pass
  - `npm run build --workspace=@roomz/web`: pass

## Latest Update (2026-03-27)

- RommZ+ discoverability is now global instead of contextual-only:
  - desktop navbar now includes a top-right `RommZ+` utility pill
  - avatar menu keeps a premium entry as a secondary access point
  - mobile quick access now also exposes the premium route instead of hiding it behind upsell-only flows
- `/payment` remains the canonical premium route and stays visible even when the current user already has an active RommZ+ subscription
- `/romi` has now been rebuilt again as `ROMI v3`, not just the earlier stream-first workspace:
  - `/romi` is public and supports both `guest` and signed-in `user` flows
  - the left rail now branches between guest onboarding and signed-in session history
  - the center rail is reducer-driven and handles streamed chat updates without page-level churn
  - the right rail now focuses on journey summary, clarification prompts, handoff, grounded sources, and next-step actions
- Romi runtime is now stream-first, journey-aware, and partially modularized:
  - shared request/stream contracts now carry `viewerMode`, `entryPoint`, `pageContext`, and `journeyState`
  - the edge function now emits `journey_update`, `clarification_request`, and `handoff` in addition to the earlier stream events
  - guest chats do not persist to DB; signed-in sessions now persist under `experience_version = romi_v3`
- Knowledge-only RAG is now introduced for product knowledge:
  - curated RommZ docs live in shared constants and seed into `romi_knowledge_documents` and `romi_knowledge_chunks`
  - pgvector-backed retrieval is available through `match_romi_knowledge_chunks(...)`
  - onboarding, pricing, policy, verification, roommate, short-stay, and service explanations can now be grounded by curated knowledge sources
  - live room, deal, service, and location answers still stay tool-first instead of being delegated to RAG
- ROMI v3 backend rollout has now been pushed to the live Supabase project:
  - migration `romi_v3_knowledge_rag` is applied on `vevnoxlgwisdottaifdn`
  - `ai-chatbot` edge function is redeployed with the new guest/journey/RAG runtime
  - a direct guest smoke request to the live endpoint now returns a real reply instead of failing on provider fallback
- Romi desktop workspace now contains long threads inside the chat panel:
  - session rail, center chat panel, and context rail each scroll internally on desktop
  - long Romi conversations should no longer stretch the entire `/romi` route downward
- Follow-up utility-surface cleanup is now applied:
  - `/payment` no longer carries the redundant explanatory premium badge in the hero chip row
  - `/romi` now filters meaningless assistant content like `...` from stored history and replaces empty streamed assistant finals with a real fallback sentence instead of rendering dot-only bubbles
  - `/romi` session cards no longer render a nested `button` inside another `button`; the session row now uses a keyboard-accessible `div role="button"` wrapper so React hydration warnings do not fire
- Latest validation:
  - `npm run typecheck --workspace=@roomz/shared`: pass
  - `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`: pass
  - `npm run build --workspace=@roomz/web`: pass

## Latest Update (2026-03-31)

- The hybrid Remotion product-launch ad now has a local preview audio pack instead of staying visual-only:
  - `packages/web/scripts/remotion/generateProductLaunchHybridAudio.ts` now generates a preview voiceover script, a preview bed track, and a preview Vietnamese voiceover asset for the renter-first hybrid ad
  - the preview bed is synthesized directly in Node, so the repo keeps a zero-extra-dependency soundtrack fallback
  - the preview voiceover now prefers `edge-tts` Vietnamese output on this workstation and falls back to local Windows PowerShell speech synthesis only when the online provider is unavailable
  - the active local preview voice is now `vi-VN-HoaiMyNeural`; it is good enough for timing and product review, but still treated as a preview asset rather than guaranteed final delivery
  - generated preview assets now live under `packages/web/public/remotion/audio/` and stay ignored in git except for the folder-level `.gitignore`
- The local hybrid render workflow now prefers generated preview audio automatically:
  - `packages/web/scripts/remotion/renderProductLaunchHybrid.ts` now supports generated-audio attachment before payload build and render
  - `@roomz/web` now exposes `remotion:audio:product` for standalone preview-audio generation
  - `remotion:render:product` now runs with `--use-generated-audio --generate-audio-first` by default
- The hybrid product-launch ad now also has a documented renter-first `v2` storyboard and copy rewrite:
  - `docs/ai/design/feature-remotion-hybrid-product-launch-v2.md` now records the creative thesis, scene takeaways, and rewrite copy for each scene
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.schema.ts` now uses renter-facing Vietnamese copy instead of product-team language like `flow`, `surface`, or `signal`
  - `packages/web/src/remotion/compositions/RommzProductLaunchHybrid.tsx` now uses softer user-facing support labels so the composition reads more like an ad and less like an internal demo
  - the seven-scene runtime and capture pipeline stay unchanged for now; this pass only shifts narrative voice and creative framing
- Latest validation:
  - `npx ai-devkit@latest lint`: pass
  - `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `npm run build --workspace=@roomz/web`: pass
  - `npm run remotion:audio:product --workspace=@roomz/web`: pass
    - provider: `edge-tts`
    - voice: `vi-VN-HoaiMyNeural`
    - output regenerated from the rewritten Vietnamese renter-first copy
  - `npm run remotion:render:product --workspace=@roomz/web`: pass
    - Playwright capture step: `5/5` passed
    - preview audio pack generation: pass
    - hybrid MP4 render with Vietnamese preview audio after the `v2` rewrite: pass

## Latest Update (2026-03-30)

- Started the Remotion ad-render bootstrap for the web workspace:
  - installed local `16:9` video tooling in `@roomz/web` via `remotion`, `@remotion/cli`, `@remotion/bundler`, and `@remotion/renderer`
  - pinned `zod 4.3.6` at the web and workspace-root level so the monorepo Remotion CLI resolves the expected schema version
  - searched and installed the agent skills `remotion-best-practices` and `remotion-render`
  - aligned the future render contract to `API/server action -> normalized serializable ad payload -> Remotion composition props`, with JSON snapshots recommended as reproducible fixtures rather than the source of truth
- Added the first local Remotion brand ad scaffold for RommZ:
  - `packages/web/src/remotion` now contains the entry root, composition root, schema, timeline resolver, and metadata helper for `RommzBrandAd16x9`
  - the first template is a desktop-first `16:9` brand ad that reuses existing RommZ palette, typography, and public assets
  - the template now includes caption-driven voiceover timing plus optional soundtrack ducking and optional voiceover-track attachment
  - `@roomz/web` now exposes local scripts for studio, composition discovery, still rendering, and brand-ad rendering
- Added the local live-payload pipeline for the Remotion brand ad:
  - `packages/web/src/remotion/payloads/buildRommzBrandAdPayload.ts` now maps room, deal, partner, and community signals into serializable `RommzBrandAdProps`
  - `packages/web/scripts/remotion/renderBrandAd.ts` now loads env files, snapshots Supabase data for local use, writes a reproducible payload JSON, and can render either a still or MP4 from that payload
  - the payload builder now keeps compositions pure and falls back to the fixture contract when env or live data is missing
  - the creative mapper now only trusts featured-room location data from known RommZ markets, so noisy DB rows do not degrade the brand-ad headline or hero image
  - targeted unit coverage now exists for the payload builder, and `@roomz/web` now exposes `remotion:payload:brand`, `remotion:still:brand:live`, and `remotion:render:brand:live`
- Added the first hybrid product-launch ad pipeline for RommZ:
  - `packages/web/src/remotion/Root.tsx` now also registers `RommzProductLaunchHybrid16x9`, a renter-first `33s` desktop ad that keeps fake UI as the main visual language and uses deterministic product captures as controlled inserts
  - the new composition stack now lives in:
    - `packages/web/src/remotion/compositions/RommzProductLaunchHybrid.tsx`
    - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.schema.ts`
    - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.timeline.ts`
    - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.metadata.ts`
  - the hybrid payload builder now lives in:
    - `packages/web/src/remotion/payloads/buildRommzProductLaunchHybridPayload.ts`
    - `packages/web/src/remotion/payloads/buildRommzProductLaunchHybridPayload.test.ts`
  - the capture manifest now lives in `packages/web/src/remotion/captures/rommzProductLaunchHybridCaptures.ts`
  - the local helper `packages/web/scripts/remotion/renderProductLaunchHybrid.ts` now owns the local `capture -> payload -> still -> render` flow and fails fast if any required capture is missing
  - deterministic Playwright coverage for the hybrid ad now lives in `packages/web/tests/e2e/remotion-product-launch-capture.spec.ts`
  - the shared E2E mock layer in `packages/web/tests/e2e/helpers/mockApi.ts` now includes renter-auth, payment, services-catalog, search, and Romi-concierge mocks for reusable ad captures
  - v1 capture surfaces are fixed to `/`, `/search`, `/romi`, `/services`, and `/payment`; `/host` is intentionally deferred to a later landlord-focused variant
- Fixed a ROMI session-hydration regression on `/romi`:
  - the initial session list fetch no longer overwrites a freshly selected session via a stale `selectedSessionId` closure
  - the chat viewport no longer swaps the active thread out for loading skeletons when `messagesLoading` flips on while messages are already present
- Applied a follow-up chat-first UX pass on `/romi`:
  - the large intro hero now acts as an empty state and disappears after the first user turn
  - the right-side `Journey / Knowledge đã dùng` rail is no longer shown in the default renter-facing flow
  - clarification and handoff now sit inline near the composer instead of living in a separate side panel
  - the session-history rail now stays hidden until a signed-in user has meaningful history to manage
- User-facing impact:
  - after the first message creates or selects a thread, the user should keep seeing their live conversation instead of a blank skeleton state
  - background hydration can still happen, but it should no longer visually erase the current thread
  - first-turn `/romi` should now feel like a focused chat surface instead of an internal workspace with multiple explanatory panels
- ROMI stability hardening `P0` is now implemented in repo:
  - intake and journey merge now keep valid values unless the new turn explicitly overrides or clears them
  - POI parsing is split from admin-area parsing, so phrases like `gần đại học ... và từ 5 triệu trở xuống` no longer pollute location filters
  - terse budget replies like `5 triệu nha` now fill budget correctly when ROMI just asked for budget
  - room-search orchestration now forces `search_locations` before `search_rooms` when a `poiHint` exists
  - deterministic recovery now follows `exact -> broaden_location -> broaden_budget`, with budget broadening still guarded behind a feature flag
  - signed-in session previews now prefer repaired or resolved journey summaries instead of stale clarification prompts
- ROMI hardening rollout controls now exist in schema and runtime:
  - new table `public.romi_feature_flags` is added in repo
  - default seeded flags are:
    - `romi_normalization_v2 = true`
    - `romi_knowledge_gating_v1 = true`
    - `romi_auto_broaden_v1 = false`
- Follow-up live hardening fixes are now also deployed on top of `P0`:
  - POI parsing no longer carries malformed budget clauses like `và từ 5 triệu trở xuống` into `poiHint`
  - city alias normalization now converts `TP.HCM` into `Thành phố Hồ Chí Minh` before live room search execution
  - terse budget replies in clarification context now keep final metadata on the `room_search` path instead of falling back to `general`
  - live mixed-intent UTF-8 smoke requests now stay search-first and append RommZ+ knowledge after the room answer
  - live `ai-chatbot` is now on function version `51` in project `vevnoxlgwisdottaifdn`
- `/romi` signed-in draft creation is now guarded against session snap-back:
  - clicking `Luồng mới` keeps the user in a fresh draft instead of being immediately reselected into the latest saved thread
  - the session list loader now resolves selection from explicit draft intent rather than re-running on every `selectedSessionId` change
  - regression coverage now exists for fresh-draft session selection on top of the earlier guest and reducer tests
- `/romi` default surface is now stricter chat-first:
  - the large introductory concierge hero is no longer rendered in the main route layout
  - signed-in conversation history has moved behind a `Lịch sử` sheet trigger instead of occupying a persistent side rail
  - first paint now lands directly in the chat workspace for both guest and signed-in users
- Validation:
  - `deno check supabase/functions/ai-chatbot/index.ts`: pass
  - `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/pages/romi/sessionSelection.test.ts`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/remotion/payloads/buildRommzBrandAdPayload.test.ts`: pass
  - `npm run test:unit --workspace=@roomz/web -- src/remotion/payloads/buildRommzProductLaunchHybridPayload.test.ts`: pass
  - `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`: pass
  - `npm run test:e2e --workspace=@roomz/web -- remotion-product-launch-capture.spec.ts`: pass
  - `npm run test:e2e --workspace=@roomz/web -- otp-login.spec.ts search-location.spec.ts services.spec.ts`: pass
  - `npm run typecheck --workspace=@roomz/shared`: pass
  - `npm run build --workspace=@roomz/web`: pass
  - `npx ai-devkit@latest lint`: pass
  - `npm run remotion:compositions --workspace=@roomz/web`: pass (`RommzBrandAd16x9`, `994` frames, `33.13s`)
  - `npm run remotion:still:brand --workspace=@roomz/web`: pass
  - `npm run remotion:payload:brand --workspace=@roomz/web`: pass (`source: database`)
  - `npm run remotion:still:brand:live --workspace=@roomz/web`: pass
  - `npm run remotion:capture:product --workspace=@roomz/web`: pass
  - `npm run remotion:payload:product --workspace=@roomz/web`: pass (`source: captures`)
  - representative hybrid still renders: pass at frames `48`, `240`, `420`, `600`, `780`, `930`
  - full local hybrid MP4 render: pass
  - live UTF-8 smokes:
    - `Tìm phòng gần đại học sư phạm kỹ thuật và từ 5 triệu trở xuống`: pass
    - `5 triệu nha` with budget-clarification context: pass
    - `Tìm phòng ở TP.HCM dưới 5 triệu`: pass
    - `Tìm phòng ở Thủ Đức dưới 5 triệu, với lại RommZ+ có đáng nâng cấp không?`: pass

## Product Surface

### Demand-side pillars

- Room search
- Roommate matching
- Short-stay / sublet / swap
- Services and deals
- Community

### Supply-side pillar

- Host console
- Post room
- Host application / verification workflow

### Platform layer

- Supabase authentication
- Verification
- Premium and payment flows
- Notifications and chat
- Admin quality and moderation

## Current Architecture Notes

- Web router uses React Router in `packages/web/src/router/router.tsx`
- App shell lives in `packages/web/src/router/AppShell.tsx`
- Desktop app shell now includes a dedicated RommZ+ utility pill as a first-class premium entry point
- Global tokens and typography live in `packages/web/src/index.css`
- UI primitives live in `packages/web/src/components/ui`
- Shared Stitch asset registry lives in `packages/web/src/lib/stitchAssets.ts`
- Shared Stitch-first footer lives in `packages/web/src/components/common/StitchFooter.tsx`
- Shared Draftly-like hero layers now live in `packages/web/src/components/common/HeroIllustrationPilot.tsx`
- Shared Romi stream contract now lives in `packages/shared/src/services/ai-chatbot/types.ts`
- Shared Romi stream client now lives in `packages/shared/src/services/ai-chatbot/api.ts`
- Shared Romi intake helpers now live in `packages/shared/src/services/ai-chatbot/intake.ts`
- Shared Romi journey-state helpers now live in `packages/shared/src/services/ai-chatbot/journey.ts`
- Curated Romi knowledge seeds now live in `packages/shared/src/constants/romiKnowledge.ts`
- Stitch typography aliases now resolve globally via `font-display`, `font-headline`, `font-body`, and `font-label`
- Fixed and sticky top shells now use the shared `scroll-lock-shell` utility so Radix `Select` overlays do not shift the navbar when `react-remove-scroll` locks the body
- Global web layout now reserves a stable scrollbar gutter and clears Radix body compensation while scroll-locked, so centered forms no longer jump horizontally when a dropdown opens
- User-facing VND inputs now use the shared `CurrencyInput` helper:
  - inputs display grouped values such as `3.000.000`
  - form state still keeps raw digits so validation and submit payloads remain numeric-safe
- User-facing posting forms now prefer the shared `FormSelectPopover` over raw Radix `Select`:
  - `post-room` basic info step
  - `create-sublet`
  - quick post-listing modal
- The canonical services route is `/services`
- `@roomz/web` now carries the bootstrap Remotion toolchain in devDependencies for future local ad rendering work
- Planned ad-video data flow is `API/server action -> normalized serializable payload -> composition props`; Remotion compositions should not own live server fetching directly
- Remotion entry registration now lives in:
  - `packages/web/src/remotion/index.ts`
  - `packages/web/src/remotion/Root.tsx`
- The first local ad template now lives in:
  - `packages/web/src/remotion/compositions/RommzBrandAd.tsx`
  - `packages/web/src/remotion/compositions/rommzBrandAd.schema.ts`
  - `packages/web/src/remotion/compositions/rommzBrandAd.timeline.ts`
  - `packages/web/src/remotion/compositions/rommzBrandAd.metadata.ts`
- The local live-payload layer for Remotion now lives in:
  - `packages/web/src/remotion/payloads/buildRommzBrandAdPayload.ts`
  - `packages/web/src/remotion/payloads/buildRommzBrandAdPayload.test.ts`
  - `packages/web/scripts/remotion/renderBrandAd.ts`
- The hybrid product-launch Remotion stack now also lives in:
  - `packages/web/src/remotion/captures/rommzProductLaunchHybridCaptures.ts`
  - `packages/web/src/remotion/compositions/RommzProductLaunchHybrid.tsx`
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.schema.ts`
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.timeline.ts`
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.metadata.ts`
  - `packages/web/src/remotion/payloads/buildRommzProductLaunchHybridPayload.ts`
  - `packages/web/src/remotion/payloads/buildRommzProductLaunchHybridPayload.test.ts`
  - `packages/web/scripts/remotion/renderProductLaunchHybrid.ts`
- The local preview-audio layer for the hybrid ad now also lives in:
  - `packages/web/scripts/remotion/generateProductLaunchHybridAudio.ts`
  - `packages/web/public/remotion/audio/.gitignore`
- Deterministic product-capture coverage for Remotion now lives in:
  - `packages/web/tests/e2e/helpers/mockApi.ts`
  - `packages/web/tests/e2e/remotion-product-launch-capture.spec.ts`
- Local Remotion workflow scripts now exist in `packages/web/package.json`:
  - `remotion:studio`
  - `remotion:compositions`
  - `remotion:render`
  - `remotion:render:brand`
  - `remotion:still:brand`
  - `remotion:payload:brand`
  - `remotion:still:brand:live`
  - `remotion:render:brand:live`
  - `remotion:capture:product`
  - `remotion:payload:product`
  - `remotion:still:product`
  - `remotion:render:product`
  - `remotion:audio:product`
- Legacy routes redirect as follows:
  - `/support-services` -> `/services?tab=services`
  - `/local-passport` -> `/services?tab=deals`
  - `/partners` -> `/services?tab=deals`
- Stitch project `17849223603191498901` is the active visual source of truth for the desktop port phase
- `/romi` now uses a stream-first assistant runtime backed by `supabase/functions/ai-chatbot/index.ts`
- Romi knowledge retrieval helpers now live in:
  - `supabase/functions/ai-chatbot/knowledge.ts`
  - `supabase/functions/ai-chatbot/fallback-policy.ts`
  - `supabase/functions/ai-chatbot/response-composer.ts`
- Supabase knowledge schema now extends beyond chat sessions:
  - `ai_chat_sessions.experience_version`
  - `ai_chat_sessions.journey_state`
  - `romi_knowledge_documents`
  - `romi_knowledge_chunks`
  - `romi_feature_flags`
  - `public.match_romi_knowledge_chunks(...)`
- Stitch-first desktop routes now ported in repo:
  - `/` <- `Trang Chủ - Living Atlas`
  - `/login` <- `Đăng Nhập - Living Atlas`
  - `/services` <- `Dịch vụ & Ưu đãi - Living Atlas (Updated)`
  - `/community` <- `Cộng đồng - Living Atlas (Updated)`
  - `/roommates` <- `Tìm Bạn Cùng Phòng - Living Atlas`
  - `/room/:id` <- `Chi Tiết Phòng Trọ - Living Atlas`
- `/search` <- `Tìm Phòng - Living Atlas (Refined)`
- `/profile` <- `Hồ Sơ Cá Nhân - Living Atlas`
- Search route is now ported from the refined Stitch screen `screens/9c747e70493f43e2984e39691cc02b8f`
- `/search` mini-map now keeps the same Mapbox canvas when the room dataset changes through non-empty location switches (for example quick area chips), so the selected-room camera motion stays smooth instead of resetting
- `/search` no longer collapses into a `0 results` empty state while the user is still browsing internal location-catalog suggestions; the previous results and map stay visible until a catalog suggestion is actually chosen
- `/swap` is now ported directly from the generated Stitch screen `screens/354de64324a047a8b1bd6202aa8612de`
- The desktop top navigation now includes `/swap` as `Ở ngắn hạn`
- The `/swap` browse surface now separates `Nhượng phòng` from `Hoán đổi lịch ở` more clearly:
  - the secondary card uses a room fallback instead of an unrelated vehicle image
  - the lower-left swap lane now becomes an onboarding explainer when the user has no own listing, instead of showing a fake progress rail
- `/host` is now ported directly from the generated Stitch screen `screens/fa32671321fa404fa707bcabfd826b4b`
- The Stitch-first host dashboard now preserves live RommZ landlord operations inside the new screen structure:
  - `Tổng quan / Tin đăng / Lịch hẹn / Tin nhắn / Thu nhập` now live inside the same `/host` route
  - booking confirm / reject / complete still reuse the existing landlord booking dialog flow
  - legacy host params like `my-rooms`, `pending`, `confirmed`, `history`, and `bookings` now normalize into the new dashboard tabs
  - legacy booking redirects now land on `/host?tab=appointments`
- Additional host sub-screens are now generated in Stitch for review before any deeper port work:
  - `Tin Đăng Chủ Nhà - Living Atlas` (`screens/bf831f98366f4217858f40c1c875a5f3`)
  - `Lịch Hẹn Chủ Nhà - Living Atlas` (`screens/952507cf8eda45d9a539c71bc3a84581`)
  - `Tin Nhắn Chủ Nhà - Living Atlas` (`screens/cbe4df09b0c8443db3bcc769a09d6572`)
  - `Thu Nhập Chủ Nhà - Living Atlas` (`screens/8f670c28352f404fb0a77b32d1a097b6`)
  - `Đăng Ký Làm Host - Living Atlas` (`screens/25aba97b747244358fbcfbcf6ea03beb`)
 - The shared web shell now exposes supply-side entry points instead of leaving `/host` hidden:
   - landlord accounts see `Chủ nhà` directly in the desktop top navigation
   - the avatar menu now links to `/host` for landlords and `/become-host` for non-landlords
   - the mobile quick-access sheet mirrors the same landlord vs become-host branching
- `/become-host` is now ported directly from the generated Stitch screen `screens/25aba97b747244358fbcfbcf6ea03beb`
- The Stitch-first host-registration route now preserves the live RommZ host-application workflow:
  - pending and rejected application states still reuse the existing product flow instead of a static mock screen
  - successful submission still refreshes auth state and redirects approved landlords toward `/host`
  - users can save a local host-application draft on the current device before submitting
- New UI convention for future work:
  - when a page has a fixed or sticky top shell and also uses Radix `Select`, that shell must include `scroll-lock-shell`
  - for inline user-facing forms and filters, prefer `FormSelectPopover` instead of raw Radix `Select`
  - avoid reintroducing raw modal-style dropdowns for inline filters when a popover/listbox pattern is more appropriate
  - for user-facing money fields in forms, use `packages/web/src/components/ui/currency-input.tsx` instead of raw `type="number"` inputs
- Atlas Plus and admin remain outside the current Stitch-first desktop scope
- Public motion foundation is now active:
  - shared Framer Motion presets live in `packages/web/src/lib/motion.ts`
  - landing, login, services, and community now use reduced-motion-safe reveal, stagger, and hover feedback
- `/community` main feed cards no longer stay invisible at `opacity: 0` after the public-motion pass:
  - the left feed column now keeps a stable motion context
  - the async-fed featured cards and story cards now animate themselves on mount, so slower community responses do not leave invisible but still-clickable cards in the main feed
- Product motion pass is now active:
  - `/search` now animates selected-room focus and supporting side panels instead of swapping them abruptly
  - `/messages` now animates conversation focus and context panels without changing layout height
  - `/host` now animates tab changes and console-surface transitions while preserving the existing top-nav shell
  - mobile mapping remains deferred
- Landing/login hero pilot has been pivoted away from runtime 3D:
  - removed `three`, `@react-three/fiber`, and `@react-three/drei` from `@roomz/web`
  - `/` now uses a layered pre-rendered hero composition with soft parallax instead of a live WebGL scene
  - `/login` now uses the same pre-rendered approach for the sanctuary-side visual
  - reduced-motion safety still applies, but there is no longer a WebGL gate or heavy lazy hero chunk
- Desktop parity is the acceptance target for the current phase; mobile is intentionally deferred
- The global web shell exposes a skip link target via `#main-content`
- `docs/ai/` is initialized and validates with `npx ai-devkit@latest lint`

## Documentation Conventions

- **Project status:** `docs/ai/monitoring/project-status.md`
- **Task execution logs:** `docs/ai/implementation/task-YYYYMMDD-<slug>.md`
- **Feature lifecycle docs:** `docs/ai/{phase}/feature-<name>.md`
- **Drift policy:** code and docs must be updated in the same task

## Installed Supplemental Skills

### Design / system

- `tailwind-design-system`
- `design-system-patterns`
- `ui-typography`
- `ux-principles`
- `accessibility-design-checklist`
- `google-material-design`
- `ui-ux-pro-max`

### Motion / 3D

- `framer-motion-animator`
- `react-three-fiber`
- `threejs-fundamentals`
- `threejs-animation`

### Video / Remotion

- `remotion-best-practices`
- `remotion-render`

### Notes

- The originally planned `material-design-3` repo was inaccessible during install
- `google-material-design` is the current substitute until a better public MD3 skill is selected
- Newly installed skills require a Codex restart before they become available to future sessions

## Review History

### Full Review (2026-02-15)

- Core finding: the web was `du de tin, chua du de nho`
- Strong trust-first fundamentals were present, but visual recall and surface differentiation were weak
- Follow-up backlog was created in `docs/ai/implementation/backlog-20250215-hero-redesign.md`

### Atlas Entry Review (2026-03-21)

- Landing and login moved away from the old warm-neutral shell and into the Living Atlas language
- Global tokens were aligned to lavender off-white surfaces, deep blue primary, amber secondary, and emerald tertiary
- App-surface typography was locked to `Plus Jakarta Sans + Manrope`

### Stitch-First Desktop Port Review (2026-03-21)

- Stitch is now the direct visual source of truth for the ten desktop routes in scope, not just concept inspiration
- Local Playwright parity screenshots were captured for:
  - `/`
  - `/login`
  - `/services`
  - `/community`
  - `/roommates`
  - `/room/5b0888d3-6a90-4d5c-a4da-68873b8280fe`
- Screenshot outputs are stored at `C:\Users\LapHub\AppData\Local\Temp\roomz-playwright-stitch`
- The current result reads as one Stitch-led desktop product rather than a restyled RoomZ shell

### Typography + Breakpoint Stabilization Pass (2026-03-21)

- Stitch HTML was re-checked directly and confirmed the intended type roles are `Plus Jakarta Sans` for headlines and `Manrope` for body and labels
- Global typography and token aliases were patched so direct Stitch class names like `font-label` and `text-on-surface` resolve correctly in repo code
- Landing, login, services, and room detail were rebalanced for the `1024-1440` desktop band after the first user review flagged overflow and cramped composition
- Playwright now reports `Plus Jakarta Sans` as the computed `h1` font on `/`, `/login`, `/services`, and `/room/:id`

### Stitch Parity Bugfix Pass (2026-03-21)

- Landing search now uses dropdown-based controls for location, budget, and room type instead of clipped mixed inputs
- Landing community grid now matches the intended Stitch rhythm by letting the discussion card span the remaining two columns
- Room detail now uses a Stitch-like asymmetrical gallery, counts extra images from real room data only, and renders an inline map component instead of a fake static map card
- Roommates now exposes a real district/city dropdown, readable navigation pills, and a visible primary action button
- Community featured posts now render post imagery instead of text-only cards
- Public branding strings in the web app have been normalized from `RoomZ` to `RommZ`

### Stitch Parity Bugfix Pass 2 (2026-03-21)

- Landing search now pulls from the full province list in `vietnam-locations.ts`, widens the first filter column, and keeps the CTA aligned in the Stitch shell
- Roommate filtering now compresses long city labels like `Thanh pho Ho Chi Minh` to `TP.HCM` so the `Khu vuc` control stays legible in the desktop filter rail
- Community featured cards now support both single-image and multi-image posts; one image renders as a full contained media block, while multiple images switch to a grid with a `+N anh` overlay on the last visible tile
- Services and deals now expand in-place: `Xem toan bo uu dai` reveals the full voucher catalog and a dedicated `Doi tac gan ban` section instead of looking like a no-op
- Login reduced the floating copy card footprint, removed the public admin-login shortcut, and replaced the confusing `Tao ho so` CTA with explanatory account-creation copy

### Stitch Parity Bugfix Pass 3 (2026-03-21)

- Landing moved the `Vi tri` control from a cramped plain select to a searchable popover-combobox, while the trigger now shows a compact city label such as `TP.HCM` for better desktop parity
- Landing budget labels are compacted in the trigger (`2-5tr`, `5-10tr`, `>10tr`) so the hero filter rail reads cleanly without clipping
- Deal category tags on `/services` now use stronger Stitch-style capsule treatment with better contrast, uppercase short labels, and backdrop blur over photography
- Community post detail now supports an inline lightbox: clicking any thumbnail opens a larger viewer with next/previous navigation and a thumbnail strip

### Stitch Parity Bugfix Pass 4 (2026-03-21)

- Landing filter now locks a real minimum width for the `Vi tri` segment and forces all three small labels to stay on one line, preventing the broken stacked label seen in narrow desktop widths

### Stitch Parity Bugfix Pass 5 (2026-03-21)

- Landing `Ngan sach` and `Loai phong` controls no longer use Radix `Select`; both now use the same popover-style trigger pattern as `Vi tri`
- The landing desktop filter rail no longer triggers body scroll lock or scrollbar compensation when opening those two menus, so the fixed navbar no longer shifts horizontally

### Stitch Generation Pass (2026-03-21)

- Generated four additional desktop concept screens in Stitch for the next direct-port phase:
  - `Tìm Phòng - Living Atlas` (`screens/b63e095266a44b1492325b873fc0f635`)
  - `Ở Ngắn Hạn & Đổi Phòng - Living Atlas` (`screens/354de64324a047a8b1bd6202aa8612de`)
  - `Hồ Sơ Cá Nhân - Living Atlas` (`screens/f6a00e6c38db4c7d99603ea8caf51535`)
  - `Bảng Điều Khiển Chủ Nhà - Living Atlas` (`screens/fa32671321fa404fa707bcabfd826b4b`)
- These screens are now the visual review targets before any further desktop port work on `/search`, `/swap`, `/profile`, and `/landlord-dashboard`

### Stitch Search Refinement Pass (2026-03-21)

- Refined the generated search concept to change the first large listing from a disconnected premium editorial card into the selected listing state tied to the mini-map
- New refined Stitch screen:
  - `Tìm Phòng - Living Atlas (Refined)` (`screens/9c747e70493f43e2984e39691cc02b8f`)
- The original search concept (`screens/b63e095266a44b1492325b873fc0f635`) remains available for comparison

### Stitch Search Desktop Port Pass (2026-03-21)

- `/search` now ports directly from the refined Stitch screen `screens/9c747e70493f43e2984e39691cc02b8f`
- The old editorial search shell was replaced with a Stitch-first console, results overview, selected-listing hero card, split map column, and neighborhood insight card
- `MapboxRoomMap` now supports external selected-listing control, price-pill markers, and popup suppression for split-layout usage
- Playwright confirmed that clicking a map marker now swaps the selected listing card and the matching neighborhood insight panel

### Search Interaction Bugfix Pass (2026-03-21)

- `/search` now clears the fixed desktop navbar with explicit top spacing in the refined Stitch-first layout
- Secondary result cards now navigate directly to room detail on the first click instead of first promoting themselves into the selected-listing hero card
- `Xem tren ban do` now re-focuses the selected-listing hero card from deeper scroll positions so users do not need to manually scroll back up after choosing a room from the list
- The split map column now uses the same selected-listing focus flow when a price marker is clicked

### Search Map Focus Pass (2026-03-21)

- `MapboxRoomMap` now supports a `selected-room` viewport mode for search-driven flows
- The compact search mini-map now zooms into the currently selected room instead of fitting every result marker across Vietnam
- The full search map now also opens around the selected room's local context by default, which makes unfiltered nationwide result sets usable without an immediate manual zoom

### Search Map Animation Restore (2026-03-21)

- The search map no longer recreates its Mapbox instance every time the selected room changes
- Marker callbacks are now kept current through refs so selection changes do not force a full map teardown/rebuild
- Smooth `easeTo` camera motion is restored for selected-room transitions on `/search`

### Stitch Profile Desktop Port Pass (2026-03-21)

- `/profile` now ports from the generated Stitch screen `screens/f6a00e6c38db4c7d99603ea8caf51535`
- The old tab-first profile shell was replaced with a Stitch-first two-column dashboard built around the live RommZ auth profile, favorites, bookings, premium state, and roommate matches
- Full favorites, booking management, and account settings remain reachable through detail dialogs so the direct-port layout does not regress existing account flows
- The profile route now maps its location-style panels to the real `users` fields that exist in RoomZ today (`university`, `major`, `graduation_year`, and `role`) instead of assuming extra address fields that are not present in the schema

### Stitch Profile Polish Pass (2026-03-21)

- `/search` now persists the latest preferred search area into a small local storage snapshot so `/profile` can reopen the same search context
- `/profile` now reads that preferred-area snapshot and uses it inside the `Vung tim kiem uu tien` card instead of relying only on static profile-field fallbacks
- The premium upsell card on `/profile` now uses clearer `RommZ+` branding and stronger visual contrast after the live review flagged the old card as unreadable
- Several micro-labels on `/profile` were tightened to reduce overly loose tracking in the Stitch-first port

### Stitch Profile Stability Pass (2026-03-21)

- `/profile` text content was normalized back to valid UTF-8 after a source-encoding drift caused visible mojibake on the protected route
- The global dropdown-menu wrapper now defaults to `modal={false}`, which prevents the avatar profile menu from locking page scroll and shifting the fixed navbar horizontally
- `/profile` now resolves the preferred-area card into a live Mapbox mini-map whenever the stored preferred search area has coordinates, or when coordinates can be recovered from the internal location catalog
- The preferred-area card still falls back to the static Stitch-style placeholder only when no usable coordinates can be inferred from the saved search context
- The premium CTA on `/profile` now opts out of the shared gradient button treatment so the premium-state copy `Xem quyen loi hien co` stays readable against a solid white button background

### Stitch Swap Desktop Port Pass (2026-03-21)

- `/swap` now ports from the generated Stitch screen `screens/354de64324a047a8b1bd6202aa8612de`
- The old short-stay hub shell was replaced with a Stitch-first search console, editorial featured listing card, side utility cards, and lower `Co hoi doi den som` section
- Existing RoomZ flows remain reachable through the new surface:
  - `create-sublet`
  - `my-sublets`
  - `swap-matches`
  - `apply sublet`
  - `swap request`
- The route-local `Sublet` and `Doi phong` tabs now act as lightweight lanes that preserve access to current management flows without breaking the Stitch grammar
- Shared fallback imagery for the swap surface now lives under `stitchAssets.swap`

### Stitch Host Desktop Port Pass (2026-03-22)

- `/host` now ports from the generated Stitch screen `screens/fa32671321fa404fa707bcabfd826b4b`
- The old host dashboard shell was replaced with a Stitch-first landlord console that mirrors the generated screen:
  - four top metrics
  - listing-management card
  - requests queue
  - content-quality panel
  - income snapshot
- The same route now also preserves deeper landlord operations through secondary tabs for listings, appointments, messages, and income instead of dropping the existing RoomZ workflows

### Host Entry Navigation Pass (2026-03-22)

- The web shell now exposes a visible entry to the host surface instead of requiring users to know `/host` manually
- Desktop landlord accounts now see `Chủ nhà` in the primary top navigation
- Authenticated non-landlords now see `Trở thành chủ nhà` in the avatar menu so the supply-side path is discoverable before they qualify for the landlord dashboard
- The mobile quick-access menu now mirrors the same branching (`/host` for landlords, `/become-host` for non-landlords)

### Host Sub-Screen Generation Pass (2026-03-22)

- Generated the landlord tab sub-screens in Stitch so deeper host flows can be reviewed before repo porting
- New review targets:
  - `Tin Đăng Chủ Nhà - Living Atlas` (`screens/bf831f98366f4217858f40c1c875a5f3`)
  - `Lịch Hẹn Chủ Nhà - Living Atlas` (`screens/952507cf8eda45d9a539c71bc3a84581`)
  - `Tin Nhắn Chủ Nhà - Living Atlas` (`screens/cbe4df09b0c8443db3bcc769a09d6572`)
  - `Thu Nhập Chủ Nhà - Living Atlas` (`screens/8f670c28352f404fb0a77b32d1a097b6`)
- Overview remains the existing base screen:
  - `Bảng Điều Khiển Chủ Nhà - Living Atlas` (`screens/fa32671321fa404fa707bcabfd826b4b`)

### Host Registration + Host Shell Rule (2026-03-22)

- Generated the pre-host conversion screen:
  - `Đăng Ký Làm Host - Living Atlas` (`screens/25aba97b747244358fbcfbcf6ea03beb`)
- Implementation rule locked for future host tab ports:
  - the repo must keep the shared host top navbar + horizontal tab bar pattern used by the overview shell
  - if any generated host sub-screen shows a left sidebar in Stitch, treat it as concept drift only
  - do not port a sidebar into the RommZ host implementation unless the product direction changes explicitly

### Become Host Stitch Port (2026-03-22)

- `/become-host` now ports from the generated Stitch screen `screens/25aba97b747244358fbcfbcf6ea03beb`
- The old registration shell was replaced with a Stitch-first host-conversion page:
  - hero and benefit cards now match the reviewed host-registration concept more closely
  - the application form keeps live submission, pending, rejected, and approved-redirect behavior
  - a local draft save path now exists so non-landlord users can resume the host form before submitting

### Host Sub-Screen Port Pass (2026-03-22)

- `/host` now ports the reviewed landlord sub-screen concepts inside the existing top-nav + horizontal-tab shell instead of waiting on separate routes
- The `Tin đăng`, `Lịch hẹn`, `Tin nhắn`, and `Thu nhập` tabs now each have a Stitch-first supporting strip layered on top of the live RoomZ host data:
  - `Tin đăng` adds portfolio mix, listing health, and spotlight cards on top of the real room statuses
  - `Lịch hẹn` adds a host agenda strip with the next-appointment focus and a lightweight booking calendar
  - `Tin nhắn` adds a quick triage lane and selected-conversation focus card without replacing the full inbox route
  - `Thu nhập` adds revenue-health cards while keeping the current income view framed as an estimate from live listings and booking activity
- The host page header now switches title, eyebrow, and body copy with each active tab instead of staying locked to the overview wording

### Messages + Appointments Redesign Pass (2026-03-22)

- `/messages` is now rebuilt as a shared multi-context inbox instead of the older generic split page:
  - the left rail supports search plus filters for all, unread, room-linked, and direct threads
  - the center workspace keeps the active conversation, quick replies, and inline composer in one surface
  - the desktop context rail adapts to the active thread type so room inquiries show listing context while direct threads stay lightweight
  - room-aware host messaging remains intact without forcing every non-host conversation into the same inquiry treatment
- `/host?tab=appointments` has been loosened again after landlord review feedback:
  - the calendar rail is wider so the month view no longer feels squeezed into a decorative side strip
  - a selected-day summary now sits above the grid so hosts can read the current focus without scanning every date cell first

### Messaging Scroll Containment Pass (2026-03-22)

- Fixed a host inbox regression where older messages appeared to disappear:
  - the host `Tin nhắn` preview no longer truncates the thread to the latest 6 messages
  - the host preview lane now uses its own scrollable message area so older bubbles stay reachable
- Fixed the shared `/messages` page so long conversations no longer stretch the entire route vertically:
  - the chat card, rail, and context column now use desktop height constraints with `min-h-0` scroll containers
  - long message content now wraps more defensively instead of forcing the layout wider or taller than intended

### Messaging Layout Normalization Pass (2026-03-23)

- Normalized the shared `/messages` layout after live review feedback that the inbox looked visually awkward:
  - removed the overly rigid full-viewport chat shell in favor of a more natural panel height
  - converted the left rail and right context rail into lighter sticky side panels instead of forcing three heavy full-height columns
  - kept the message list internally scrollable while reducing the “giant empty slab” effect in the center panel
- Normalized the landlord `Tin nhắn` tab so the preview lane reads like a quick console instead of a stretched dashboard void:
  - the preview thread now uses a bounded message viewport with visible history
  - the center panel no longer expands into a large blank block when the selected thread is short

### Messaging Quick-Reply Toggle Pass (2026-03-23)

- Shared `/messages` and `/host?tab=messages` now let users hide or reveal quick-reply chips on demand instead of permanently reserving vertical space for them
- Quick replies now default to the collapsed state so reading space stays larger in both renter and host chat surfaces
- The inline composers still preserve the same quick-reply shortcuts; the suggestions are simply opt-in instead of always-on
- The quick-reply tray now opens as a popover above the composer instead of expanding the page layout:
  - turning suggestions on no longer pushes the chat column downward
  - the surrounding rails and message viewport keep their size while the suggestions are open

### Messaging Stability Pass (2026-03-23)

- Shared `/messages` now wraps long participant emails defensively inside the conversation context card instead of letting them overflow the side rail
- Host messaging in `/host?tab=messages` no longer auto-scrolls to the latest bubble on every passive API refresh:
  - the preview panel now only jumps when the active thread changes or a genuinely new last message arrives
  - passive polling with the same latest message no longer kicks the landlord back to the bottom of the thread

## Audit Baseline (2026-03-21)

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npm run lint --workspace=@roomz/web` after the `/host` sub-screen port pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/host` sub-screen port pass: pass
- `npx ai-devkit@latest lint` after the `/host` sub-screen port pass: pass
- Playwright local preview review: complete for the original six public Stitch-first desktop routes
- Playwright local preview review: complete for `/search`
- Playwright desktop stabilization review: complete for `/`, `/login`, `/services`, and `/room/:id` at `1024`, `1280`, and `1440`
- Stitch source review: complete for the original public six screens, then expanded with generated screens for search, swap, profile, and host
- UX audit: fail, 70 issues
- Accessibility checker: pass, 0 issues
- SEO checker: pass, 0 issues

## Latest Validation Notes (2026-03-22)

- Re-ran `npx ai-devkit@latest lint` via `C:\nvm4w\nodejs\npx.cmd`: pass
- Re-ran `npm run lint --workspace=@roomz/web` via `C:\nvm4w\nodejs\npm.cmd`: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` via `C:\nvm4w\nodejs\npm.cmd`: pass, with existing chunk-size warnings only
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` Stitch port: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` Stitch port: pass, with the same existing chunk-size warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` preferred-area and promo-card polish pass: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` CTA contrast fix: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` CTA contrast fix: pass, with the same existing chunk-size warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` preferred-area and promo-card polish pass: pass, with the same existing chunk-size warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` stability pass: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` stability pass: pass, with the same existing chunk-size warnings
- Re-ran `npx ai-devkit@latest lint` after the `/profile` stability pass: pass
- Re-ran `npm run lint --workspace=@roomz/web` after the `/swap` Stitch port: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/swap` Stitch port: pass, with the same existing chunk-size warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/become-host` Stitch port: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/become-host` Stitch port: pass, with the same existing chunk-size warnings
- Re-ran `npx ai-devkit@latest lint` after the `/become-host` Stitch port: pass
- Captured a CLI Playwright smoke screenshot for `http://127.0.0.1:4181/swap` at `.tmp-swap-preview.png`
- `/profile` now compiles and ships in the Stitch-first desktop bundle, but still needs a live authenticated visual review because anonymous automation sessions redirect away from the account route
- Re-ran Playwright preview checks on `/search`
- Confirmed `/search` now renders the refined Stitch-first console, selected listing card, map column, and neighborhood insight panel
- Confirmed clicking a price marker on `/search` swaps the selected listing card and the insight panel without a full page reload
- Confirmed via Playwright automation that the refined search console now begins below the fixed desktop navbar (`inputTop: 177`, `headerBottom: 73`)
- Confirmed via Playwright automation that clicking the first secondary listing card on `/search` now navigates directly to its detail route on the first click
- Confirmed via Playwright automation that invoking `Xem tren ban do` from the lower results list scrolls the viewport back toward the selected-listing hero region (`scrollY: 2739 -> 337`)
- Confirmed via Playwright screenshot review on rebuilt preview `http://127.0.0.1:4175/search` that the compact split-map now opens around the selected room's local area rather than an all-Vietnam extent
- Confirmed via Playwright canvas-persistence check on rebuilt preview `http://127.0.0.1:4175/search` that the search mini-map keeps the same `.mapboxgl-canvas` node when switching room focus (`sameCanvas: true`)
- Re-ran Playwright preview checks on `/`, `/services`, `/community`, and `/login`
- Confirmed the community featured media card now renders a near-full image block in the live page instead of the earlier clipped strip
- Confirmed `Xem toan bo uu dai` now expands the services page in-place and switches the CTA state to `Thu gon uu dai`
- Confirmed the landing hero filter now shows compact trigger labels while still exposing the full province dataset in the searchable combobox
- Confirmed the services deal tags are now visually stronger in the live `/services` preview
- Confirmed community post detail now exposes a real lightbox viewer for attached images
- Confirmed the landing `Vi tri` label no longer wraps into a broken vertical stack in the live preview
- Confirmed via Playwright runtime inspection that opening the landing `Ngan sach` and `Loai phong` menus keeps `body` at `overflow: visible`, `margin-right: 0px`, and `clientWidth: 1425`, eliminating the earlier scrollbar-induced header shift
- `/roommates` still redirects to `/login` in an unauthenticated session, so this turn's visual check for the roommate filter relied on code review plus lint/build validation rather than a live screenshot

## Latest Validation Notes (2026-03-26)

- Re-ran `npx ai-devkit@latest lint`: pass
- Re-ran `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web`: pass
- The new `HeroIllustrationPilot` entry chunk now builds at roughly `9.4 kB` instead of the earlier heavy lazy WebGL pilot
- Restored accented Vietnamese copy inside the new landing/login layered hero and fixed the landing newsletter `aria-label`
- Manual live review is now required specifically for the new layered heroes on `/` and `/login`
- Current workspace rerun of `npm run build --workspace=@roomz/web` during the community feed fix: fail due unrelated in-progress TypeScript errors in `src/components/common/HeroIllustrationPilot.tsx` and `src/pages/LandingPage.tsx`
- Ran `npm run test:e2e --workspace=@roomz/web -- community.spec.ts`: pass
- Confirmed via Playwright local preview and a delayed mocked community response that `/community` now renders the fetched featured-feed cards visibly instead of leaving the left column blank while the right sidebar still shows

## Latest Validation Notes (2026-03-27)

- Re-ran `npx ai-devkit@latest lint`: pass
- Re-ran `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web`: pass
- Ported `/romi` into the repo as a protected full-page assistant workspace based on the reviewed Stitch concept
- Ported `/payment` into the repo as a Stitch-first RommZ+ pricing page based on the reviewed Stitch concept
- Updated the RommZ+ displayed monthly price from `49.000đ` to `39.000đ` and the quarterly price to `99.000đ`
- Kept `/payment` visible for active premium users instead of hiding the purchase page after activation
- Applied `supabase/migrations/20260327153000_update_rommz_plus_pricing_to_39k.sql` live to project `vevnoxlgwisdottaifdn`
- Verified the live `public.create_checkout_order` function now includes `39000` monthly pricing and `99000` quarterly pricing

## Main Debt

### UX / design debt

- Mobile mapping has not started
- Landing/login layered hero pivot now needs a live subjective review:
  - `/` should feel more cinematic and memorable without making the hero harder to read
  - `/login` should keep the auth form as the primary focus even when the sanctuary accent is visible
  - reduced-motion still needs a manual comfort sanity check on real hardware
- `/profile` still needs a live authenticated visual review against the Stitch concept before it can be considered parity-complete
- `/host` now needs the same authenticated visual review because automation cannot pass the landlord guard
- `/host` tab parity still needs a landlord-side visual review focused on `Tin đăng`, `Lịch hẹn`, and `Tin nhắn` after the latest Stitch-tightening pass
- `/become-host` also needs a live authenticated review with a non-landlord account because anonymous automation cannot validate the protected conversion flow
- `/host` now also needs a landlord-side interaction review for the new month-switching calendar and inline message composer, not just a static parity check
- `/messages` now needs a live review after the multi-context inbox redesign:
  - room-linked conversations should show the correct room card, title, price, and room-detail CTA
  - direct user-to-user conversations should stay lightweight instead of feeling like forced landlord inquiries
  - mobile list/chat switching still needs a manual check after the new inbox layout
- `/host?tab=appointments` now needs a follow-up visual check after widening the calendar rail and adding the selected-day summary so the planner feels less cramped in real use
- `/host?tab=messages` and `/messages` now also need a final overflow / scroll sanity check:
  - host inline inbox should keep older messages accessible instead of truncating to the latest few bubbles
  - long shared inbox threads should scroll inside the chat workspace instead of stretching the whole page
- `/messages` and `/host?tab=messages` now need a quick live comfort check for the new quick-reply toggle:
  - toggling suggestions on should not collapse the composer, stretch the route, or disturb scroll position
  - keeping suggestions hidden should leave materially more room for reading long threads
- `/messages` and `/host?tab=messages` also need a live stability check after the latest bugfix pass:
  - long participant emails should wrap cleanly inside the context rail
  - the landlord preview thread should stay at the user's current scroll position during passive refresh unless a new last message arrives
- The static UX audit remains noisy and still reports 70 issues across the broader web package
- `/romi` still needs a live product review for:
  - session search, delete, and new-chat behavior
  - guest onboarding, login handoff timing, and signed-in session continuity
  - room-context recovery when Romi suggests opening a linked room
  - overall readability of the three-panel assistant layout on real data
- `/payment` still needs a live product review for:
  - pricing consistency between the hero card, billing toggle, and QR checkout modal
  - active-premium behavior where the purchase page remains visible but non-destructive
  - final copy polish and Vietnamese diacritic sanity check on the new Stitch-first page

### Technical / structural debt

- Large Vite chunks still exist, especially around `mapbox-gl` and admin bundles
- Several legacy surfaces outside the Stitch-first scope still need future polish
- Legacy participant-pair conversations remain in the database without room context; only newly opened or reopened host/renter threads now receive `(host, renter, room)` identity
- ROMI still needs a broader transcript-regression suite; current automated coverage is strong on planner/reducer behavior but not yet the full 25-case stabilization corpus
- Mobile workspace type validation is still blocked by the pre-existing missing `mapbox__point-geometry` type definition
- Existing hook warnings remain in:
  - `packages/web/src/hooks/useConfirm.tsx`
  - `packages/web/src/pages/ResetPasswordPage.tsx`
  - `packages/web/src/pages/admin/RevenuePage.tsx`

## Active Roadmap

### Phase 1: Foundation

- Install core UI and 3D skills
- Establish living docs protocol
- Create `feature-roomz-ui-refresh` lifecycle docs
- Refactor initial tokens and primitives
- Launch canonical `/services` hub
- **Status:** complete

### Phase 2: Public flow redesign

- Landing
- Login
- Search
- Room detail
- Profile
- **Status:** complete

### Phase 3: Cross-surface alignment and Stitch-first desktop port

- Roommates
- Community
- Host flows
- Signature visual / hero differentiation pass
- Atlas-heavy design system groundwork
- Stitch-first desktop port for `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`
- Additional Stitch-only concept generation is now complete for pending surfaces:
  - `Trợ Lý AI RommZ - Living Atlas`
    - `projects/17849223603191498901/screens/e14f5d04d8414570bc093fb69cadee64`
  - `Hội Viên RommZ+ - Nâng Tầm Trải Nghiệm`
    - `projects/17849223603191498901/screens/31a73273380244268e5dad5ed8b78b50`
  - `Hỗ trợ trực tuyến - Living Atlas`
    - `projects/17849223603191498901/screens/257d8435d9574a81a93f58b9ba47a10f`
    - generated as an early chatbot draft, but should not be treated as the preferred review source because it skewed too generic-support / Living-Atlas-branded
- **Status:** in progress; `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`, `/search`, `/profile`, `/swap`, `/host`, `/become-host`, `/romi`, and `/payment` are now complete in repo, with RommZ+ discoverability and Romi v2 runtime now added, and authenticated parity review / mobile mapping still remaining
- **Status:** in progress; `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`, `/search`, `/profile`, `/swap`, `/host`, `/become-host`, `/romi`, and `/payment` are now complete in repo, with RommZ+ discoverability and `ROMI v3` guest + knowledge-only-RAG rebuild now added, and live Supabase migration review / authenticated parity review / mobile mapping still remaining
- Latest parity fix:
  - `/services` no longer mixes nearby partner cards into the voucher grid
  - the catalog CTA now reveals either more vouchers or the nearby-partners section based on real data shape
  - `/services` now has dedicated regression coverage for catalog expansion
  - the `/services` expanded catalog no longer renders as a blank white area after toggle; the dynamic cards now bypass the stuck hidden motion state that was keeping loaded content at `opacity: 0`

### Phase 4: Motion + 3D accent

- Add Framer Motion polish only after the Stitch-first desktop shell is approved
- Public-motion foundation is complete for `/`, `/login`, `/services`, and `/community`
- Product-motion pass is complete for `/search`, `/messages`, and `/host`
- Landing/login entry-hero pivot is now complete in repo:
  - runtime Three/R3F scene files have been removed
  - landing/login now use a Draftly-like layered illustration system with soft motion
  - the entry hero no longer depends on WebGL support or a large lazy 3D chunk
- Enforce reduced-motion-safe hero behavior
- **Status:** in progress

## Immediate Next Step

- Review the completed hybrid ad locally:
  - inspect capture legibility and pacing across `/`, `/search`, `/romi`, `/services`, and `/payment`
  - confirm the Vietnamese-first copy feels renter-first rather than generic SaaS motion copy
  - confirm the fake-UI shells still feel like RommZ instead of a template ad system
- Review the preview audio specifically:
  - decide whether `vi-VN-HoaiMyNeural` is good enough for the internal review cut or should be replaced by a human recording / higher-directability Vietnamese TTS for the final ad
  - tune the generated bed level if it competes with captions or scene pacing
- Decide whether the next video phase should:
  - attach final Vietnamese voiceover and soundtrack assets
  - tune the `services + payment` block if it still feels too dense at ad speed
  - build a landlord-focused `/host` variant later
  - or freeze the current local video workflow and return to product-surface parity work

## Update Rules

1. Read this file before repo-affecting work.
2. Update this file after each code task.
3. If a feature status, route, tech choice, or workflow changes, reflect it here immediately.
4. If the file becomes too long, summarize old items and keep the current state at the top.

