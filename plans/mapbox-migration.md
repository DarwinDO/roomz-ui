# Mapbox Migration Guide

## Tóm tắt

Đã chuyển từ Google Maps sang Mapbox để tiết kiệm chi phí (50,000 free loads/month thay vì phải trả trước 250k VND cho Google Maps).

## Các thay đổi đã thực hiện

### 1. Web Components mới

#### `MapboxRoomMap.tsx`
- Hiển thị bản đồ với markers cho tất cả phòng
- Click marker để xem thông tin phòng
- Auto-fit bounds cho multi-room view
- Custom popup với thông tin phòng và nút điều hướng
- Hỗ trợ radius circle (nếu có center point)

#### `MapboxGeocoding.tsx`
- Autocomplete địa chỉ sử dụng Mapbox Geocoding API
- Debounce 300ms để giảm API calls
- Filter: country=vn, language=vi
- Trả về: address, lat, lng, city, district

### 2. Các trang đã cập nhật

| File | Thay đổi |
|------|----------|
| `SearchPage.tsx` | GoogleRoomMap → MapboxRoomMap |
| `RoomDetailPage.tsx` | GoogleRoomMap → MapboxRoomMap |
| `MapModal.tsx` | GoogleRoomMap → MapboxRoomMap |
| `main.tsx` | Xóa GoogleMapsProvider wrapper |
| `index.ts` (maps) | Thêm export Mapbox components |

### 3. Environment Variables

```env
# Mapbox (REQUIRED)
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here

# Google Maps (legacy - optional)
# VITE_GOOGLE_MAPS_API_KEY=your_google_api_key
```

## Cách lấy Mapbox Access Token

1. Vào https://account.mapbox.com/access-tokens
2. Đăng ký/đăng nhập tài khoản
3. Click "Create a token"
4. Đặt tên token (ví dụ: "RoomZ Production")
5. Chọn scopes: **Public scopes** (đủ cho web)
6. Copy token bắt đầu bằng `pk.`
7. Paste vào `.env` và `.env.example`

## Sử dụng Mapbox Components

### Basic Map
```tsx
import { MapboxRoomMap } from '@/components/maps';

<MapboxRoomMap
  rooms={rooms}
  className="h-[400px]"
/>
```

### Single Room Map
```tsx
<MapboxRoomMap
  rooms={[room]}
  singleRoom
  interactive={false}
  className="h-[350px]"
/>
```

### With Radius Circle
```tsx
<MapboxRoomMap
  rooms={rooms}
  showRadius
  radiusKm={2}
  center={[106.6297, 10.8231]}
/>
```

### Geocoding Autocomplete
```tsx
import { MapboxGeocoding } from '@/components/maps';

<MapboxGeocoding
  value={address}
  onChange={setAddress}
  onSelect={(place) => {
    console.log(place.lat, place.lng);
    console.log(place.city, place.district);
  }}
  placeholder="Nhập địa chỉ..."
/>
```

## So sánh: Google Maps vs Mapbox

| Feature | Google Maps | Mapbox |
|---------|-------------|--------|
| Free tier | $200 credit (~40k loads) | 50,000 loads/month |
| Upfront cost | 250k VND (nếu cần nhiều hơn) | Free |
| Vietnam data | Rất tốt | Tốt |
| Satellite view | Có | Có |
| Street View | Có | Không |
| Autocomplete | Places API (tính phí) | Geocoding API (miễn phí) |
| Performance | Tốt | Tốt |
| Custom styling | Hạn chế | Rất linh hoạt |

## Troubleshooting

### Lỗi "Mapbox chưa được cấu hình"
- Kiểm tra `VITE_MAPBOX_ACCESS_TOKEN` trong `.env`
- Token phải bắt đầu bằng `pk.`
- Restart dev server sau khi thay đổi .env

### Không hiển thị bản đồ
- Kiểm tra console cho lỗi
- Đảm bảo container có height (không phải 0)
- Kiểm tra rooms có latitude/longitude hợp lệ

### Geocoding không hoạt động
- Token phải có quyền Geocoding
- Địa chỉ phải có ít nhất 3 ký tự
- Debounce sẽ tự động giảm API calls

## Migration từ Google Maps (nếu cần quay lại)

Nếu cần quay lại Google Maps:

1. Restore `main.tsx` với `GoogleMapsProvider`
2. Đổi imports từ `MapboxRoomMap` → `GoogleRoomMap`
3. Đổi imports từ `MapboxGeocoding` → `PlacesAutocomplete`
4. Thêm `VITE_GOOGLE_MAPS_API_KEY` vào .env

Các file Google Maps vẫn giữ lại trong codebase:
- `GoogleMapsProvider.tsx`
- `GoogleRoomMap.tsx`
- `PlacesAutocomplete.tsx`
