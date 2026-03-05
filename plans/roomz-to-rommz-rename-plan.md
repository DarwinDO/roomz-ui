# RoomZ → RommZ Rebrand Plan

> Plan chi tiết để đổi tên ứng dụng từ "RoomZ" sang "RommZ" (thêm chữ 'm' vào giữa)

---

## 🗺️ Tổng quan

- **Tổng số files cần đổi**: ~40 files
- **Độ phức tạp**: Medium (có 1 số thay đổi cần deploy migration)
- **Thứ tự ưu tiên**: Production-critical → Branding/UI → Documentation

---

## 🔴 Phase 1: Production-Critical (Deploy Required)

> **⚠️ CẢNH BÁO**: Các thay đổi này ảnh hưởng đến payment flow. Cần deploy cùng lúc.

### 1.1 Order Code Prefix (Payment System)

| # | File Path | Line(s) | Thay đổi | Ghi chú |
|---|-----------|---------|----------|---------|
| 1 | `packages/web/src/config/payment.config.ts` | 53 | `CODE_PREFIX: 'ROOMZ'` → `CODE_PREFIX: 'ROMMZ'` | **CORE CHANGE** - Ảnh hưởng tất cả order code mới |
| 2 | `packages/web/src/services/sepay.ts` | 104, 112 | Regex `/ROOMZ\d+/i` → `/ROMMZ\d+/i` | Extract & generate order code |
| 3 | `supabase/functions/sepay-webhook/index.ts` | 93 | `match(/ROOMZ\d+/i)` → `match(/ROMMZ\d+/i)` | Webhook order code extraction |
| 4 | `supabase/migrations/20260305_payment_webhook_race_fix.sql` | 227 | Comment: `The ROOMZ order code` → `The ROMMZ order code` | Documentation only |
| 5 | `supabase/migrations/20260305_webhook_audit_log.sql` | 19 | Comment: `(e.g., ROOMZ123)` → `(e.g., ROMMZ123)` | Documentation only |

**⚠️ Migration Strategy**:
```sql
-- Old orders vẫn dùng ROOMZ prefix (backward compatible)
-- New orders sẽ dùng ROMMZ prefix
-- Regex /ROOMZ\d+/i nên đổi thành /ROMMZ\d+/i để match cả 2 trong transition period
-- HOẶC: /(?:ROOMZ|ROMMZ)\d+/i để match cả 2
```

### 1.2 Mobile App Config

| # | File Path | Line(s) | Thay đổi | Ghi chú |
|---|-----------|---------|----------|---------|
| 6 | `packages/mobile/app.json` | 3 | `"name": "RoomZ"` → `"RommZ"` | Expo app name |
| 7 | `packages/mobile/android/app/src/main/res/values/strings.xml` | 2 | `RoomZ` → `RommZ` | Android app name |
| 8 | `packages/mobile/android/settings.gradle` | 34 | `rootProject.name = 'RoomZ'` → `'RommZ'` | Gradle project name |

---

## 🟡 Phase 2: Branding & UI (Safe to change)

### 2.1 SEO & Meta

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 9 | `packages/web/src/components/common/SEO.tsx` | 18 | `DEFAULT_TITLE` có "RoomZ" → "RommZ" |
| 10 | `packages/web/src/components/common/SEO.tsx` | 19 | `DEFAULT_DESCRIPTION` có "RoomZ" → "RommZ" |
| 11 | `packages/web/src/components/common/SEO.tsx` | 20 | `SITE_URL` giữ nguyên (roomz.vn) hoặc đổi nếu có domain mới |
| 12 | `packages/web/src/components/common/SEO.tsx` | 31 | `pageTitle` template: `"${title} | RoomZ"` → `"${title} | RommZ"` |
| 13 | `packages/web/src/components/common/SEO.tsx` | 126 | `name: 'RoomZ'` → `'RommZ'` |

### 2.2 Page Components - RoomZ+ Branding

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 14 | `packages/web/src/pages/PaymentPage.tsx` | 135 | `"Chào mừng đến với RoomZ+"` → `"Chào mừng đến với RommZ+"` |
| 15 | `packages/web/src/pages/PaymentPage.tsx` | 186 | `"Chào mừng đến RoomZ+!"` → `"Chào mừng đến RommZ+!"` |
| 16 | `packages/web/src/pages/PaymentPage.tsx` | 227 | `"Mở khóa toàn bộ tính năng với RoomZ+"` → `"RommZ+"` |
| 17 | `packages/web/src/pages/profile/components/UpgradeBanner.tsx` | 13 | `const ROOMZ_PLUS_FEATURES` → `const ROMMZ_PLUS_FEATURES` |
| 18 | `packages/web/src/pages/profile/components/UpgradeBanner.tsx` | 40, 67 | `"RoomZ+ Premium"` → `"RommZ+ Premium"` |
| 19 | `packages/web/src/pages/profile/components/SettingsTab.tsx` | 175 | `"RoomZ+ Premium"` → `"RommZ+ Premium"` |
| 20 | `packages/web/src/pages/roommates/components/results/LimitHitModal.tsx` | 14 | Import `getRoomZPlusPlan` → giữ nguyên (tên function) |
| 21 | `packages/web/src/hooks/useFavorites.ts` | 114 | `"Nâng cấp RoomZ+"` → `"Nâng cấp RommZ+"` |

### 2.3 Mobile App Screens

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 22 | `packages/mobile/app/(auth)/login.tsx` | 71 | `RoomZ` → `RommZ` (branding text) |
| 23 | `packages/mobile/app/(auth)/register.tsx` | 48 | `RoomZ` → `RommZ` (branding text) |
| 24 | `packages/mobile/app/(app)/verification.tsx` | 161 | `"cộng đồng RoomZ"` → `"cộng đồng RommZ"` |
| 25 | `packages/mobile/app/(app)/settings.tsx` | 204 | `"RoomZ v1.0.0"` → `"RommZ v1.0.0"` |
| 26 | `packages/mobile/app/(app)/payment.tsx` | 29, 69, 89, 115, 124, 158, 170 | Tất cả "RoomZ+" → "RommZ+" |
| 27 | `packages/mobile/app/(app)/(tabs)/profile.tsx` | 77, 109 | `"RoomZ+"` → `"RommZ+"` |

### 2.4 Other Pages

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 28 | `packages/web/src/pages/LocalPassportPage.tsx` | 226, 247 | `"RoomZ Passport"` → `"RommZ Passport"` |
| 29 | `packages/web/src/pages/LocalPassportPage.tsx` | 276 | `"RoomZ Premium"` → `"RommZ Premium"` |
| 30 | `packages/web/src/pages/LocalPassportPage.tsx` | 522 | `"đối tác của RoomZ"` → `"đối tác của RommZ"` |
| 31 | `packages/web/src/pages/CommunityPage.tsx` | 232 | `"Cộng đồng RoomZ"` → `"Cộng đồng RommZ"` |
| 32 | `packages/web/src/pages/SwapRoomPage.tsx` | 341 | `"trên nền tảng RoomZ"` → `"trên nền tảng RommZ"` |
| 33 | `packages/web/src/pages/VerifyEmailPage.tsx` | 105 | `"email từ RoomZ"` → `"email từ RommZ"` |
| 34 | `packages/web/src/pages/SupportServicesPage.tsx` | 147, 216 | `"Đối tác RoomZ"`, `"Liên hệ RoomZ"` → `"RommZ"` |
| 35 | `packages/web/src/pages/become-landlord/components/BecomeLandlordIntro.tsx` | 26, 42 | `"Chủ trọ trên RoomZ"`, `"trên RoomZ"` → `"RommZ"` |
| 36 | `packages/web/src/pages/become-landlord/components/BecomeLandlordForm.tsx` | 129 | `"củRoomZ"` → `"RommZ"` |

### 2.5 Modals & Components

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 37 | `packages/web/src/components/modals/QRPaymentModal.tsx` | 157 | `"Thanh toán RoomZ+"` → `"Thanh toán RommZ+"` |
| 38 | `packages/web/src/components/modals/VerifyLandlordModal.tsx` | 116 | `"RoomZ chỉ sử dụng"` → `"RommZ chỉ sử dụng"` |
| 39 | `packages/web/src/components/modals/ShopDetailModal.tsx` | 195 | `"thành viên RoomZ"` → `"thành viên RommZ"` |
| 40 | `packages/web/src/components/modals/VoucherModal.tsx` | 22, 44 | `"Voucher ưu đãi RoomZ"`, `"thành viên RoomZ"` → `"RommZ"` |
| 41 | `packages/web/src/components/modals/PartnerSignUpModal.tsx` | 85, 94, 117, 210 | `"đối tác RoomZ"`, `"ngườidùng RoomZ"`, `"đội ngũ RoomZ"` → `"RommZ"` |
| 42 | `packages/web/src/components/modals/HowToRedeemModal.tsx` | 16, 74, 92, 208 | `"RoomZ Local Passport"`, `"hỗ trợ RoomZ"`, `"ưu đãi RoomZ Passport"`, `"đội ngũ RoomZ"` → `"RommZ"` |
| 43 | `packages/web/src/components/common/Chatbot.tsx` | 22, 31, 70, 72, 80 | `"trợ lý RoomZ"`, `"RoomZ+"`, `"đăng tin phòng trên RoomZ"` → `"RommZ"` |
| 44 | `packages/web/src/components/common/ServicesBanner.tsx` | 12 | `"Dịch vụ RoomZ"` → `"Dịch vụ RommZ"` |

### 2.6 Admin Panel

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 45 | `packages/web/src/pages/admin/DashboardPage.tsx` | 73 | `"hệ thống RoomZ"` → `"hệ thống RommZ"` |
| 46 | `packages/web/src/pages/admin/README.md` | 1, 3 | `"RoomZ Admin Panel"`, `"quản trị toàn diện cho RoomZ"` → `"RommZ"` |
| 47 | `packages/web/src/pages/admin/VerificationsPage.tsx` | 254, 276, 398 | Watermark: `"ROOMZ VERIFICATION ONLY"` → `"ROMMZ VERIFICATION ONLY"` |

---

## 🟢 Phase 3: Documentation & Comments

| # | File Path | Line(s) | Thay đổi |
|---|-----------|---------|----------|
| 48 | `README.md` | 1, 3, 200 | `"RoomZ - Find Your Perfect Room"`, `"RoomZ là một nền tảng"`, `"Made with ❤️ by RoomZ Team"` → `"RommZ"` |
| 49 | `.env` | 1 | `# RoomZ Environment Variables` → `# RommZ Environment Variables` |
| 50 | `packages/web/tailwind.config.js` | 12 | Comment: `# RoomZ brand colors` → `# RommZ brand colors` |
| 51 | `packages/mobile/tailwind.config.js` | 12 | Comment: `# RoomZ brand colors` → `# RommZ brand colors` |
| 52 | `packages/web/src/services/payments.ts` | 3 | Comment: `RoomZ+ subscription management` → `RommZ+ subscription management` |
| 53 | `packages/web/src/services/realtime.ts` | 3 | Comment: `ROOMZ REALTIME SERVICE` → `ROMMZ REALTIME SERVICE` |
| 54 | `packages/web/src/lib/supabase.ts` | 3 | Comment: `ROOMZ FRONTEND - SUPABASE CLIENT` → `ROMMZ FRONTEND...` |
| 55 | `packages/web/src/contexts/AuthContext.tsx` | 2 | Comment: `Authentication Context for RoomZ` → `for RommZ` |
| 56 | `packages/web/src/config/index.ts` | 12 | `NAME: 'RoomZ'` → `NAME: 'RommZ'` |
| 57 | `packages/mobile/components/maps/RoomMap.tsx` | 2 | Comment: `React Native Map Component cho RoomZ` → `cho RommZ` |
| 58 | `playwright.config.ts` | 4 | Comment: `RoomZ E2E Tests Configuration` → `RommZ E2E Tests` |

---

## ⚠️ KHÔNG ĐỔI (Giữ nguyên)

| Item | File | Lý do giữ nguyên |
|------|------|------------------|
| `roomz_plus` (RevenueCat product ID) | `packages/mobile/app/(app)/payment.tsx` | Product ID trong RevenueCat dashboard. Đổi = mất subscription data. |
| `roomz-mobile` (slug) | `packages/mobile/app.json` | Expo/EAS build identifier. Đổi = broken builds. |
| `roomz` (URL scheme) | `AndroidManifest.xml` | Deep linking. Đổi = users không mở được app từ link. |
| `roomz` (package name) | `com.anonymous.roomzmobile` | Android package name. Đổi = new app trên Play Store. |
| Supabase project ID | `vevnoxlgwisdottaifdn` | Không thể rename Supabase project. |

---

## 📋 Execution Checklist

### Pre-Deploy
- [ ] Review tất cả files trong Phase 1
- [ ] Test payment flow trên staging
- [ ] Kiểm tra webhook với cả ROOMZ và ROMMZ order codes

### Deploy Steps
1. **Apply SQL migrations** (nếu có comment updates)
2. **Deploy web** (Vercel)
3. **Deploy Edge Function** `sepay-webhook`
4. **Build & release mobile** (iOS/Android)

### Post-Deploy Verification
- [ ] Tạo payment order mới → verify có ROMMZ prefix
- [ ] Test webhook với ROMMZ order code
- [ ] Kiểm tra UI: tất cả "RoomZ+" đã thành "RommZ+"
- [ ] Test deep linking vẫn hoạt động (`roomz://`)

---

## 🎯 Regex Patterns for Search/Replace

```regex
# Match RoomZ (word boundary)
\bRoomZ\b → RommZ

# Match ROOMZ (uppercase, for codes)
\bROOMZ\b → ROMMZ

# Match roomz_plus (product ID - DO NOT CHANGE)
roomz_plus → KEEP

# Match in URLs/schemes (keep)
roomz:// → KEEP
```

---

## 💡 Tips

1. **Dùng VS Code Find & Replace** với regex `\bRoomZ\b` để tránh đổi nhầm "roomz_plus"
2. **Test payment flow** kỹ sau khi đổi order code prefix
3. **Giữ backward compatibility** cho webhook: support cả ROOMZ và ROMMZ trong transition period
4. **RevenueCat product ID** (`roomz_plus`): Không đổi! Nếu muốn đổi, cần:
   - Tạo product mới `rommz_plus`
   - Migrate users từ `roomz_plus` → `rommz_plus`
   - Update code sau khi migration hoàn tất

---

*Plan created: 2026-03-05*
