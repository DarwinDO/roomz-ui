# Premium Entitlement Matrix

Source of truth in code:
- [premium.ts](E:/RoomZ/roomz-ui/packages/shared/src/constants/premium.ts)
- [premium-offer.ts](E:/RoomZ/roomz-ui/packages/shared/src/constants/premium-offer.ts)

This file exists to keep pricing copy, paywalls, profile banners, and admin/product decisions aligned.

## Live benefits

| Benefit | Free | RommZ+ | Type | Notes |
|---|---|---|---|---|
| Xem số điện thoại host | 3 lượt/ngày | 100 lượt/ngày | Hard entitlement | Enforced via room contact gate |
| Lưu phòng yêu thích | 5 phòng | Không giới hạn | Hard entitlement | Enforced in favorites lane |
| Xem hồ sơ roommate | 10 lượt/ngày | Không giới hạn | Hard entitlement | Enforced server-side |
| Gửi lời chào / request roommate | 5 lượt/ngày | Không giới hạn | Hard entitlement | Enforced server-side |
| Deal Premium Local Passport | Chỉ deal thường | Mở khóa deal Premium | Hard entitlement | Enforced via `is_premium_only` |
| Badge RommZ+ trên hồ sơ | Không có | Có | Soft signal | Cosmetic, not core product value |

## Planned or not ready for public promise

| Benefit | Current state | Why not public yet |
|---|---|---|
| Ưu tiên hiển thị | Planned | No clear premium ranking implementation yet |
| Ưu tiên xử lý xác thực | Planned | No premium verification SLA/pipeline yet |
| Ưu tiên hỗ trợ | Planned | No reliable 24/7 support lane |
| Xem ai đã xem profile của bạn | Planned | No user-facing viewer list yet |

## Copy rules

1. Do not say `xem SĐT không giới hạn`. Current entitlement is `100 lượt/ngày`.
2. Do not advertise `24/7 support` until operations actually support it.
3. Do not advertise `fast verification` until a premium verification queue exists.
4. Do not advertise `who viewed your profile` until the feature ships.
5. Prefer outcome-oriented wording:
   - roommate unlimited
   - stronger contact access
   - premium local deals
   - unlimited favorites

## Surfaces that must stay aligned

- [payment.config.ts](E:/RoomZ/roomz-ui/packages/web/src/config/payment.config.ts)
- [PaymentPage.tsx](E:/RoomZ/roomz-ui/packages/web/src/pages/PaymentPage.tsx)
- [UpgradeBanner.tsx](E:/RoomZ/roomz-ui/packages/web/src/pages/profile/components/UpgradeBanner.tsx)
- [LimitHitModal.tsx](E:/RoomZ/roomz-ui/packages/web/src/pages/roommates/components/results/LimitHitModal.tsx)
- [tracking.ts](E:/RoomZ/roomz-ui/packages/shared/src/constants/tracking.ts)
- [ai-chatbot/index.ts](E:/RoomZ/roomz-ui/supabase/functions/ai-chatbot/index.ts)
