# SwapRoom Redesign - Implementation Plan

## Goal
Đơn giản hóa SwapRoom từ **6 bảng / 24 trạng thái** xuống **3 bảng / ~9 trạng thái + 1 RPC function**.

---

## Tasks

### Phase 1: Database Migration (Supabase MCP)
- [ ] Tạo migration `20260212_swap_room_v2.sql`
  - Tạo 3 bảng mới: `sublet_listings`, `sublet_applications`, `swap_requests`
  - Tạo RPC function `get_potential_matches(p_user_id UUID)`
  - Setup RLS policies
  - Xóa bảng cũ: `swap_matches`, `swap_agreements`, `sublet_reviews`
- [ ] Apply migration qua Supabase MCP
- [ ] Xóa 2 migration cũ: `20260211_swap_room_feature.sql`, `20260211_swap_room_fixes.sql`

### Phase 2: Types Refactor
- [ ] Update `src/types/swap.ts`
  - Xóa types: `SwapMatch`, `SwapMatchRow`, `SwapAgreement`, `SwapAgreementRow`, `SubletReview`, `SubletReviewRow`, `AgreementStatus`, `SwapMatchFilters`, `SwapMatchResponse`, `SwapMatchCardProps`
  - Giản lược enums: `SubletStatus` → 3 values, `SwapRequestStatus` → 3 values, `ApplicationStatus` → 3 values
  - Thêm `PotentialMatch` type

### Phase 3: Services Refactor
- [ ] Update `src/services/swap.ts`
  - Xóa `fetchSwapMatches()`, `swipeMatch()`
  - Thêm `fetchPotentialMatches()` → gọi RPC
- [ ] Update `src/services/sublets.ts` - chỉ cập nhật imports
- [ ] Delete `src/services/swapNotifications.ts`

### Phase 4: Hooks Refactor
- [ ] Update `src/hooks/useSwap.ts`
  - Xóa `useSwipeMatch()`
  - Đổi `useSwapMatches()` → gọi `fetchPotentialMatches()`
- [ ] Update `src/hooks/useSublets.ts` - chỉ cập nhật imports

### Phase 5: Pages & Components Refactor
- [ ] Update `src/pages/SwapMatchesPage.tsx`
  - Bỏ swipe mechanism (handlePass + useSwipeMatch)
  - Dùng `useSwapMatches()` mới (RPC-based)
  - Mỗi match → nút "Gửi yêu cầu hoán đổi" trực tiếp
- [ ] Update `src/components/swap/SwapMatchCard.tsx`
  - Bỏ nút "Pass/Skip", thay bằng nút "Gửi yêu cầu" trực tiếp
- [ ] Delete `src/components/modals/BookSubletModal.tsx`

### Phase 6: Verification
- [ ] Build check: `npm run build`
- [ ] Test các flows: /swap, /my-sublets, /swap-matches, /swap-requests

---

## Verification Criteria
- [ ] Chỉ còn 3 bảng trong database
- [ ] RPC function `get_potential_matches` hoạt động
- [ ] Types đã được giản lược
- [ ] Không còn dead code (swap_matches, swap_agreements, sublet_reviews)
- [ ] Build thành công
