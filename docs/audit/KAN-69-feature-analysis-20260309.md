# KAN-69 Feature Analysis - Dev Lifecycle + Supabase MCP

- Date: 2026-03-09
- Scope: Tìm phòng, Tìm bạn cùng phòng, SwapRoom, Dịch vụ, Cộng đồng, Ưu đãi
- Method: Code audit + build verification + Supabase MCP database audit
- Project: `roomz-ui`

---

## 1) Kết quả tổng quan

- Tổng số lỗi chính: 10
- Mức độ:
- `Critical`: 1
- `High`: 5
- `Medium`: 4

| ID | Severity | Feature | Tóm tắt |
|---|---|---|---|
| C-01 | Critical | All | Thiếu `@/lib/database.types` làm build fail |
| H-01 | High | Tìm phòng | Filter `pet_allowed`/`furnished` mapping sai |
| H-02 | High | Tìm phòng | Có đường lộ `landlord_phone` trong search payload |
| H-03 | High | Dịch vụ | `status='rated'` không hợp lệ với DB check constraint |
| H-04 | High | SwapRoom | Shared service lệch schema thực (`user_id`, RPC sai tên) |
| H-05 | High | Cộng đồng | Shared service/types lệch lớn với schema DB hiện tại |
| M-01 | Medium | Ưu đãi | Category map UI không cover dữ liệu DB thực tế |
| M-02 | Medium | SwapRoom | Ép kiểu unsafe + default date giả trong request dialog flow |
| M-03 | Medium | Tìm bạn cùng phòng | Shared enum drift so với enum DB |
| M-04 | Medium | DB | Security/performance advisories ảnh hưởng trực tiếp luồng chính |

---

## 2) Bằng chứng kiểm chứng đã chạy

- Build:
- Command: `npm run build --workspace=@roomz/web`
- Kết quả: `failed`
- Lỗi nổi bật: `Cannot find module '@/lib/database.types'`

- Lint:
- Command: `npx ai-devkit@latest lint`
- Kết quả: `passed` (không thay đổi kết luận lỗi nghiệp vụ/type drift)

- Supabase MCP:
- Project id: `vevnoxlgwisdottaifdn`
- Đã kiểm tra: function signatures, check constraints, enums, policies, advisors

---

## 3) Chi tiết lỗi theo mức độ

### C-01 - Build blocker toàn hệ thống
- Feature ảnh hưởng: tất cả (bao gồm 6 module trong scope)
- Mô tả:
- Nhiều file import `@/lib/database.types` nhưng file không tồn tại trong `packages/web/src/lib`.
- Bằng chứng file:
- `packages/web/src/contexts/AuthContext.tsx:15`
- `packages/web/src/services/roommates.ts:7`
- `packages/web/src/services/partners.ts:6`
- `packages/web/src/services/serviceLeads.ts:6`
- Tác động:
- Không thể build release.
- Type-check fail hàng loạt ở service/hooks/pages.

### H-01 - Tìm phòng: filter `pet_allowed` và `furnished` bị sai luồng
- Mô tả:
- UI đưa `pet_allowed` và `furnished` vào danh sách `amenities`, trong khi RPC `search_rooms` xử lý 2 cờ này bằng params riêng.
- Bằng chứng code:
- `packages/web/src/pages/SearchPage.tsx:54`
- `packages/web/src/pages/SearchPage.tsx:118`
- `packages/web/src/pages/SearchPage.tsx:119`
- `packages/shared/src/services/rooms.ts:248`
- `packages/shared/src/services/rooms.ts:249`
- Tác động:
- User tick đúng filter nhưng kết quả search không đúng kỳ vọng.

### H-02 - Tìm phòng: rủi ro lộ số điện thoại landlord
- Mô tả:
- Search transform map trực tiếp `landlord_phone` vào object trả ra client.
- Trong DB đã có luồng premium-gate riêng qua RPC `get_room_contact` để mask/unmask + log `phone_number_views`.
- Bằng chứng code:
- `packages/shared/src/services/rooms.ts:219`
- `packages/shared/src/services/rooms.ts:465`
- Bằng chứng DB:
- `public.search_rooms(...)` trả cột `landlord_phone`.
- `public.get_room_contact(uuid)` có logic giới hạn ngày + masking.
- Tác động:
- Có thể bypass business rule premium nếu UI hoặc consumer đọc phone từ payload search.

### H-03 - Dịch vụ: `rated` không khớp constraint DB
- Mô tả:
- Service web update `service_leads.status = 'rated'`.
- DB constraint chỉ cho: `submitted | partner_contacted | confirmed | completed | cancelled`.
- Bằng chứng code:
- `packages/web/src/services/serviceLeads.ts:150`
- `packages/shared/src/types/serviceLeads.ts:11`
- Bằng chứng DB:
- `service_leads_status_check`
- Tác động:
- Action đánh giá dịch vụ có thể fail khi ghi DB.

### H-04 - SwapRoom: shared service lệch schema thật
- Mô tả:
- Shared service swap dùng cột `sublet_listings.user_id` (không tồn tại, DB dùng `owner_id`).
- Shared service gọi RPC `find_swap_matches` (DB hiện có `find_potential_swap_matches`, `get_potential_matches`).
- Bằng chứng code:
- `packages/shared/src/services/swap.ts:66`
- `packages/shared/src/services/swap.ts:76`
- `packages/shared/src/services/swap.ts:147`
- Bằng chứng DB:
- `sublet_listings` columns có `owner_id`, không có `user_id`.
- Functions có `find_potential_swap_matches(uuid, integer)` và `get_potential_matches(uuid)`.
- Tác động:
- Bất kỳ luồng nào dùng shared swap service có nguy cơ lỗi runtime ngay.

### H-05 - Cộng đồng: shared layer không đồng bộ schema hiện tại
- Mô tả:
- Shared community service dùng model/status/table/rpc không khớp DB hiện tại.
- Ví dụ:
- Status đọc `published`, tạo `status='published'`, soft delete `deleted`.
- Dùng `community_upvotes`, `community_categories` không có trong schema.
- Bằng chứng code:
- `packages/shared/src/services/community.ts:79`
- `packages/shared/src/services/community.ts:154`
- `packages/shared/src/services/community.ts:209`
- `packages/shared/src/services/community.ts:225`
- `packages/shared/src/services/community.ts:294`
- Bằng chứng DB:
- Bảng hiện có: `community_posts`, `community_comments`, `community_likes`, `community_reports`.
- `community_posts.status` check: `active | hidden | reported`.
- Tác động:
- Shared facade có thể trả dữ liệu sai/hỏng khi được dùng lại ở web/mobile.

### M-01 - Ưu đãi: mapping category không phủ dữ liệu thực
- Mô tả:
- UI map cố định 5 category (`coffee/fitness/entertainment/food/laundry`) và fallback về `food`.
- DB hiện có thêm `cleaning`, `gym`, `moving`, `other`.
- Bằng chứng code:
- `packages/web/src/pages/LocalPassportPage.tsx:109`
- `packages/web/src/pages/LocalPassportPage.tsx:117`
- Bằng chứng DB:
- `partners.category` distinct: `cleaning, coffee, entertainment, fitness, gym, moving, other`
- Active partners map đúng category config chỉ `4/10`.
- Tác động:
- Hiển thị icon/màu/category sai ngữ nghĩa, ảnh hưởng UX/filter.

### M-02 - SwapRoom: ép kiểu unsafe và dữ liệu ngày giả
- Mô tả:
- `SwapMatchesPage` dùng `as any` cho `start_date/end_date` và fallback ngày hiện tại.
- Truyền prop vào dialog bằng cast chéo `as unknown as ...`.
- Bằng chứng code:
- `packages/web/src/pages/SwapMatchesPage.tsx:61`
- `packages/web/src/pages/SwapMatchesPage.tsx:62`
- `packages/web/src/pages/SwapMatchesPage.tsx:169`
- `SwapRequestDialog` validate mạnh theo `targetSublet.start_date/end_date`.
- `packages/web/src/components/modals/SwapRequestDialog.tsx:80`
- Tác động:
- Có thể validate sai hoặc gửi request với khung thời gian không thực.

### M-03 - Tìm bạn cùng phòng: enum drift ở shared
- Mô tả:
- Shared service define `RoommateProfileStatus = 'draft' | 'active' | 'paused' | 'deleted'`.
- DB enum thật: `looking | paused | found`.
- Bằng chứng code:
- `packages/shared/src/services/roommates.ts:14`
- Bằng chứng DB:
- `roommate_profile_status`: `looking, paused, found`
- `roommate_request_status`: `pending, accepted, declined, cancelled, expired`
- Tác động:
- Tăng nguy cơ sai type/logic khi tái sử dụng shared layer.

### M-04 - DB advisory: security/performance debt trên luồng chính
- Mô tả:
- Security advisor:
- `function_search_path_mutable` trên các function quan trọng: `search_rooms`, `get_roommate_matches`, `get_potential_matches`.
- `public.payment_cleanup_logs` bị tắt RLS.
- Performance advisor:
- Nhiều FK chưa index ở bảng liên quan trực tiếp:
- `community_posts.user_id`
- `community_comments.user_id`
- `service_leads.(user_id, partner_id, assigned_by)`
- `sublet_listings.original_room_id`
- `swap_requests.(requester_listing_id, recipient_listing_id)`
- Tác động:
- Rủi ro bảo mật + giảm hiệu năng khi dữ liệu tăng.

---

## 4) Tóm tắt theo chức năng yêu cầu

### Tìm phòng
- Lỗi chính: H-01, H-02

### Tìm bạn cùng phòng
- Lỗi chính: M-03

### SwapRoom
- Lỗi chính: H-04, M-02

### Dịch vụ
- Lỗi chính: H-03

### Cộng đồng
- Lỗi chính: H-05

### Ưu đãi
- Lỗi chính: M-01

### Database (Supabase)
- Lỗi chính: M-04

---

## 5) Ưu tiên xử lý đề xuất

1. Fix `C-01` để hệ thống build được.
2. Fix `H-01`, `H-02`, `H-03` vì ảnh hưởng trực tiếp hành vi người dùng và dữ liệu nhạy cảm.
3. Đồng bộ shared layer cho `SwapRoom` và `Cộng đồng` (`H-04`, `H-05`).
4. Chuẩn hóa mapping category ưu đãi (`M-01`) và bỏ unsafe casts (`M-02`).
5. Tạo batch migration cho advisory DB (`M-04`) gồm:
- set `search_path` cho function
- bật/siết RLS
- thêm index FK trọng điểm.

---

## 6) Ghi chú

- Báo cáo này tổng hợp từ phiên audit codebase hiện tại + Supabase MCP tại thời điểm 2026-03-09.
- Chưa áp dụng fix code/migration trong báo cáo này, chỉ phân tích và định vị lỗi.
