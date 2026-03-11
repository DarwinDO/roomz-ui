# Location Catalog Integration

## Goal
Đưa `location_catalog` vào trải nghiệm người dùng ở search, room detail, local passport và làm lại modal profile roommate.

## Tasks
- [ ] Tạo service đọc `location_catalog` và helper nearby/query suggestions -> Verify: service có test hoặc được gọi thành công từ app
- [ ] Nối gợi ý `location_catalog` vào SearchPage cùng Mapbox -> Verify: search hiển thị suggestion nội bộ và chọn được
- [ ] Thêm `nearby places` vào RoomDetailPage bằng khoảng cách từ room -> Verify: room detail hiển thị top nearby locations khi có lat/lng
- [ ] Dùng `location_catalog` để làm giàu LocalPassportPage -> Verify: có section địa điểm nổi bật hoặc gần bạn
- [ ] Redesign `RoommateProfileModal` -> Verify: modal mới rõ hierarchy, dùng đúng data hiện có
- [ ] Chạy lint, unit tests, build vùng ảnh hưởng -> Verify: tất cả pass

## Done When
- [ ] User thấy dữ liệu `location_catalog` trong app thay vì chỉ ở admin/review pipeline
- [ ] Modal profile roommate nhìn nhất quán hơn với phần match hiện tại
