# Listing Detail Shell Strategy

## Goal

Đồng nhất `RoomDetailPage` và `SubletDetailPage` trong cùng một hệ thiết kế để người dùng cảm nhận đây là một sản phẩm duy nhất, chỉ khác ngữ cảnh giao dịch.

## Shared shell

1. Media hero chung
2. Title + location block chung
3. Metric grid chung
4. Host card chung
5. Location context chung
6. Safety card chung

## Per-variant modules

### Room detail
- Đặt lịch xem
- Nhắn host
- Reveal số điện thoại
- Banner dẫn sang short-stay nếu phòng có lịch ở ngắn hạn

### Short-stay detail
- Đăng ký ở ngắn hạn
- Nhắn host
- Date range / giá ngắn hạn / điều kiện lưu trú
- Đơn đăng ký và chỉnh sửa nếu chính chủ tin đăng

## Language rules

- UI product dùng `host`, không dùng `landlord`
- UI product dùng `Ở ngắn hạn` / `thuê lại`, `hoán đổi` là lane phụ
- Internal schema có thể còn giữ `landlord_id`, `sublet_listings`, `swap_requests`

## Design rules

- Cùng visual hierarchy giữa room và short-stay
- Không có một page detail nào trông kém trưởng thành hơn page còn lại
- Tránh card hóa dư thừa; ưu tiên block rõ vai trò
