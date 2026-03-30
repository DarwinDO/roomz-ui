---
phase: implementation
task: romi-and-rommzplus-stitch-port
date: 2026-03-27
status: completed
---

# Task Log: Romi And RommZ+ Stitch Port

## Goal

- Port the reviewed Stitch chatbot and premium purchase screens into the web app
- Change RommZ+ pricing from `49.000đ/tháng` to `39.000đ/tháng`
- Keep the premium purchase page accessible even when the user already has an active subscription

## Files

- Updated `packages/web/src/pages/RomiPage.tsx`
- Updated `packages/web/src/pages/PaymentPage.tsx`
- Updated `packages/web/src/router/router.tsx`
- Updated `packages/web/src/components/common/Chatbot.tsx`
- Updated `packages/web/src/components/common/BottomNav.tsx`
- Updated `packages/web/src/pages/ProfilePage.tsx`
- Updated `packages/web/src/pages/profile/components/UpgradeBanner.tsx`
- Updated `packages/web/src/pages/profile/components/SettingsTab.tsx`
- Updated `packages/web/src/pages/roommates/components/results/LimitHitModal.tsx`
- Updated `packages/web/src/config/payment.config.ts`
- Updated `packages/shared/src/constants/romi.ts`
- Updated `packages/web/src/services/romi.test.ts`
- Updated `packages/web/src/services/payments.test.ts`
- Updated `supabase/seeds/staging_demo.sql`
- Added `supabase/migrations/20260327153000_update_rommz_plus_pricing_to_39k.sql`

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- Live verification against Supabase project `vevnoxlgwisdottaifdn`: `public.create_checkout_order` now includes `39000` monthly pricing and `99000` quarterly pricing

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/planning/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Manually review `/romi` with real chat history and room-context suggestions
- Manually review `/payment` in both free-user and active-premium states
- If the new utility surfaces pass review, decide whether to freeze the desktop scope or continue into mobile mapping
