# Premium Avatar Ring — Design Spec

**Date:** 2026-04-12
**Revised:** 2026-04-12 (post code-review findings)
**Status:** Approved
**Feature:** Rommz+ Premium Avatar Gold Ring

---

## Overview

Users with an active Rommz+ Premium subscription get a distinctive gold ring around their avatar wherever it appears in the app. The ring is visible to **all users** — it's a social status signal.

---

## Visual Design

**Style:** Spinning gradient ring + Crown badge (Option B)

- **Ring:** `conic-gradient(#f59e0b → #fde68a → #f97316 → #f59e0b)` border, 3px padding, `border-radius: 50%`, rotates `4s linear infinite`
- **Crown badge:** 👑 icon in a small circle (`background: linear-gradient(135deg, #f59e0b, #f97316)`), positioned top-right, `border: 2px solid white`
- **Avatar inner border:** `border: 2px solid white` to visually separate from ring
- **Non-premium:** renders identical to plain `<Avatar>` — zero added DOM/CSS

### `prefers-reduced-motion`

Disable CSS `animation` (rotation + any pulse), keep static gradient ring visible.

---

## Architecture Decision

**Approach A — `users.is_premium` as single source of truth**

`users.is_premium` is already maintained by the existing trigger `sync_user_premium_cache_on_subscriptions` (migration `20260311170000`). No new migration needed.

**Source of truth alignment:**

- **Group 1 (own avatar):** Read `profile.is_premium` from `AuthContext` — already loaded from `users` table. Do NOT use `usePremiumLimits().isPremium` which reads `subscriptions` directly and lacks `current_period_end` validation, creating inconsistency.
- **Group 2 (other users):** Read `is_premium` from the user's profile data returned by each API.

---

## Database Layer

### No new migration needed

`users.is_premium` (boolean, default false) and `users.premium_until` (timestamp) already exist.
Trigger `sync_user_premium_cache_on_subscriptions` already handles INSERT/UPDATE/DELETE on `subscriptions`, checking both `status = 'active'` AND `current_period_end > now()`.

### RPC update required: `get_roommate_matches`

The roommate matching RPC currently does not return `is_premium`. It must be updated to include `u.is_premium` in its SELECT from `users`. This is the **only DB change** needed.

---

## Component

**File:** `packages/web/src/components/ui/PremiumAvatar.tsx`

**Design principle:** The component must not own sizing. Callers control size via `className`, exactly like the existing `<Avatar>` component. This avoids regression across the many different sizes in the codebase (`w-8 h-8`, `h-10 w-10`, `h-32 w-32`, etc.).

**Props:**
```ts
interface PremiumAvatarProps {
  isPremium?: boolean;
  className?: string;        // passed through to Avatar (controls size/shape)
  children: React.ReactNode; // AvatarImage + AvatarFallback
}
```

**Usage:**
```tsx
// Drop-in replacement — caller keeps controlling size via className
<PremiumAvatar isPremium={profile.is_premium} className="h-10 w-10">
  <AvatarImage src={profile.avatar_url} />
  <AvatarFallback>NT</AvatarFallback>
</PremiumAvatar>
```

**Crown badge sizing:** scales relative to the Avatar's size using a percentage-based position (`width: 30%`, `height: 30%`, capped at reasonable min/max with CSS clamp).

**When `isPremium` is falsy:** renders identical output to `<Avatar className={className}>` — no regression.

---

## Integration Points

### Group 1 — Current user's own avatar

Source: `profile.is_premium` from `useAuth()` (reads `users` table). Replace current `usePremiumLimits().isPremium` usage for ring rendering only — do not change other premium gates.

| File | Notes |
|------|-------|
| `router/AppShell.tsx` | `profile` already available from `useAuth()` |
| `pages/ProfilePage.tsx` | `profile` already available |
| `pages/profile/components/ProfileHeader.tsx` | Receives `isPremium` prop — change caller to pass `profile.is_premium` |

### Group 2 — Other users' avatars

| File | Data change needed |
|------|--------------------|
| `pages/community/components/PostCard.tsx` | Add `is_premium: boolean` to `Post.author` type + community API `SELECT` |
| `components/modals/PostDetailModal.tsx` | Same — post author + **comment authors** (both need `is_premium` in query) |
| `services/community.ts` | Add `is_premium` to both `CommunityPost.author` and `CommunityComment.author` types; update Supabase select strings to include `is_premium` from joined `users` |
| `pages/roommates/components/results/RoommateCard.tsx` | Requires RPC `get_roommate_matches` update (see DB section) + add `is_premium` to `RoommateMatch` type |
| `components/modals/RoommateProfileModal.tsx` | Same RPC data |
| `pages/MessagesPage.tsx` | Add `is_premium` to conversation participant type + chat API query |
| `components/common/ChatDrawer.tsx` | Same conversation participant type |
| `components/chat/MessageBubble.tsx` | Investigate if realtime chat messages join `users` — may need separate fetch or realtime payload update |
| `components/modals/ContactLandlordModal.tsx` | Add `is_premium` to landlord data |
| `components/listings/ListingHostCard.tsx` | Add `is_premium` to host data |

### Surfaces confirmed NOT in scope

- `components/common/BottomNav.tsx` — renders no `<Avatar>`, only Lucide icons
- Admin pages — not a social surface
- `packages/mobile` — separate task

---

## Out of Scope

- Mobile app (`packages/mobile`)
- Admin pages
- Rommz AI chatbot avatar
- Animation customization per-user preference

---

## Success Criteria

1. Premium users see their own ring on every avatar surface listed above
2. Non-premium users see the ring on premium users' avatars
3. Subscription expiry removes ring within one DB write (existing trigger handles this)
4. Zero visual regression for non-premium avatars — `PremiumAvatar` with `isPremium=false` is byte-for-byte equivalent to `Avatar`
5. Animation disabled under `prefers-reduced-motion`, static ring still shows
6. Crown badge scales proportionally at all sizes — no hardcoded size breakpoints
