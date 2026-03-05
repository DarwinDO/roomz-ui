# RoomZ → RommZ: Safe Rollout Roadmap

> Đổi tên theo từng phase nhỏ, dễ rollback nếu có vấn đề

---

## 🎯 Chiến lược: 4 Phases

```
Phase 1: UI/Branding only (không ảnh hưởng chức năng)
   ↓ Test & Verify
Phase 2: Documentation & Comments
   ↓ Test & Verify
Phase 3: Mobile App Config
   ↓ Build & Test
Phase 4: Payment System (cần deploy)
   ↓ Full E2E Test
```

---

## ✅ Phase 1: UI/Branding (Không risk)

> **Thờigian**: 30 phút  
> **Risk**: Không có  
> **Rollback**: Git revert

### Files cần đổi (chỉ text hiển thị):

| STT | File | Nội dung đổi | Line |
|-----|------|--------------|------|
| 1 | `packages/web/src/components/common/SEO.tsx` | `"RoomZ"` → `"RommZ"` | 18, 19, 31, 126 |
| 2 | `packages/web/src/pages/PaymentPage.tsx` | `"RoomZ+"` → `"RommZ+"` | 135, 186, 227 |
| 3 | `packages/web/src/pages/CommunityPage.tsx` | `"Cộng đồng RoomZ"` → `"Cộng đồng RommZ"` | 232 |
| 4 | `packages/web/src/pages/VerifyEmailPage.tsx` | `"email từ RoomZ"` → `"email từ RommZ"` | 105 |
| 5 | `packages/web/src/components/common/Chatbot.tsx` | `"trợ lý RoomZ"`, `"RoomZ+"` | 22, 31, 72 |
| 6 | `packages/web/src/components/modals/QRPaymentModal.tsx` | `"Thanh toán RoomZ+"` | 157 |
| 7 | `packages/web/src/pages/profile/components/SettingsTab.tsx` | `"RoomZ+ Premium"` | 175 |

### Commands:
```bash
# VS Code: Ctrl+Shift+F (Find in Files)
# Search: \bRoomZ\b (regex, match whole word)
# Replace: RommZ
# Files to include: packages/web/src/**/*.tsx
```

### Verify sau Phase 1:
- [ ] Search "RoomZ" trong codebase không còn kết quả nào trong UI
- [ ] Chạy web local, check UI hiển thị "RommZ+"
- [ ] Check page title trên browser tab

---

## ✅ Phase 2: Documentation & Config Constants

> **Thờigian**: 15 phút  
> **Risk**: Không có  
> **Rollback**: Git revert

### Files:

| STT | File | Nội dung đổi | Line |
|-----|------|--------------|------|
| 1 | `README.md` | Title, description, footer | 1, 3, 200 |
| 2 | `.env` | Comment header | 1 |
| 3 | `packages/web/src/config/index.ts` | `NAME: 'RoomZ'` | 12 |
| 4 | `packages/web/src/config/payment.config.ts` | Comment `RoomZ+ monthly` | 11 |
| 5 | `packages/web/src/services/payments.ts` | Comment `RoomZ+ subscription` | 3 |
| 6 | `packages/web/src/services/realtime.ts` | Header comment | 3 |
| 7 | `packages/web/src/contexts/AuthContext.tsx` | Comment | 2 |
| 8 | `packages/web/src/lib/supabase.ts` | Header comment | 3 |

---

## ✅ Phase 3: Mobile App (Config + UI)

> **Thờigian**: 20 phút  
> **Risk**: Thấp  
> **Rollback**: Rebuild lại

### Files:

| STT | File | Nội dung đổi | Line |
|-----|------|--------------|------|
| 1 | `packages/mobile/app.json` | `"name": "RoomZ"` | 3 |
| 2 | `packages/mobile/app/(auth)/login.tsx` | Text branding | 71 |
| 3 | `packages/mobile/app/(auth)/register.tsx` | Text branding | 48 |
| 4 | `packages/mobile/app/(app)/verification.tsx` | `"cộng đồng RoomZ"` | 161 |
| 5 | `packages/mobile/app/(app)/settings.tsx` | `"RoomZ v1.0.0"` | 204 |
| 6 | `packages/mobile/app/(app)/payment.tsx` | Tất cả "RoomZ+" | 29, 69, 89, 115, 124, 158, 170 |
| 7 | `packages/mobile/app/(app)/(tabs)/profile.tsx` | `"RoomZ+"` | 77, 109 |
| 8 | `packages/mobile/android/app/src/main/res/values/strings.xml` | App name | 2 |

### Build & Test:
```bash
cd packages/mobile
npx expo prebuild --platform android
# Hoặc nếu dùng EAS:
npx eas build --platform android --profile development
```

---

## ⚠️ Phase 4: Payment System (CRITICAL - Cần deploy)

> **Thờigian**: 30 phút  
> **Risk**: Cao - Ảnh hưởng payment flow  
> **Rollback**: Revert code + redeploy

### Files (theo thứ tự):

| STT | File | Nội dung đổi | Line | Lưu ý |
|-----|------|--------------|------|-------|
| 1 | `packages/web/src/config/payment.config.ts` | `CODE_PREFIX: 'ROOMZ'` → `'ROMMZ'` | 53 | **CORE CHANGE** |
| 2 | `packages/web/src/services/sepay.ts` | Regex `/ROOMZ\d+/i` → `/ROMMZ\d+/i` | 104, 112 | Cả 2 functions |
| 3 | `supabase/functions/sepay-webhook/index.ts` | `match(/ROOMZ\d+/i)` | 93 | Edge Function |

### ⚠️ Strategy an toàn cho Phase 4:

**Option A: Hard cut** (khuyến nghị nếu chưa có users thanh toán)
- Đổi tất cả cùng lúc
- Old orders với ROOMZ prefix sẽ không match → cần manual xử lý

**Option B: Backward compatible** (khuyến nghị nếu đang có users)
```typescript
// sepay.ts - support cả 2 prefix trong transition
const match = content.match(/(?:ROOMZ|ROMMZ)\d+/i);

// Sau 30 ngày, remove ROOMZ support
```

### Deploy Steps cho Phase 4:

```bash
# 1. Test locally trước
npm run dev
# Tạo payment order mới, verify có ROMMZ prefix

# 2. Deploy web
vercel --prod

# 3. Deploy Edge Function
supabase functions deploy sepay-webhook

# 4. Test webhook
# Tạo payment → Check Supabase logs → Verify order processed
```

---

## 🔄 Rollback Plan

### Nếu Phase 1-3 có vấn đề:
```bash
git checkout -- packages/web/src/components/common/SEO.tsx
git checkout -- packages/web/src/pages/
# ... từng file
```

### Nếu Phase 4 (Payment) có vấn đề:
```bash
# 1. Revert code
git revert HEAD

# 2. Redeploy web
vercel --prod

# 3. Redeploy Edge Function
supabase functions deploy sepay-webhook

# 4. Kiểm tra old orders vẫn work
```

---

## 📋 Pre-flight Checklist

Trước khi bắt đầu:
- [ ] Backup database (export)
- [ ] Tạo branch mới: `git checkout -b rebrand/rommz`
- [ ] Thông báo team (nếu có ngườikhác đang làm)
- [ ] Chọn giờ ít traffic (nếu production có users)

---

## 🚀 Bắt đầu từ đâu?

**Ngay bây giờ:**
1. Tạo branch mới
2. Làm Phase 1 (UI only) - 30 phút
3. Commit & push
4. Test trên local

**Nếu ổn →** Phase 2 → Phase 3 → Phase 4

---

Bạn muốn tôi hỗ trợ thực hiện **Phase 1** ngay bây giờ không? (UI/Branding only - không risk)
