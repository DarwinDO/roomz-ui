# Premium Avatar Ring — Design Spec

**Date:** 2026-04-12
**Status:** Approved
**Feature:** Rommz+ Premium Avatar Gold Ring

---

## Overview

Users with an active Rommz+ Premium subscription get a distinctive gold ring around their avatar wherever it appears in the app. The ring is visible to **all users** (not just the owner) — it's a social status signal.

---

## Visual Design

**Style:** Option B — Spinning gradient ring + Crown badge

- **Ring:** `conic-gradient(#f59e0b → #fde68a → #f97316 → #f59e0b)` border, `padding: 3px`, `border-radius: 50%`, rotates `4s linear infinite`
- **Crown badge:** 👑 icon in a small circle (`background: linear-gradient(135deg, #f59e0b, #f97316)`), positioned `top-right` corner, `border: 2px solid white`
- **Avatar inner border:** `border: 2px solid white` to visually separate from ring
- **Non-premium:** renders plain `Avatar` with zero added DOM/CSS

### Size variants

| Size prop | Avatar diameter | Crown badge size | Ring padding |
|-----------|----------------|-----------------|--------------|
| `sm`      | 38px           | 16px            | 2px          |
| `md`      | 40–64px        | 22px            | 3px          |
| `lg`      | 80–96px        | 26px            | 3px          |

### Accessibility

- Crown icon: `aria-label="Rommz+ Premium"`
- Ring wrapper: `role="presentation"`
- `prefers-reduced-motion`: disable CSS `animation` (rotation + any pulse), keep static gradient ring visible

---

## Architecture Decision

**Approach A — `is_premium` column on users table (chosen)**

Rationale: zero runtime overhead, no extra queries, single source of truth, scales linearly.

Alternatives considered:
- B: Per-component lazy fetch — N+1 risk, UI flicker
- C: Supabase view join — requires updating all API calls, slower view

---

## Database Layer

### Migration

```sql
ALTER TABLE users ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
```

### Trigger (sync from subscriptions)

```sql
CREATE OR REPLACE FUNCTION sync_user_premium()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
  SET is_premium = EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status = 'active'
      AND plan = 'rommz_plus'
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_user_premium
AFTER INSERT OR UPDATE OR DELETE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION sync_user_premium();
```

### Backfill (run once after migration)

```sql
UPDATE users
SET is_premium = EXISTS (
  SELECT 1 FROM subscriptions
  WHERE user_id = users.id
    AND status = 'active'
    AND plan = 'rommz_plus'
);
```

---

## Component

**File:** `packages/web/src/components/ui/PremiumAvatar.tsx`

**Props:**
```ts
interface PremiumAvatarProps {
  isPremium: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode; // AvatarImage + AvatarFallback
  className?: string;
}
```

**Usage:**
```tsx
<PremiumAvatar isPremium={profile.is_premium} size="md">
  <AvatarImage src={profile.avatar_url} />
  <AvatarFallback>NT</AvatarFallback>
</PremiumAvatar>
```

When `isPremium = false`, renders identical output to current `<Avatar>` — no regressions.

---

## Integration Points

### Group 1 — Current user (isPremium from `usePremiumLimits()`)

| File | Current | Change |
|------|---------|--------|
| `router/AppShell.tsx` | `<Avatar>` | → `<PremiumAvatar isPremium={isPremium}>` |
| `pages/profile/components/ProfileHeader.tsx` | `<Avatar>` | → `<PremiumAvatar isPremium={isPremium}>` |
| `components/common/BottomNav.tsx` | `<Avatar>` | → `<PremiumAvatar isPremium={isPremium}>` |

### Group 2 — Other users (isPremium from their profile data)

| File | Data change needed | Component change |
|------|--------------------|-----------------|
| `pages/community/components/PostCard.tsx` | Add `is_premium` to `Post.author` type + community API query | → `<PremiumAvatar>` |
| `components/modals/PostDetailModal.tsx` | Same as PostCard | → `<PremiumAvatar>` |
| `pages/roommates/components/results/RoommateCard.tsx` | Auto-included after migration (`SELECT *`) | → `<PremiumAvatar>` |
| `components/modals/RoommateProfileModal.tsx` | Same as RoommateCard | → `<PremiumAvatar>` |
| `components/chat/MessageBubble.tsx` | Add `is_premium` to chat sender type — requires investigation: check if realtime chat messages include sender profile join | → `<PremiumAvatar>` |
| `components/common/ChatDrawer.tsx` | Add `is_premium` to conversation participant type — same investigation needed | → `<PremiumAvatar>` |
| `components/modals/ContactLandlordModal.tsx` | Add `is_premium` to landlord data | → `<PremiumAvatar>` |
| `components/listings/ListingHostCard.tsx` | Add `is_premium` to host data | → `<PremiumAvatar>` |

---

## Data Type Changes

`UserProfile` (from `Tables<'users'>`) will automatically gain `is_premium: boolean` after migration.

Community `Post.author` type needs manual extension:
```ts
interface PostAuthor {
  // existing fields...
  is_premium: boolean; // NEW
}
```

Community API query (Supabase) needs to join/select `is_premium` from users when fetching posts.

---

## Out of Scope

- Mobile app (`packages/mobile`) — separate task
- Admin pages — admins don't need social premium signals
- Animation customization settings — always-on for now
- Premium ring for the Rommz AI chatbot avatar

---

## Success Criteria

1. Premium users see their own ring everywhere their avatar appears
2. Non-premium users see the premium ring on other users' avatars
3. Removing/expiring a subscription removes the ring within one DB write (trigger)
4. Zero visual regression for non-premium avatars
5. Animation respects `prefers-reduced-motion`
