# RoomZ Audit Report - Dev Lifecycle Analysis

**Date:** 2026-03-09  
**Scope:** Tìm phòng, Tìm bạn cùng phòng, SwapRoom, Dịch vụ, Cộng đồng, Ưu đãi  
**Status:** 🔴 DRAFT - Cần xác nhận

---

## 📊 Executive Summary

| Feature | Code Status | DB Status | Issues Count |
|---------|-------------|-----------|--------------|
| Tìm phòng | 🟡 70% | 🟢 Complete | 5 |
| Tìm bạn cùng phòng | 🟡 60% | 🟢 Complete | 7 |
| SwapRoom | 🔴 40% | 🟡 Partial | 8 |
| Dịch vụ | 🟡 50% | 🟡 Partial | 6 |
| Cộng đồng | 🟡 55% | 🟢 Complete | 5 |
| Ưu đãi | 🟡 65% | 🟢 Complete | 4 |
| Premium | 🔴 50% | 🟡 Partial | 6 |

---

## 1. 🔍 Tìm phòng (Room Search)

### ✅ Hoạt động
- Room listing và search cơ bản
- Filtering theo price, district, room type
- Room detail page với images, amenities

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🔴 HIGH | Filter `status` không nhất quán - code dùng 'active', DB có thể dùng 'available' | `packages/shared/src/services/rooms.ts` | Thống nhất status enum |
| 2 | 🟡 MEDIUM | Missing index trên `district`, `price_per_month` | Database | Add index |
| 3 | 🟡 MEDIUM | Favorite count không update real-time | `rooms.ts` | Add trigger |
| 4 | 🟡 MEDIUM | Room images không có lazy loading | `RoomCard.tsx` | Optimize images |
| 5 | 🟢 LOW | Missing SEO metadata cho room pages | `RoomDetailPage.tsx` | Add meta tags |

### 📝 Code Quality
```typescript
// Issue: Inconsistent status check
// File: packages/shared/src/services/rooms.ts
.eq('status', 'active')  // Should be 'available'?
.is('deleted_at', null) // Good - soft delete
```

---

## 2. 🔍 Tìm bạn cùng phòng (Roommate Finder)

### ✅ Hoạt động
- Setup wizard (Location → Quiz → Profile)
- Profile visibility toggle (3 states)
- Compatibility score calculation

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🔴 HIGH | Quiz answers storage chưa rõ ràng - lưu ở đâu? | `roommates.ts` | Xác định rõ schema |
| 2 | 🔴 HIGH | Real-time subscription cho requests có thể broken | `useRoommatesQuery.ts` | Test kỹ subscription |
| 3 | 🟡 MEDIUM | Premium limits enforcement chưa đầy đủ | `FREE_LIMITS` | Add kiểm tra đầy đủ |
| 4 | 🟡 MEDIUM | Compatibility score logic cần review | RPC function | Test edge cases |
| 5 | 🟡 MEDIUM | Missing index trên `roommate_profiles.user_id` | Database | Add unique index |
| 6 | 🟢 LOW | UI - RoommateCard chưa responsive | `RoommateCard.tsx` | Fix mobile |
| 7 | 🟢 LOW | Missing empty state khi không có matches | `RoommateResults.tsx` | Add UI |

### 📝 Code Quality
```typescript
// Issue: Potential null reference
// File: packages/web/src/hooks/useRoommatesQuery.ts
const { data: profile } = await getRoommateProfile(supabase, user.id);
// Missing: check if profile exists before using
```

---

## 3. 🔍 SwapRoom (Sublet + Swap)

### ✅ Hoạt động
- Sublet listing cơ bản
- Swap request flow

### ❌ Issues Found (NHIỀU NHẤT!)

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🔴 HIGH | **Thiết kế phức tạp** - 6 tables → 3 tables nhưng chưa complete | Migration 20260212 | Review migration |
| 2 | 🔴 HIGH | **Missing RPC function** `get_potential_matches` chưa rõ | Database | Verify function exists |
| 3 | 🔴 HIGH | Swap status management phức tạp (24 states) | `SwapRequestDialog.tsx` | Simplify states |
| 4 | 🟡 MEDIUM | Sublet applications missing review flow | UI | Add approval workflow |
| 5 | 🟡 MEDIUM | Missing index trên `sublet_listings.owner_id` | Database | Add index |
| 6 | 🟡 MEDIUM | Date validation chưa đầy đủ (end_date > start_date) | `SubletCard.tsx` | Add validation |
| 7 | 🟢 LOW | Swap matching algorithm cần optimize | RPC | Review performance |
| 8 | 🟢 LOW | Missing notifications cho status changes | Edge Functions | Add triggers |

### 📝 Code Quality
```typescript
// Issue: Complex status enum
// File: packages/shared/src/types/swap.ts
type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'expired' | 'disputed' | ...; // Too many!
```

---

## 4. 🔍 Dịch vụ (Partners & Services)

### ✅ Hoạt động
- Partner listing theo category
- Partner categories: moving, cleaning, real_estate, utilities, furniture

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🔴 HIGH | Service leads flow incomplete - không rõ user flow | `serviceLeads.ts` | Define full flow |
| 2 | 🟡 MEDIUM | Rating system chưa implement | `partners.ts` | Add ratings |
| 3 | 🟡 MEDIUM | Partner verification chưa complete | Admin panel | Add approval flow |
| 4 | 🟡 MEDIUM | Missing search/filter theo city | `PartnersPage.tsx` | Add filters |
| 5 | 🟢 LOW | Partner contact info protection | RLS policies | Review policies |
| 6 | 🟢 LOW | Missing analytics cho partner performance | Dashboard | Add metrics |

---

## 5. 🔍 Cộng đồng (Community)

### ✅ Hoạt động
- Post creation (discussion, question, review, advice, news)
- Comment system
- Basic filtering

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🟡 MEDIUM | Likes/reactions chưa implement | `community.ts` | Add feature |
| 2 | 🟡 MEDIUM | Report/moderation system incomplete | UI | Add report flow |
| 3 | 🟡 MEDIUM | Real-time updates cho posts không hoạt động | `CommunityPage.tsx` | Fix subscription |
| 4 | 🟡 MEDIUM | Post pagination có thể slow | RPC | Add cursor pagination |
| 5 | 🟢 LOW | Image upload size limit chưa validate | `CreatePostModal.tsx` | Add validation |

---

## 6. 🔍 Ưu đãi (Deals & Vouchers)

### ✅ Hoạt động
- Deal listing theo partner
- Voucher validation
- QR code generation

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🟡 MEDIUM | Voucher usage tracking không chính xác | `deals.ts` | Add usage limit |
| 2 | 🟡 MEDIUM | QR code generation có thể broken | `deals.ts` | Test thoroughly |
| 3 | 🟡 MEDIUM | Deal expiration không auto-update | Database | Add cron job |
| 4 | 🟢 LOW | Premium-only deals chưa enforce đúng | `useDeals.ts` | Add check |

---

## 7. 🔍 Premium Subscriptions

### ✅ Hoạt động
- Subscription creation via SePay
- Plan management (Free + RoomZ+)

### ❌ Issues Found

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | 🔴 HIGH | **Webhook race condition** - duplicate subscriptions possible | `sepay-webhook` | Add transaction lock |
| 2 | 🔴 HIGH | Plan check logic inconsistency (đã fix 20260309082125) | Migration | Verify fix applied |
| 3 | 🔴 HIGH | Migration mismatch - local vs remote (~100 vs ~30) | Database | Repair migrations |
| 4 | 🟡 MEDIUM | Cron job cleanup có thể miss edge cases | `20260228_subscription_cron.sql` | Test thoroughly |
| 5 | 🟡 MEDIUM | Subscription status sync issues | `payments.ts` | Add reconciliation |
| 6 | 🟢 LOW | Missing refund flow | Admin panel | Add feature |

---

## 🗂️ Database Issues

### Critical
| Issue | Description |
|-------|-------------|
| Migration History Mismatch | Remote: ~100 migrations, Local: ~30 files |
| Missing RLS Policies | Một số tables có thể thiếu |
| Index Gaps | Foreign keys chưa có indexes |

### Recommendations
```sql
-- Add missing indexes
CREATE INDEX idx_roommate_profiles_user ON roommate_profiles(user_id);
CREATE INDEX idx_sublets_owner ON sublet_listings(owner_id);
CREATE INDEX idx_rooms_district_price ON rooms(district, price_per_month);
```

---

## 📋 TODO/FIXME Found in Code

| Location | Issue |
|----------|-------|
| `docs/features/ROOMMATE_FINDER.md` | "Next Steps" - chưa hoàn thành |
| `plans/codebase-audit-remediation.md` | Nhiều tasks cần làm |
| `swap-room-redesign.md` | Phase chưa complete |

---

## 🎯 Recommendations Priority

### P0 - Critical (Fix ngay)
1. Repair migration history
2. Fix webhook race condition
3. Complete SwapRoom redesign
4. Fix roommate real-time subscriptions

### P1 - High (Tuần này)
1. Thống nhất room status enum
2. Complete service leads flow
3. Add likes/reactions to community
4. Fix voucher usage tracking

### P2 - Medium (Sprint này)
1. Add missing database indexes
2. Complete premium features
3. Add partner ratings
4. Optimize pagination

---

## 🔧 Next Steps

1. [ ] Xác nhận các issues đã identify
2. [ ] Priority hóa theo business impact
3. [ ] Tạo tasks trong project management
4. [ ] Assign cho developers

---

*Report generated using @dev-lifecycle skill*

