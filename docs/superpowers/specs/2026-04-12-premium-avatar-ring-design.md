# Premium Avatar Ring — Design Spec

**Date:** 2026-04-12
**Revised:** 2026-04-12 v3 (final)
**Status:** Approved
**Feature:** Rommz+ Premium Avatar Gold Ring

---

## Overview

Users with an active Rommz+ Premium subscription get a distinctive gold ring around their avatar wherever their avatar appears in the app. The ring is visible to **all users** — it's a social status signal.

Scope: every surface rendering a real user's avatar via the `<Avatar>` component or a raw `<img>` avatar, outside of admin pages and the mobile package (separate task).

---

## Visual Design

**Style:** Spinning gradient ring + Crown badge (Option B)

- **Ring:** `conic-gradient(#f59e0b → #fde68a → #f97316 → #f59e0b)` border, 3px padding, rotates `4s linear infinite`
- **Border-radius:** ring wrapper inherits the **same border-radius as the inner Avatar** via className pass-through. Non-circular avatars (e.g. `rounded-[28px]`) get a matching non-circular ring. Crown badge stays at top-right corner regardless of shape.
- **Crown badge:** 👑 icon in a small circle (`background: linear-gradient(135deg, #f59e0b, #f97316)`), positioned top-right, `border: 2px solid white`, scales proportionally using `width: 28%` of parent (CSS `clamp` to keep it between 14px and 28px)
- **Avatar inner border:** `border: 2px solid white` to visually separate from ring
- **Non-premium:** renders the plain `<Avatar>` branch — DOM/visual equivalent, no extra elements

### `prefers-reduced-motion`

Disable CSS `animation` (rotation). Keep static gradient ring visible.

---

## Architecture Decision

**Approach A — `users.is_premium` as single source of truth**

`users.is_premium` is already maintained by trigger `sync_user_premium_cache_on_subscriptions` (migration `20260311170000`). No new migration needed.

**Source of truth alignment:**

- **Group 1 (own avatar):** Read `profile.is_premium` from `useAuth()` — already loaded from `users` table. Do NOT use `usePremiumLimits().isPremium` for ring rendering; that hook reads `subscriptions` directly without `current_period_end` validation, which would diverge from what others see.
- **Group 2 (other users):** Read `is_premium` from each surface's existing user data, extended to include this field.

---

## Database Layer

### No new migration needed

`users.is_premium` (boolean, default false) and `users.premium_until` (timestamp) already exist. Existing trigger handles sync.

### RPC update: `get_roommate_matches`

Add `u.is_premium` to the RPC's SELECT from `users`. This is the only required DB-side change.

---

## Component

**File:** `packages/web/src/components/ui/PremiumAvatar.tsx`

**Sizing and shape:** Caller controls via `className`, identical to current `<Avatar>`. `PremiumAvatar` applies the same `className` to both the ring wrapper and the inner `Avatar` so border-radius is always consistent.

**Props:**
```ts
interface PremiumAvatarProps {
  isPremium?: boolean;
  className?: string;
  children: React.ReactNode; // AvatarImage + AvatarFallback
}
```

**Usage:**
```tsx
<PremiumAvatar isPremium={profile.is_premium} className="h-10 w-10">
  <AvatarImage src={profile.avatar_url} />
  <AvatarFallback>NT</AvatarFallback>
</PremiumAvatar>

// Non-circular (RoommateProfileModal style)
<PremiumAvatar isPremium={roommate.is_premium} className="h-24 w-24 rounded-[28px]">
  <AvatarImage src={roommate.avatar_url} />
  <AvatarFallback className="rounded-[24px]">AB</AvatarFallback>
</PremiumAvatar>
```

---

## Integration Points

### Group 1 — Current user's own avatar

Source: `profile.is_premium` from `useAuth()`.

| File | Notes |
|------|-------|
| `router/AppShell.tsx` | `profile` already in scope |
| `pages/ProfilePage.tsx` | `profile` already in scope |
| `pages/profile/components/ProfileHeader.tsx` | Receives `isPremium` prop — caller must pass `profile.is_premium` |

### Group 2 — Other users' avatars (Avatar component)

| File | Data change needed |
|------|--------------------|
| `pages/community/components/PostCard.tsx` | Add `is_premium` to `Post.author` type + community API select |
| `components/modals/PostDetailModal.tsx` | Add `is_premium` to post author + comment authors (both query paths) |
| `services/community.ts` | Add `is_premium` to `CommunityPost.author` and `CommunityComment.author` types; update Supabase select strings |
| `pages/roommates/components/results/RoommateCard.tsx` | Requires `get_roommate_matches` RPC update + add `is_premium` to `RoommateMatch` type |
| `components/modals/RoommateProfileModal.tsx` | Same RPC data — non-circular ring applies here |
| `pages/roommates/components/results/IntroMessageModal.tsx` | Uses `RoommateMatch` data — covered by RPC update |
| `pages/roommates/components/requests/RequestsList.tsx` | Check what user type is passed; add `is_premium` to that query |
| `pages/MessagesPage.tsx` | Add `is_premium` to conversation participant type |
| `components/common/ChatDrawer.tsx` | Same conversation participant type |
| `components/chat/MessageBubble.tsx` | Add `is_premium` to sender type |
| `components/modals/ContactLandlordModal.tsx` | Add `is_premium` to landlord data |
| `components/listings/ListingHostCard.tsx` | Add `is_premium` to host data |
| `pages/landlord/components/LandlordBookingCard.tsx` | Add `is_premium` to `booking.renter` data |

### Group 2 — Other users' avatars (raw `<img>`, needs conversion)

These surfaces render user avatars as plain `<img>` elements. They must be converted to `<PremiumAvatar>` + `<AvatarImage>/<AvatarFallback>` as part of this task.

| File | Location | User type |
|------|----------|-----------|
| `pages/RoomDetailPage.tsx` | line 586 — reviewer avatar | `review.reviewer` — check if `is_premium` is in reviews query |
| `pages/RoomDetailPage.tsx` | line 632 — host avatar | `room.landlord` — check if `is_premium` is in room query |

### Chat-specific data fixes (confirmed, not "investigate")

| Location | Fix |
|----------|-----|
| `packages/shared/src/services/realtime.ts` line 106 | Change `.select('id, full_name, avatar_url')` → `.select('id, full_name, avatar_url, is_premium')` |
| `packages/shared/src/services/chat/api.ts` line 135 | Change `user:users (id, full_name, avatar_url, email)` → `user:users (id, full_name, avatar_url, email, is_premium)` |
| `UserInfo` type in chat types | Add `is_premium?: boolean` |

### Surfaces explicitly out of scope

| Surface | Reason |
|---------|--------|
| `components/common/BottomNav.tsx` | Renders no `<Avatar>`, only Lucide icons |
| Admin pages | Not a social surface |
| `packages/mobile` | Separate task |
| Rommz AI chatbot avatar | Not a user identity |

---

## Success Criteria

1. Premium users see their own ring on every surface listed in Group 1 and Group 2
2. Non-premium users see the ring on premium users' avatars
3. Subscription expiry removes ring within one DB write (existing trigger)
4. Non-premium path renders the plain `<Avatar>` branch — DOM/visual equivalent, no extra elements
5. Animation disabled under `prefers-reduced-motion`; static gradient ring remains visible
6. Non-circular avatars (e.g. `rounded-[28px]`) get matching non-circular ring — no hardcoded `border-radius: 50%`
7. Crown badge scales proportionally at all sizes via CSS `clamp`, no hardcoded size breakpoints
