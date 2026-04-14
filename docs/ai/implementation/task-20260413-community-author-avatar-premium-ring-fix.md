---
phase: implementation
title: Community Author Avatar Source Fix
date: 2026-04-13
owner: Codex
status: completed
---

# Community Author Avatar Source Fix

## Summary

- Investigated why Community post authors were showing non-real avatars and missing premium rings on the public `/community` surface.
- Confirmed the feed/detail data path already returned `author.avatar` and `author.isPremium` correctly from `users.avatar_url` and `users.is_premium`.
- Found the actual UI regression in `packages/web/src/pages/CommunityPage.tsx`: the featured discussion cards and sidebar contributor cards were still rendering hardcoded `stitchAssets.community.*` avatars instead of the live author metadata.

## Root Cause

- The Community feed service was not the issue.
- `PostDetailModal` and `PostCard` already use `PremiumAvatar`.
- `CommunityPage` had two stale presentation-only code paths:
  - featured discussion cards used `stitchAssets.community.discussionAvatars[index]`
  - top contributor cards used `stitchAssets.community.contributors[index]`
- Because those paths bypassed `PremiumAvatar`, they also bypassed the premium ring entirely.

## DB Verification

- Queried the reported post `Chào mọi ngườiii` on live Supabase project `vevnoxlgwisdottaifdn`.
- Verified the author row already has a real `avatar_url`.
- Verified the same author currently has `users.is_premium = false` and no active `subscriptions` row.
- Conclusion:
  - wrong avatar on the community card was a frontend render bug
  - missing premium ring for that specific author is expected from current data, not a subscription-sync bug

## Changes

- Updated `packages/web/src/pages/CommunityPage.tsx`:
  - featured discussion author avatar now renders from `post.author.avatar`
  - featured discussion author avatar now uses `PremiumAvatar`
  - contributor sidebar avatar now renders from `post.author.avatar`
  - contributor sidebar avatar now uses `PremiumAvatar`
  - added shared initials fallback helper for missing avatars
- Added regression coverage in `packages/web/src/pages/CommunityPage.test.tsx` to ensure featured/contributor avatars come from author data instead of static Stitch assets.

## Validation

- `npx eslint packages/web/src/pages/CommunityPage.tsx packages/web/src/pages/CommunityPage.test.tsx`
- `npm run test:unit --workspace=@roomz/web -- src/pages/CommunityPage.test.tsx`
- `npx ai-devkit@latest lint`
