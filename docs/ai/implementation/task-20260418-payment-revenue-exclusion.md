---
phase: implementation
title: Payment Revenue Exclusion Controls
date: 2026-04-18
owner: Codex
status: completed
---

# Payment Revenue Exclusion Controls

## Summary

- Added a lightweight admin-only path to exclude specific paid `payment_orders` from revenue reporting without deleting the row and without touching `subscriptions`.
- Kept the solution intentionally narrower than a refund / rollback flow so premium entitlements and payment audit history remain intact.
- Applied the migration live to Supabase project `vevnoxlgwisdottaifdn` and excluded the known test orders directly in the database.

## Problem

- Admin revenue totals were summing every `payment_orders.status = 'paid'` row.
- Test or internal payments therefore inflated `Tổng doanh thu`.
- Deleting or rolling back those rows would be unsafe because `subscriptions.amount_paid`, subscription periods, and the user premium cache are updated elsewhere during successful payment processing.

## Changes

- Added migration `supabase/migrations/20260418080439_add_payment_order_revenue_exclusion.sql`.
  - adds `payment_orders.exclude_from_revenue boolean not null default false`
  - adds admin `SELECT` policies for `payment_orders` and `manual_reviews`
  - adds admin-only RPC `public.set_payment_order_revenue_exclusion(uuid, boolean)`
- Updated shared Supabase database type files so the new column and RPC are typed in web code.
- Updated `packages/web/src/services/admin-payments.ts` to:
  - map `exclude_from_revenue`
  - expose `setPaymentOrderRevenueExclusion(...)`
  - compute `totalRevenue` from paid orders where `exclude_from_revenue = false`
  - expose `excludedRevenue` and `excludedPaidOrders` for admin reporting
- Reworked `packages/web/src/pages/admin/RevenuePage.tsx` to:
  - show whether a paid order is currently counted into revenue
  - allow admin to toggle `Loại khỏi doanh thu` / `Tính lại doanh thu`
  - surface a small summary note when excluded paid revenue exists
  - refresh data after manual-review actions and revenue-exclusion actions
- Applied the migration on live project `vevnoxlgwisdottaifdn`.
- Marked these known test orders as `exclude_from_revenue = true`:
  - `ROMMZ20260309081926686318`
  - `ROMMZ20260314160747161680`
  - `ROMMZ20260314164008586637`
  - `ROMMZ20260413153241908678`
  - `ROMMZ20260414011206990271`
  - `ROMMZ20260414011520542027`
  - `ROMMZ20260414144521871911`
- Live revenue verification after the exclusion pass:
  - `paid_orders = 30`
  - `paid_revenue_gross = 640000`
  - `excluded_paid_orders = 7`
  - `excluded_paid_revenue = 151500`
  - `paid_revenue_net = 488500`

## Validation

- `npx eslint packages/web/src/services/admin-payments.ts packages/web/src/services/admin-payments.test.ts packages/web/src/pages/admin/RevenuePage.tsx`
- `npm run test:unit --workspace=@roomz/web -- src/services/admin-payments.test.ts`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `mcp__supabase__apply_migration` on `vevnoxlgwisdottaifdn`: pass
- direct SQL verification on `vevnoxlgwisdottaifdn`: pass, migration version `20260418080439` with name `add_payment_order_revenue_exclusion` exists
- direct SQL verification on `vevnoxlgwisdottaifdn`: pass, `7` known test orders now have `exclude_from_revenue = true`
- direct SQL verification on `vevnoxlgwisdottaifdn`: pass, paid revenue net after exclusions = `488500`
- `mcp__supabase__get_advisors` security scan: returned pre-existing unrelated warnings only

## Follow-up

- No obvious `paid` orders currently exist for `@roomz.vn`; the excluded rows were the clearly test-like historical orders identified from the reported March-April list.
- If you want more historical rows excluded later, the safest next step is to review by exact `order_code` again instead of broad email-based matching.
