---
phase: implementation
title: Community Feed Expansion After Featured Posts
date: 2026-04-13
owner: Codex
status: completed
---

# Community Feed Expansion After Featured Posts

## Summary

- Expanded the public `/community` page so it no longer feels capped at two posts.
- Kept the existing featured-discussion treatment for the first two posts.
- Reused the rest of the fetched feed inside the second community section, made that layout adaptive so short lists fill the row while longer lists scroll horizontally, and wired the existing infinite-query pagination to a visible `Xem thêm bài viết` CTA.

## Problem

- `CommunityPage` fetched paginated community data via `usePosts`, but the page only surfaced:
  - the first 2 items as featured cards
  - then only items 3-4 in the secondary section
- The remaining fetched posts were silently discarded in the UI.
- `usePosts` already exposed `hasNextPage` and `fetchNextPage`, but the page never rendered a control to continue the feed.

## Changes

- Updated `packages/web/src/pages/CommunityPage.tsx`:
  - consume `hasNextPage`, `fetchNextPage`, and `isFetchingNextPage` from `usePosts`
  - replace the hard cap `slice(2, 4)` with `slice(2)` so the second section renders all posts after the featured pair
  - make the "latest posts" surface adaptive: short lists use a full-width grid, while longer lists use a horizontal scroll rail
  - add a centered `Xem thêm bài viết` button to request the next page when available
  - normalize several legacy mojibake/whitespace lines touched by the page so lint passes cleanly
- Updated `packages/web/src/pages/CommunityPage.test.tsx`:
  - keep avatar-source regression coverage
  - add coverage that posts beyond the first two remain visible, short latest-post lists stay full-width, and the load-more CTA calls `fetchNextPage`

## Validation

- `npx eslint packages/web/src/pages/CommunityPage.tsx packages/web/src/pages/CommunityPage.test.tsx`
- `npm run test:unit --workspace=@roomz/web -- src/pages/CommunityPage.test.tsx`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `npx ai-devkit@latest lint`
