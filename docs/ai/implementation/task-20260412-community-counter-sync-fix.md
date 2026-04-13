---
phase: implementation
task: community-counter-sync-fix
date: 2026-04-12
status: complete
---

# Task Log: Community Counter Sync Fix

## Goal

- Fix the `/community` bug where like and comment counts did not increase reliably after interaction.

## Files

- `packages/web/src/hooks/useCommunity.ts`
- `packages/web/src/hooks/useCommunityCache.ts`
- `packages/web/src/hooks/useCommunityCache.test.ts`
- `packages/web/src/services/community.ts`
- `packages/web/src/pages/CommunityPage.tsx`
- `packages/web/src/pages/ServicesHubPage.tsx`
- `packages/web/src/pages/SupportServicesPage.tsx`
- `supabase/migrations/20260412093000_sync_community_post_counters.sql`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Reworked community cache synchronization so like toggles and comment mutations update the active feed pages, post detail cache, and top-post cache together.
- Switched `/community` from storing a copied `selectedPost` object to storing `selectedPostId`, then resolving modal content from live query data with a local fallback.
- Updated single-post fetching so the modal receives the correct viewer-specific `liked` state.
- Added a Supabase migration that keeps `community_posts.likes_count` and `community_posts.comments_count` synchronized from `community_likes` and `community_comments`, plus a backfill for existing rows.
- Updated the migration to drop the legacy `trigger_update_likes_count` and `trigger_update_comments_count` triggers/functions so the new recount-based sync path is the only active counter writer.
- Applied the migration directly to the live Supabase project `vevnoxlgwisdottaifdn`, recorded version `20260412093000` in `supabase_migrations.schema_migrations`, then verified the stored counters match live like/comment rows.
- Fixed the unrelated web build break by routing `"voucher"` partners through voucher-aware flows in `/services` and `/support-services` instead of passing `"voucher"` into APIs that only accept `ServiceRequestMode`.
- Added unit coverage for the pure cache-update helpers.

## Root Cause

- The post-detail modal received a copied `selectedPost` snapshot, so UI counters stayed frozen even when React Query cache changed underneath.
- Comment mutations invalidated only the comments/detail queries and never pushed `comments_count` back into the feed cache.
- The repo had no migration that guaranteed persisted counter columns on `community_posts` stayed synchronized with like/comment tables.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npx eslint packages/web/src/hooks/useCommunity.ts packages/web/src/hooks/useCommunityCache.ts packages/web/src/hooks/useCommunityCache.test.ts packages/web/src/services/community.ts packages/web/src/pages/CommunityPage.tsx`: pass
- `npx eslint packages/web/src/pages/ServicesHubPage.tsx packages/web/src/pages/SupportServicesPage.tsx`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run test:unit --workspace=@roomz/web -- src/hooks/useCommunityCache.test.ts src/services/community.shared.test.ts`: pass
- `npm run test:e2e --workspace=@roomz/web -- community.spec.ts`: pass
- direct SQL verification on `vevnoxlgwisdottaifdn`: pass, active counter triggers are `sync_community_post_counters_from_likes` and `sync_community_post_counters_from_comments`, counter mismatches = `0`, `schema_migrations.version = 20260412093000` is present
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260412-community-counter-sync-fix.md`

## Follow-ups

- Add an authenticated browser regression later for the full like/comment round-trip once the community interaction mocks cover signed-in mutations.
