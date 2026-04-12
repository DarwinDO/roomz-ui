# Premium Avatar Ring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a spinning gold gradient ring + 👑 crown badge to every avatar of a Rommz+ Premium user, visible to all users across the entire web app.

**Architecture:** `PremiumAvatar` wraps the existing `Avatar` component — when `isPremium=false` it renders a plain `Avatar` with zero overhead. `users.is_premium` (already synced by DB trigger) is the single source of truth; data queries are extended to expose it on each surface.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest + Testing Library, Supabase (Postgres), Radix UI Avatar

---

## File Map

**Created:**
- `packages/web/src/components/ui/PremiumAvatar.tsx` — new component
- `packages/web/src/components/ui/PremiumAvatar.test.tsx` — unit tests
- `supabase/migrations/20260412180000_add_is_premium_to_roommate_matches_rpc.sql` — RPC update

**Modified — Types:**
- `packages/shared/src/services/chat/types.ts` — add `is_premium` to `UserInfo`, `MessageWithSender.sender`
- `packages/web/src/pages/community/types.ts` — add `is_premium` to `Post.author`, `Comment.author`
- `packages/web/src/services/roommates.ts` — add `is_premium` to `RoommateMatch`, `RoommateRequest.sender/receiver`

**Modified — Queries:**
- `packages/shared/src/services/chat/api.ts` — 2 select strings
- `packages/shared/src/services/realtime.ts` — 1 select string
- `packages/web/src/services/community.ts` — 4 select strings + 2 transform functions
- `packages/web/src/services/roommates.ts` — 3 select strings
- `packages/web/src/services/reviews.ts` — 1 select string

**Modified — UI (Group 1 — own avatar):**
- `packages/web/src/router/AppShell.tsx`
- `packages/web/src/pages/ProfilePage.tsx`
- `packages/web/src/pages/profile/components/ProfileHeader.tsx`

**Modified — UI (Group 2 — other users):**
- `packages/web/src/pages/community/components/PostCard.tsx`
- `packages/web/src/components/modals/PostDetailModal.tsx`
- `packages/web/src/pages/roommates/components/results/RoommateCard.tsx`
- `packages/web/src/components/modals/RoommateProfileModal.tsx`
- `packages/web/src/pages/roommates/components/results/IntroMessageModal.tsx`
- `packages/web/src/pages/roommates/components/requests/RequestsList.tsx`
- `packages/web/src/components/chat/MessageBubble.tsx`
- `packages/web/src/components/common/ChatDrawer.tsx`
- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/components/modals/ContactLandlordModal.tsx`
- `packages/web/src/components/listings/ListingHostCard.tsx`
- `packages/web/src/pages/landlord/components/LandlordBookingCard.tsx`
- `packages/web/src/pages/RoomDetailPage.tsx` — convert 2 raw `<img>` avatars

---

## Task 1: PremiumAvatar Component

**Files:**
- Create: `packages/web/src/components/ui/PremiumAvatar.tsx`
- Create: `packages/web/src/components/ui/PremiumAvatar.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// packages/web/src/components/ui/PremiumAvatar.test.tsx
import { render, screen } from '@testing-library/react';
import { PremiumAvatar } from './PremiumAvatar';
import { AvatarFallback } from './avatar';

describe('PremiumAvatar', () => {
  it('renders plain Avatar with no crown when isPremium is false', () => {
    const { container } = render(
      <PremiumAvatar isPremium={false} className="h-10 w-10">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>
    );
    expect(container.querySelector('[aria-label="Rommz+ Premium"]')).toBeNull();
    // Only one root element — the Avatar itself, no wrapper div
    expect(container.firstChild).toHaveAttribute('data-slot', 'avatar');
  });

  it('renders crown badge when isPremium is true', () => {
    render(
      <PremiumAvatar isPremium={true} className="h-10 w-10">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>
    );
    expect(screen.getByLabelText('Rommz+ Premium')).toBeInTheDocument();
  });

  it('renders crown badge when isPremium is undefined (defaults to no ring)', () => {
    const { container } = render(
      <PremiumAvatar className="h-10 w-10">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>
    );
    expect(container.querySelector('[aria-label="Rommz+ Premium"]')).toBeNull();
  });

  it('passes className to wrapper div when premium', () => {
    const { container } = render(
      <PremiumAvatar isPremium={true} className="h-20 w-20">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>
    );
    expect(container.firstChild).toHaveClass('h-20', 'w-20');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:unit -- PremiumAvatar
```

Expected: `Cannot find module './PremiumAvatar'`

- [ ] **Step 3: Implement PremiumAvatar**

```tsx
// packages/web/src/components/ui/PremiumAvatar.tsx
import * as React from "react";
import { Avatar } from "./avatar";
import { cn } from "./utils";

interface PremiumAvatarProps {
  isPremium?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PremiumAvatar({ isPremium, className, children }: PremiumAvatarProps) {
  if (!isPremium) {
    return <Avatar className={className}>{children}</Avatar>;
  }

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {/* Spinning gradient ring — fills entire wrapper */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] motion-safe:animate-spin motion-safe:[animation-duration:4s]"
        style={{
          background: "conic-gradient(#f59e0b 0%, #fde68a 30%, #f97316 60%, #f59e0b 100%)",
        }}
      />
      {/* Inner Avatar — inset 3px from ring, inherits border-radius */}
      <Avatar className="absolute inset-[3px] size-auto border-2 border-white rounded-[inherit]">
        {children}
      </Avatar>
      {/* Crown badge — top-right corner, scales with parent size */}
      <span
        aria-label="Rommz+ Premium"
        role="img"
        className="absolute -right-1 -top-1 z-10 flex items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500"
        style={{
          width: "clamp(14px, 28%, 28px)",
          height: "clamp(14px, 28%, 28px)",
          fontSize: "clamp(7px, 40%, 14px)",
        }}
      >
        👑
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:unit -- PremiumAvatar
```

Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/ui/PremiumAvatar.tsx packages/web/src/components/ui/PremiumAvatar.test.tsx
git commit -m "feat: add PremiumAvatar component with gold ring and crown badge"
```

---

## Task 2: RPC Migration — add `is_premium` to `get_roommate_matches`

**Files:**
- Create: `supabase/migrations/20260412180000_add_is_premium_to_roommate_matches_rpc.sql`

- [ ] **Step 1: Verify current RPC output lacks `is_premium`**

```bash
# In Supabase dashboard SQL editor or via MCP:
SELECT matched_user_id, full_name FROM get_roommate_matches('<any-valid-uuid>', 1);
# Confirm: no is_premium column in result
```

- [ ] **Step 2: Create migration**

```sql
-- supabase/migrations/20260412180000_add_is_premium_to_roommate_matches_rpc.sql

-- Re-create get_roommate_matches with is_premium added to RETURNS TABLE and SELECT
-- Mirrors the existing function in 20260310173000_improve_roommate_matching.sql
-- with only the addition of is_premium boolean.

CREATE OR REPLACE FUNCTION public.get_roommate_matches(
    p_user_id uuid,
    p_limit integer DEFAULT 20
)
RETURNS TABLE(
    matched_user_id uuid,
    compatibility_score integer,
    full_name text,
    avatar_url text,
    is_premium boolean,
    bio text,
    university text,
    major text,
    city text,
    district text,
    age integer,
    gender text,
    occupation text,
    hobbies text[],
    sleep_score integer,
    cleanliness_score integer,
    noise_score integer,
    guest_score integer,
    weekend_score integer,
    budget_score integer,
    hobby_score integer,
    age_score integer,
    move_in_score integer,
    location_score integer,
    confidence_score integer,
    match_scope text,
    last_seen timestamp with time zone
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_profile RECORD;
BEGIN
    SELECT * INTO v_user_profile
    FROM public.roommate_profiles
    WHERE user_id = p_user_id;

    IF v_user_profile IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        rp.user_id,
        scores.total_score,
        u.full_name::text,
        u.avatar_url::text,
        COALESCE(u.is_premium, false),
        rp.bio::text,
        u.university::text,
        u.major::text,
        rp.city::text,
        NULLIF(rp.district, '')::text,
        rp.age,
        rp.gender::text,
        rp.occupation::text,
        COALESCE(rp.hobbies, ARRAY[]::text[]),
        scores.sleep_score,
        scores.cleanliness_score,
        scores.noise_score,
        scores.guest_score,
        scores.weekend_score,
        scores.budget_score,
        scores.hobby_score,
        scores.age_score,
        scores.move_in_score,
        scores.location_score,
        scores.confidence_score,
        CASE
            WHEN NULLIF(COALESCE(v_user_profile.city, ''), '') IS NOT NULL
                 AND v_user_profile.city = rp.city
                 AND NULLIF(COALESCE(v_user_profile.district, ''), '') IS NOT NULL
                 AND NULLIF(COALESCE(rp.district, ''), '') IS NOT NULL
                 AND v_user_profile.district = rp.district THEN 'same_district'
            WHEN NULLIF(COALESCE(v_user_profile.city, ''), '') IS NOT NULL
                 AND v_user_profile.city = rp.city THEN 'same_city'
            ELSE 'other'
        END::text,
        u.last_seen
    FROM public.roommate_profiles rp
    JOIN public.users u ON u.id = rp.user_id
    -- scores CTE: copy from 20260310173000_improve_roommate_matching.sql exactly
    -- (this CREATE OR REPLACE keeps all existing logic; only is_premium is new)
    -- PASTE the full JOIN LATERAL scoring block from
    -- supabase/migrations/20260310173000_improve_roommate_matching.sql
    -- starting at the line after "RETURN QUERY SELECT" down to "LIMIT p_limit;"
    -- The ONLY additions vs the original are:
    --   1. `is_premium boolean` in RETURNS TABLE (above)
    --   2. `COALESCE(u.is_premium, false),` in the SELECT list (above, after avatar_url)
    -- Everything else is copied verbatim — do not rewrite or simplify.
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_roommate_matches(uuid, integer) TO authenticated;

- [ ] **Step 3: Apply migration**

```bash
npx supabase db push
# or via Supabase MCP apply_migration tool
```

- [ ] **Step 4: Verify**

```sql
SELECT matched_user_id, is_premium FROM get_roommate_matches('<your-user-uuid>', 1);
-- Expected: column is_premium exists, value is true or false
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260412180000_add_is_premium_to_roommate_matches_rpc.sql
git commit -m "feat: add is_premium to get_roommate_matches RPC"
```

---

## Task 3: Type Definitions — add `is_premium` everywhere

**Files:**
- Modify: `packages/shared/src/services/chat/types.ts`
- Modify: `packages/web/src/pages/community/types.ts`
- Modify: `packages/web/src/services/roommates.ts` (types only)

- [ ] **Step 1: Update `UserInfo` and `MessageWithSender.sender` in chat types**

In `packages/shared/src/services/chat/types.ts`:

```ts
// BEFORE:
export interface MessageWithSender extends Message {
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
}

// AFTER:
export interface MessageWithSender extends Message {
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean;
    };
}

export interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
    is_premium?: boolean;
}
```

- [ ] **Step 2: Update community `Post.author` and `Comment.author`**

In `packages/web/src/pages/community/types.ts`:

```ts
// BEFORE:
export interface Post {
    // ...
    author: {
        name: string;
        role: string;
        avatar?: string;
        verified?: boolean;
    };
    // ...
}

export interface Comment {
    // ...
    author: {
        name: string;
        avatar?: string;
    };
    // ...
}

// AFTER:
export interface Post {
    // ...
    author: {
        name: string;
        role: string;
        avatar?: string;
        verified?: boolean;
        is_premium?: boolean;
    };
    // ...
}

export interface Comment {
    // ...
    author: {
        name: string;
        avatar?: string;
        is_premium?: boolean;
    };
    // ...
}
```

Also update `PostWithAuthor.author` in the same file to add `is_premium?: boolean`.

- [ ] **Step 3: Update `RoommateMatch` and `RoommateRequest` in roommates.ts**

In `packages/web/src/services/roommates.ts`:

```ts
// BEFORE — RoommateMatch (around line 64):
export interface RoommateMatch {
    matched_user_id: string;
    compatibility_score: number;
    // ...
    last_seen: string | null;
}

// AFTER:
export interface RoommateMatch {
    matched_user_id: string;
    compatibility_score: number;
    // ...
    last_seen: string | null;
    is_premium: boolean;        // ← add this
}

// BEFORE — RoommateRequest.sender/receiver (around line 105):
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    receiver?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };

// AFTER:
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean;
    };
    receiver?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean;
    };
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
# Expected: no new type errors from these changes
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/services/chat/types.ts packages/web/src/pages/community/types.ts packages/web/src/services/roommates.ts
git commit -m "feat: add is_premium to UserInfo, Post.author, Comment.author, RoommateMatch types"
```

---

## Task 4: Query Updates — expose `is_premium` from DB

**Files:**
- Modify: `packages/shared/src/services/chat/api.ts`
- Modify: `packages/shared/src/services/realtime.ts`
- Modify: `packages/web/src/services/community.ts`
- Modify: `packages/web/src/services/roommates.ts`
- Modify: `packages/web/src/services/reviews.ts`

- [ ] **Step 1: Fix chat/api.ts — conversation participants select (line ~135)**

```ts
// BEFORE:
      conversation_participants!inner (
        user_id,
        user:users (id, full_name, avatar_url, email)
      )

// AFTER:
      conversation_participants!inner (
        user_id,
        user:users (id, full_name, avatar_url, email, is_premium)
      )
```

- [ ] **Step 2: Fix chat/api.ts — messages select (line ~213)**

```ts
// BEFORE:
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url)
    `)

// AFTER:
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, is_premium)
    `)
```

- [ ] **Step 3: Fix realtime.ts — sender enrichment select (line ~106)**

```ts
// BEFORE:
    .select('id, full_name, avatar_url')

// AFTER:
    .select('id, full_name, avatar_url, is_premium')
```

- [ ] **Step 4: Fix community.ts — 4 select strings + 2 transforms**

**4a.** In `getPosts()` — two identical select blocks (one in the main query, one in the featured/recent variants if present). Find every occurrence of:
```ts
// BEFORE (community_posts author select):
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified
            )
// AFTER:
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified,
                is_premium
            )
```
Apply this change to **every** Supabase select in `community.ts` that joins `author:users!community_posts_user_id_fkey`.

**4b.** In `getComments()`:
```ts
// BEFORE:
            author:users!community_comments_user_id_fkey(
                id,
                full_name,
                avatar_url
            )
// AFTER:
            author:users!community_comments_user_id_fkey(
                id,
                full_name,
                avatar_url,
                is_premium
            )
```

**4c.** Update `transformCommunityPost` to pass `is_premium`:
```ts
// BEFORE:
        author: {
            id: row.author?.id || row.user_id,
            name: row.author?.full_name || 'Unknown',
            role: row.author?.role || 'Người dùng',
            avatar: row.author?.avatar_url || undefined,
            verified: row.author?.email_verified || false,
        },

// AFTER:
        author: {
            id: row.author?.id || row.user_id,
            name: row.author?.full_name || 'Unknown',
            role: row.author?.role || 'Người dùng',
            avatar: row.author?.avatar_url || undefined,
            verified: row.author?.email_verified || false,
            is_premium: row.author?.is_premium ?? false,
        },
```

**4d.** Update comments transform in `getComments()`:
```ts
// BEFORE:
            author: {
                name: row.author?.full_name || 'Unknown',
                avatar: row.author?.avatar_url || undefined,
            },

// AFTER:
            author: {
                name: row.author?.full_name || 'Unknown',
                avatar: row.author?.avatar_url || undefined,
                is_premium: row.author?.is_premium ?? false,
            },
```

Also add `is_premium: boolean | null` to `CommunityPost.author` and `CommunityComment.author` internal DB types (around lines 50–71 in community.ts).

- [ ] **Step 5: Fix roommates.ts — 3 request select strings**

All three functions (`getReceivedRequests`, `getPendingRequests`, `getSentRequests`) have:
```ts
// BEFORE:
      sender:users!sender_id(id, full_name, avatar_url)
// AFTER:
      sender:users!sender_id(id, full_name, avatar_url, is_premium)
```

`getSentRequests` may join `receiver` instead — apply same change to `receiver:users!receiver_id(...)` if present.

- [ ] **Step 6: Fix reviews.ts — reviewer select**

```ts
// BEFORE:
            reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url)

// AFTER:
            reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url, is_premium)
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: no errors from these changes.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/src/services/chat/api.ts packages/shared/src/services/realtime.ts packages/web/src/services/community.ts packages/web/src/services/roommates.ts packages/web/src/services/reviews.ts
git commit -m "feat: expose is_premium in all user data queries"
```

---

## Task 5: Group 1 — Own Avatar (current user)

**Files:**
- Modify: `packages/web/src/router/AppShell.tsx`
- Modify: `packages/web/src/pages/ProfilePage.tsx`
- Modify: `packages/web/src/pages/profile/components/ProfileHeader.tsx`

Source of `isPremium`: `profile.is_premium` from `useAuth()` — do **not** use `usePremiumLimits().isPremium` for the ring (different source of truth).

- [ ] **Step 1: AppShell.tsx — replace Avatar with PremiumAvatar**

Add import at top:
```ts
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
```

Find the header Avatar (line ~163):
```tsx
// BEFORE:
<Avatar className="h-10 w-10">
  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || ""} />
  <AvatarFallback className="bg-primary text-primary-foreground">
    {getUserInitials()}
  </AvatarFallback>
</Avatar>

// AFTER:
<PremiumAvatar isPremium={profile?.is_premium ?? false} className="h-10 w-10">
  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || ""} />
  <AvatarFallback className="bg-primary text-primary-foreground">
    {getUserInitials()}
  </AvatarFallback>
</PremiumAvatar>
```

Search for any other `<Avatar>` in AppShell that renders the current user and apply the same change.

- [ ] **Step 2: ProfilePage.tsx — replace Avatar**

Find the Avatar near line 279. Add import `PremiumAvatar`, then:
```tsx
// BEFORE:
<Avatar className="h-32 w-32 ...">
  <AvatarImage src={...} />
  <AvatarFallback>...</AvatarFallback>
</Avatar>

// AFTER:
<PremiumAvatar isPremium={profile?.is_premium ?? false} className="h-32 w-32 ...">
  <AvatarImage src={...} />
  <AvatarFallback>...</AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 3: ProfileHeader.tsx — update prop usage**

The component already receives `isPremium: boolean` as a prop. The caller (ProfilePage) must pass `profile?.is_premium ?? false` instead of `usePremiumLimits().isPremium`. Update the prop at the call site in ProfilePage.

Inside ProfileHeader, replace:
```tsx
// BEFORE:
<Avatar className="h-24 w-24 shrink-0 border-4 border-white/15 shadow-lg sm:h-28 sm:w-28">

// AFTER (remove border-4 border-white/15 — PremiumAvatar adds its own white border):
<PremiumAvatar isPremium={isPremium} className="h-24 w-24 shrink-0 shadow-lg sm:h-28 sm:w-28">
```

Add import: `import { PremiumAvatar } from "@/components/ui/PremiumAvatar";`

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npm run build 2>&1 | grep -i error | head -20
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/router/AppShell.tsx packages/web/src/pages/ProfilePage.tsx packages/web/src/pages/profile/components/ProfileHeader.tsx
git commit -m "feat: show premium ring on own avatar in AppShell, ProfilePage, ProfileHeader"
```

---

## Task 6: Community UI Surfaces

**Files:**
- Modify: `packages/web/src/pages/community/components/PostCard.tsx`
- Modify: `packages/web/src/components/modals/PostDetailModal.tsx`

- [ ] **Step 1: PostCard.tsx — replace Avatar**

Add import: `import { PremiumAvatar } from "@/components/ui/PremiumAvatar";`

```tsx
// BEFORE (line ~54):
<Avatar className="w-10 h-10">
  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
    {post.author.name.split(" ").map((n) => n[0]).join("")}
  </AvatarFallback>
</Avatar>

// AFTER:
<PremiumAvatar isPremium={post.author.is_premium ?? false} className="w-10 h-10">
  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
    {post.author.name.split(" ").map((n) => n[0]).join("")}
  </AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 2: PostDetailModal.tsx — replace post author Avatar and comment author Avatars**

Add import: `import { PremiumAvatar } from "@/components/ui/PremiumAvatar";`

For the **post author** avatar (check exact line in file):
```tsx
// BEFORE:
<Avatar className="w-8 h-8">...</Avatar>
// AFTER:
<PremiumAvatar isPremium={post.author.is_premium ?? false} className="w-8 h-8">...</PremiumAvatar>
```

For each **comment author** avatar (line ~536 and replies):
```tsx
// BEFORE:
<Avatar className="w-8 h-8">
  <AvatarFallback>...</AvatarFallback>
</Avatar>
// AFTER:
<PremiumAvatar isPremium={comment.author.is_premium ?? false} className="w-8 h-8">
  <AvatarFallback>...</AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -20
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/pages/community/components/PostCard.tsx packages/web/src/components/modals/PostDetailModal.tsx
git commit -m "feat: show premium ring on community post and comment avatars"
```

---

## Task 7: Roommate UI Surfaces

**Files:**
- Modify: `packages/web/src/pages/roommates/components/results/RoommateCard.tsx`
- Modify: `packages/web/src/components/modals/RoommateProfileModal.tsx`
- Modify: `packages/web/src/pages/roommates/components/results/IntroMessageModal.tsx`
- Modify: `packages/web/src/pages/roommates/components/requests/RequestsList.tsx`

All receive `RoommateMatch` or `RoommateRequest` data which now include `is_premium`.

- [ ] **Step 1: RoommateCard.tsx**

Add import, replace `<Avatar>` with:
```tsx
<PremiumAvatar isPremium={match.is_premium ?? false} className="...existing className...">
  <AvatarImage src={match.avatar_url || undefined} />
  <AvatarFallback>...</AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 2: RoommateProfileModal.tsx** — non-circular avatar

```tsx
// Note: this avatar is rounded-[28px], not fully circular.
// PremiumAvatar inherits border-radius via className.
<PremiumAvatar isPremium={roommate.is_premium} className="h-24 w-24 rounded-[28px]">
  <AvatarImage src={roommate.avatar_url || ''} alt={roommate.full_name} className="object-cover" />
  <AvatarFallback className="rounded-[24px] bg-primary/10 text-2xl font-bold uppercase text-primary">
    {roommate.full_name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('') || '?'}
  </AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 3: IntroMessageModal.tsx** — uses `RoommateMatch`

```tsx
<PremiumAvatar isPremium={match.is_premium} className="w-12 h-12">
  <AvatarImage src={match.avatar_url || undefined} alt={match.full_name} />
  <AvatarFallback className="bg-primary/10 text-primary">
    {getInitials(match.full_name)}
  </AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 4: RequestsList.tsx** — uses `request.sender` from `RoommateRequest`

```tsx
<PremiumAvatar isPremium={user?.is_premium ?? false} className="w-12 h-12">
  <AvatarImage src={user?.avatar_url || undefined} />
  <AvatarFallback className="bg-primary/10 text-primary">
    {getInitials(user?.full_name || '')}
  </AvatarFallback>
</PremiumAvatar>
```

(`user` is `request.sender` or `request.receiver` depending on context in that component.)

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -20
```

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/pages/roommates/components/results/RoommateCard.tsx packages/web/src/components/modals/RoommateProfileModal.tsx packages/web/src/pages/roommates/components/results/IntroMessageModal.tsx packages/web/src/pages/roommates/components/requests/RequestsList.tsx
git commit -m "feat: show premium ring on roommate avatars"
```

---

## Task 8: Chat & Messages UI Surfaces

**Files:**
- Modify: `packages/web/src/components/chat/MessageBubble.tsx`
- Modify: `packages/web/src/components/common/ChatDrawer.tsx`
- Modify: `packages/web/src/pages/MessagesPage.tsx`

- [ ] **Step 1: MessageBubble.tsx**

The `sender` prop is of type `MessageWithSender['sender']` which now has `is_premium`.

Add import, replace Avatar:
```tsx
<PremiumAvatar isPremium={message.sender?.is_premium ?? false} className="h-8 w-8">
  <AvatarImage src={message.sender?.avatar_url || undefined} />
  <AvatarFallback className="bg-primary/10 text-primary text-xs">
    {message.sender?.full_name?.[0] ?? '?'}
  </AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 2: ChatDrawer.tsx**

`conversation.participant` is `UserInfo` which now has `is_premium`.

```tsx
<PremiumAvatar isPremium={conversation.participant.is_premium ?? false} className="...existing className...">
  <AvatarImage src={conversation.participant.avatar_url || undefined} />
  <AvatarFallback>...</AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 3: MessagesPage.tsx — 2 Avatar occurrences (lines ~355 and ~510)**

`conversation.participant.is_premium` is now available.

```tsx
// Both occurrences:
<PremiumAvatar isPremium={conversation.participant.is_premium ?? false} className="h-12 w-12 border border-border/70">
  <AvatarImage src={conversation.participant.avatar_url || undefined} />
  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -20
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/chat/MessageBubble.tsx packages/web/src/components/common/ChatDrawer.tsx packages/web/src/pages/MessagesPage.tsx
git commit -m "feat: show premium ring on chat and message avatars"
```

---

## Task 9: Other Social UI Surfaces

**Files:**
- Modify: `packages/web/src/components/modals/ContactLandlordModal.tsx`
- Modify: `packages/web/src/components/listings/ListingHostCard.tsx`
- Modify: `packages/web/src/pages/landlord/components/LandlordBookingCard.tsx`

These surfaces render landlord/host/renter profiles. The data comes from existing queries that join `users` — verify `is_premium` is available in each data object. If the Supabase select uses `users(*)` (e.g. `bookings.ts:56` uses `landlord:users!bookings_landlord_id_fkey (*)`), `is_premium` is already included automatically.

- [ ] **Step 1: ContactLandlordModal.tsx**

Identify what prop contains the landlord's profile and whether `is_premium` is present. If the modal receives a landlord object from `ContactLandlordModalProps`, add `is_premium?: boolean` to that interface and pass it from the caller.

Replace Avatar:
```tsx
<PremiumAvatar isPremium={landlord.is_premium ?? false} className="...existing className...">
  <AvatarImage src={landlord.avatar_url || undefined} />
  <AvatarFallback>...</AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 2: ListingHostCard.tsx**

Same pattern — replace Avatar with PremiumAvatar using the host's `is_premium`.

- [ ] **Step 3: LandlordBookingCard.tsx** — renter avatar

`booking.renter` comes from `bookings.ts:74` which uses `renter:users!bookings_renter_id_fkey (*)` — `is_premium` included automatically.

```tsx
<PremiumAvatar isPremium={booking.renter?.is_premium ?? false} className="h-10 w-10 border border-border">
  <AvatarImage src={booking.renter?.avatar_url || undefined} />
  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs text-primary">
    {guestInitials}
  </AvatarFallback>
</PremiumAvatar>
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -20
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/modals/ContactLandlordModal.tsx packages/web/src/components/listings/ListingHostCard.tsx packages/web/src/pages/landlord/components/LandlordBookingCard.tsx
git commit -m "feat: show premium ring on landlord, host, and renter avatars"
```

---

## Task 10: RoomDetailPage — Convert Raw `<img>` Avatars

**Files:**
- Modify: `packages/web/src/pages/RoomDetailPage.tsx`
- Modify: `packages/web/src/services/reviews.ts` (already done in Task 4)

`room.landlord` data comes from the rooms query. Verify it includes `is_premium` (check what `rooms` query selects for `landlord`). If it uses `landlord:users(*)` or lists fields explicitly, add `is_premium` if not already included.

- [ ] **Step 1: Convert reviewer avatar (line ~586)**

```tsx
// BEFORE:
<div className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-highest">
  <img src={review.reviewer?.avatar_url || ...} alt={...} className="h-full w-full object-cover" />
</div>

// AFTER:
<PremiumAvatar isPremium={review.reviewer?.is_premium ?? false} className="h-12 w-12">
  <AvatarImage src={review.reviewer?.avatar_url || undefined} className="object-cover" />
  <AvatarFallback className="bg-surface-container-highest text-sm">
    {(review.reviewer?.full_name || 'K')[0]}
  </AvatarFallback>
</PremiumAvatar>
```

Add imports: `import { PremiumAvatar } from "@/components/ui/PremiumAvatar"; import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";`

Also add `is_premium: boolean` to the reviewer type used in RoomDetailPage (wherever `review.reviewer` is typed).

- [ ] **Step 2: Convert host avatar (line ~632)**

The host avatar uses a `div` wrapper with `ring-4 ring-primary-container/20` — remove that ring (premium ring replaces it for premium hosts, and non-premium gets no ring).

```tsx
// BEFORE:
<div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-surface-container-high ring-4 ring-primary-container/20">
  <img src={hostAvatar} alt={room.landlord?.full_name || "Chủ nhà"} className="h-full w-full object-cover" />
</div>

// AFTER:
<PremiumAvatar isPremium={room.landlord?.is_premium ?? false} className="mx-auto mb-4 h-24 w-24">
  <AvatarImage src={hostAvatar} className="object-cover" alt={room.landlord?.full_name || "Chủ nhà"} />
  <AvatarFallback className="bg-surface-container-high text-2xl">
    {(room.landlord?.full_name || 'C')[0]}
  </AvatarFallback>
</PremiumAvatar>
```

Verify `room.landlord` is typed with `is_premium` (check the rooms query in the data-fetching hook/service for RoomDetailPage).

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -i error | head -20
```

- [ ] **Step 4: Final smoke test**

```bash
npm run dev
```

Open browser: navigate to Community, Roommate, Messages, a Room Detail page, and your own Profile. Confirm:
- Your own avatar shows ring if you are premium
- Other premium users' avatars show ring
- Non-premium avatars look identical to before

- [ ] **Step 5: Final commit**

```bash
git add packages/web/src/pages/RoomDetailPage.tsx
git commit -m "feat: show premium ring on room reviewer and host avatars"
```
