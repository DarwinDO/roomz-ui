---
phase: implementation
title: Payment Order Subscription Reuse Fix
date: 2026-04-13
owner: Codex
status: completed
---

# Payment Order Subscription Reuse Fix

## Summary

- Fixed the SePay premium-payment path so users with an older subscription row can successfully repurchase RommZ+ without hitting `subscriptions_user_id_key`.
- Recovered the live failed order `ROMMZ20260413153241908678` after the fix was deployed.

## Problem

- `public.subscriptions` is intentionally modeled as one current state row per user via `UNIQUE(user_id)`.
- `process_payment_order` incorrectly searched only for `status = 'active'` before deciding whether to insert or update.
- If a user had an older `expired` or `cancelled` subscription row, the function failed to find it, then attempted a fresh insert for the same `user_id`.
- PostgreSQL rejected that insert with `duplicate key value violates unique constraint "subscriptions_user_id_key"`.
- The same function also updated `users.premium_until` directly, even though the canonical premium-cache sync already happens through `sync_user_premium_cache_on_subscriptions`.

## Changes

- Added `supabase/migrations/20260413222500_fix_payment_order_reuse_existing_subscription.sql`.
- Updated `process_payment_order` to:
  - lock the payment order row as before
  - lock any existing subscription row by `user_id`, regardless of status
  - reactivate and reuse that row when it exists
  - extend only when the existing subscription is truly active and unexpired
  - create a new subscription row only when the user has no row at all
- Removed the direct `UPDATE users SET is_premium / premium_until ...` from the payment function so the existing subscription trigger remains the only source of truth for premium cache sync.

## Live Recovery

- Confirmed the impacted order remained `pending` and unexpired at the time of intervention.
- Applied the migration to Supabase project `vevnoxlgwisdottaifdn`.
- Replayed:

```sql
select public.process_payment_order(
  'ROMMZ20260413153241908678',
  19500,
  'TF26104679222900',
  null::jsonb
);
```

- Verified the result:
  - `payment_orders.status = 'paid'`
  - the existing subscription row for the user is now `active`
  - `users.is_premium = true`
  - `users.premium_until = 2026-05-13 15:48:41+00`

## Validation

- Supabase migration apply on `vevnoxlgwisdottaifdn`
- Direct SQL replay and row verification on `payment_orders`, `subscriptions`, and `users`
- `npx ai-devkit@latest lint`
