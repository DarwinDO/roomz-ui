import { FREE_LIMITS, PREMIUM_LIMITS } from './premium';

export type PremiumBenefitStatus = 'live' | 'planned';
export type PremiumBenefitKind = 'hard_entitlement' | 'soft_signal' | 'operational_promise';

export interface PremiumEntitlementRow {
  id:
    | 'phone_views'
    | 'favorites'
    | 'roommate_views'
    | 'roommate_requests'
    | 'local_passport_deals'
    | 'premium_badge'
    | 'priority_display'
    | 'priority_verification'
    | 'priority_support'
    | 'profile_viewers';
  title: string;
  status: PremiumBenefitStatus;
  kind: PremiumBenefitKind;
  freeValue: string;
  premiumValue: string;
  notes: string;
}

export interface PremiumPublicBenefit {
  id:
    | 'phone_views'
    | 'favorites'
    | 'roommate_access'
    | 'local_passport_deals'
    | 'premium_badge';
  label: string;
}

export const PREMIUM_ENTITLEMENT_MATRIX: readonly PremiumEntitlementRow[] = [
  {
    id: 'phone_views',
    title: 'Xem số điện thoại chủ nhà',
    status: 'live',
    kind: 'hard_entitlement',
    freeValue: `${FREE_LIMITS.PHONE_VIEWS_PER_DAY} lượt/ngày`,
    premiumValue: `${PREMIUM_LIMITS.PHONE_VIEWS_PER_DAY} lượt/ngày`,
    notes: 'Số lượt xem được làm mới mỗi ngày lúc 00:00.',
  },
  {
    id: 'favorites',
    title: 'Lưu phòng yêu thích',
    status: 'live',
    kind: 'hard_entitlement',
    freeValue: `${FREE_LIMITS.FAVORITES_MAX} phòng`,
    premiumValue: 'Không giới hạn',
    notes: 'Áp dụng từ khi bạn lưu phòng thứ 6 trở đi.',
  },
  {
    id: 'roommate_views',
    title: 'Xem hồ sơ người tìm bạn cùng phòng',
    status: 'live',
    kind: 'hard_entitlement',
    freeValue: `${FREE_LIMITS.ROOMMATE_VIEWS_PER_DAY} lượt/ngày`,
    premiumValue: 'Không giới hạn',
    notes: 'Giới hạn số hồ sơ có thể xem mỗi ngày.',
  },
  {
    id: 'roommate_requests',
    title: 'Gửi lời chào / yêu cầu kết nối',
    status: 'live',
    kind: 'hard_entitlement',
    freeValue: `${FREE_LIMITS.ROOMMATE_REQUESTS_PER_DAY} lượt/ngày`,
    premiumValue: 'Không giới hạn',
    notes: 'Giới hạn số lời chào có thể gửi đi mỗi ngày.',
  },
  {
    id: 'local_passport_deals',
    title: 'Ưu đãi & deal cao cấp',
    status: 'live',
    kind: 'hard_entitlement',
    freeValue: 'Chỉ xem deal thường',
    premiumValue: 'Mở khóa deal Premium',
    notes: 'Deal Premium chỉ hiển thị với thành viên đã nâng cấp RommZ+.',
  },
  {
    id: 'premium_badge',
    title: 'Badge RommZ+ trên hồ sơ',
    status: 'live',
    kind: 'soft_signal',
    freeValue: 'Không có',
    premiumValue: 'Hiển thị badge RommZ+',
    notes: 'Giúp tạo ấn tượng tốt hơn khi liên hệ chủ nhà và tìm bạn cùng phòng.',
  },
  {
    id: 'priority_display',
    title: 'Ưu tiên hiển thị',
    status: 'planned',
    kind: 'operational_promise',
    freeValue: 'Không có',
    premiumValue: 'Chưa implement rõ',
    notes: 'Không nên hứa công khai cho đến khi có ranking logic thật.',
  },
  {
    id: 'priority_verification',
    title: 'Ưu tiên xử lý xác thực',
    status: 'planned',
    kind: 'operational_promise',
    freeValue: 'Theo queue chung',
    premiumValue: 'Chưa có SLA/pipeline premium riêng',
    notes: 'Chưa có verification lane ưu tiên theo premium.',
  },
  {
    id: 'priority_support',
    title: 'Ưu tiên hỗ trợ',
    status: 'planned',
    kind: 'operational_promise',
    freeValue: 'Theo support chung',
    premiumValue: 'Chưa có lane 24/7 thật',
    notes: 'Không nên dùng wording 24/7 ở trạng thái hiện tại.',
  },
  {
    id: 'profile_viewers',
    title: 'Xem ai đã xem profile của bạn',
    status: 'planned',
    kind: 'hard_entitlement',
    freeValue: 'Không có',
    premiumValue: 'Chưa implement',
    notes: 'Hiện chỉ có analytics/usage event, chưa có viewer list cho user.',
  },
] as const;

export const PREMIUM_PUBLIC_BENEFITS: readonly PremiumPublicBenefit[] = [
  {
    id: 'phone_views',
    label: `Xem SĐT host tới ${PREMIUM_LIMITS.PHONE_VIEWS_PER_DAY} lượt/ngày`,
  },
  {
    id: 'favorites',
    label: 'Lưu phòng yêu thích không giới hạn',
  },
  {
    id: 'roommate_access',
    label: 'Xem hồ sơ và gửi lời chào roommate không giới hạn',
  },
  {
    id: 'local_passport_deals',
    label: 'Mở khóa deal Premium của Local Passport',
  },
  {
    id: 'premium_badge',
    label: 'Badge RommZ+ trên hồ sơ',
  },
] as const;

export const PREMIUM_PUBLIC_BENEFIT_LABELS = PREMIUM_PUBLIC_BENEFITS.map(
  (benefit) => benefit.label,
);

export const PREMIUM_ROOMMATE_UPSELL_BENEFITS = [
  'Xem hồ sơ roommate không giới hạn',
  'Gửi lời chào và yêu cầu kết nối không giới hạn',
  `Xem SĐT host tới ${PREMIUM_LIMITS.PHONE_VIEWS_PER_DAY} lượt/ngày`,
  'Mở khóa deal Premium của Local Passport',
] as const;
