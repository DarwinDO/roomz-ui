---
phase: implementation
title: Community Social Feed With 10-Post Incremental Loading
date: 2026-04-14
owner: Codex
status: completed
---

# Community Social Feed With 10-Post Incremental Loading

## Summary

- Shifted the public `/community` page away from a numbered blog/grid presentation and back toward a social feed.
- The main column now renders full-width stacked post cards, loads 10 posts at a time, and appends the next batch through `Xem thêm bài viết`.

## Problem

- The first implementation for this request solved post volume, but the resulting numbered blog grid broke the intended community feel.
- Product feedback clarified that the target interaction should feel like a Facebook-style feed within the existing community page shell, not a paginated blog archive.

## Changes

- Updated `packages/web/src/hooks/useCommunity.ts`:
  - restored `usePosts` to `useInfiniteQuery`
  - flatten fetched pages into a single growing feed
  - expose `hasNextPage`, `fetchNextPage`, and `isFetchingNextPage`
- Kept `packages/web/src/services/community.ts` server-side `searchQuery` filtering
- Kept `packages/web/src/hooks/useCommunityCache.ts` compatible with both paged and infinite feed cache shapes
- Reworked `packages/web/src/pages/CommunityPage.tsx`:
  - remove numbered pagination controls and blog-grid presentation
  - render one vertical stacked feed in the main content column
  - load 10 posts per request and append more posts through `Xem thêm bài viết`
  - preserve real author avatars, premium rings, filters, search, and sidebar modules
- Updated `packages/web/src/pages/CommunityPage.test.tsx`:
  - validate live avatar sources
  - validate vertical feed styling and load-more behavior

## Validation

- `npx eslint packages/web/src/pages/CommunityPage.tsx packages/web/src/pages/CommunityPage.test.tsx packages/web/src/hooks/useCommunity.ts packages/web/src/hooks/useCommunityCache.ts packages/web/src/services/community.ts packages/web/src/pages/community/types.ts`
- `npm run test:unit --workspace=@roomz/web -- src/pages/CommunityPage.test.tsx`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `npm run build --workspace=@roomz/web`
- `npx ai-devkit@latest lint`
