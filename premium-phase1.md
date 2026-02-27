# Premium Subscription Phase 1 - Implementation Plan

## Goal
Implement Phase 1 of RoomZ Premium Subscription feature: Fix pricing inconsistencies, create database tables, consolidate 3-tier to 2-tier (Free + RoomZ+ at 49k/month), and Early Bird promo 24.5k UI.

## Context
- **Branch:** `KAN-67-dev-developing-premium-package-and-implementing-payment-method`
- **Tech Stack:** Next.js, TypeScript, Supabase (PostgreSQL), Tailwind CSS
- **Agents Applied:** backend-specialist, frontend-specialist, security-auditor

---

## Tasks

### Task 1: Database Migration - Create subscription tables
- [ ] **1.1:** Create migration file `supabase/migrations/20260227_premium_subscriptions.sql`
  - [ ] Create `subscriptions` table with fields: id, user_id, plan (free/roomz_plus), status, promo_applied, current_period_start, current_period_end, cancel_at_period_end, payment_method, created_at, updated_at
  - [ ] Create `app_configs` table for promo config (promo_slot_limit, promo_active)
  - [ ] Create `phone_number_views` table for tracking daily phone views
  - [ ] Create `promo_status` view to show available slots
  - [ ] Create `get_room_contact(p_room_id UUID)` RPC function with premium logic (unlimited vs 3/day limit)
  - [ ] Add RLS policies for all tables
- [ ] **Verify:** Run SQL migration against Supabase

### Task 2: Fix Pricing Inconsistency - Consolidate hardcoded prices
- [ ] **2.1:** Update `src/components/modals/UpgradeRoomZPlusModal.tsx`
  - [ ] Replace hardcoded "49.000đ" → import from PLANS constant
- [ ] **2.2:** Update `src/pages/roommates/components/results/LimitHitModal.tsx`
  - [ ] Replace hardcoded "49.000đ" → import from PLANS constant
- [ ] **2.3:** Update `src/pages/profile/components/UpgradeBanner.tsx`
  - [ ] Replace hardcoded prices → import from PLANS constant
- [ ] **2.4:** Update `src/pages/roommates/components/results/LimitsBar.tsx`
  - [ ] Check and sync pricing text with PLANS constant
- [ ] **Verify:** Grep for "49.000", "99.000", "199.000" - should find only in PLANS constant

### Task 3: Consolidate Plans + Payment Adapter
- [ ] **3.1:** Update `src/services/payments.ts`
  - [ ] Remove `roomz_pro` from PLANS array
  - [ ] Keep only 2 plans: `free` and `roomz_plus`
  - [ ] Update roomz_plus: price: 49000, add quarterlyPrice: 119000
  - [ ] Update SubscriptionPlan type: `'free' | 'roomz_plus'`
  - [ ] Update hasPremiumAccess() to check only roomz_plus
  - [ ] Add getPromoStatus() function to fetch promo_status view
  - [ ] Create PaymentAdapter interface
  - [ ] Create MockPaymentAdapter implementing PaymentAdapter
- [ ] **Verify:** `npx tsc --noEmit` passes

### Task 4: Redesign PaymentPage
- [ ] **4.1:** Update `src/pages/PaymentPage.tsx`
  - [ ] Change 3-column → 2-column layout (Free vs RoomZ+)
  - [ ] Add billing toggle: Monthly 49k / Quarterly 119k (save 19%)
  - [ ] Add Early Bird bar: "🔥 Chỉ còn {remaining}/{total} slot giá 24.500đ"
  - [ ] Remove roomz_pro card
  - [ ] Update RoomZ+ features list:
    - ♾️ Xem SĐT không giới hạn (thay vì 3/ngày)
    - ♾️ Lưu phòng yêu thích không giới hạn
    - ♾️ Roommate views & requests không giới hạn
    - 👑 Badge premium trên profile
    - 🎁 Deal độc quyền Local Passport
    - ⚡ Ưu tiên hiển thị
    - 🛡️ Duyệt xác thực nhanh
    - 📞 Hỗ trợ ưu tiên 24/7
  - [ ] Mobile responsive: stack 1 column
- [ ] **Verify:** Page renders correctly on mobile and desktop

### Task 5: Merge Upgrade Modals
- [ ] **5.1:** Update `src/components/modals/UpgradeRoomZPlusModal.tsx`
  - [ ] Change "Xác nhận nâng cấp" button → navigate('/payment')
  - [ ] Import price from PLANS constant
- [ ] **5.2:** Update `src/pages/roommates/components/results/LimitHitModal.tsx`
  - [ ] Change "Nâng cấp Premium" button → navigate('/payment')
  - [ ] Import price from PLANS constant
- [ ] **Verify:** Buttons navigate to /payment page

### Task 6: Update UpgradeBanner
- [ ] **6.1:** Update `src/pages/profile/components/UpgradeBanner.tsx`
  - [ ] Sync price with PLANS constant
  - [ ] Update CTA → navigate('/payment')
  - [ ] Update benefits list
- [ ] **Verify:** Banner displays correct price and navigates properly

---

## Verification Criteria
- [ ] `npx tsc --noEmit` — No type errors
- [ ] `npm run build` — Build succeeds
- [ ] Grep: hardcoded 49.000, 99.000, 199.000 → NOT FOUND (except PLANS constant)
- [ ] SQL migration syntax is valid
- [ ] No purple/violet colors used (Purple Ban compliance)
- [ ] Code comments/variables in English, UI text in Vietnamese
- [ ] TypeScript strict mode — no `any` type

---

## Notes
- **Purple Ban:** DO NOT use purple/violet colors (per frontend-specialist agent rules)
- **Design:** Mobile-first, Tailwind CSS
- **Security:** RLS policies must be properly configured (per security-auditor agent)
- **Database:** Use database-design skill principles for schema optimization
