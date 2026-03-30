import { PREMIUM_PUBLIC_BENEFIT_LABELS } from '@roomz/shared/constants/premium-offer';

export const PRICING = {
  ROMMZ_PLUS_MONTHLY: 39_000,
  ROMMZ_PLUS_QUARTERLY: 99_000,
  PROMO_DISCOUNT: 0.5,
  getPromoPrice: (basePrice: number): number => Math.round(basePrice * (1 - PRICING.PROMO_DISCOUNT)),
  getPrice: (billingCycle: 'monthly' | 'quarterly'): number =>
    billingCycle === 'quarterly'
      ? PRICING.ROMMZ_PLUS_QUARTERLY
      : PRICING.ROMMZ_PLUS_MONTHLY,
} as const;

export const PROMO = {
  TOTAL_SLOTS: 500,
  DEFAULT_CLAIMED_SLOTS: 0,
  IS_ACTIVE: true,
} as const;

export const ORDER = {
  EXPIRATION_MINUTES: 20,
  CODE_PREFIX: 'ROMMZ',
  STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    EXPIRED: 'expired',
    MANUAL_REVIEW: 'manual_review',
  } as const,
} as const;

export type SubscriptionPlan = 'free' | 'rommz_plus';
export type BillingCycle = 'monthly' | 'quarterly';

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  quarterlyPrice?: number;
  priceDisplay: string;
  features: string[];
  recommended?: boolean;
}

export const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: 0,
    priceDisplay: '0đ',
    features: [
      'Tìm kiếm phòng không giới hạn',
      'Lưu tối đa 5 phòng yêu thích',
      'Nhắn tin cơ bản',
      'Đặt lịch xem phòng',
      'Xem số điện thoại host 3 lượt/ngày',
    ],
  },
  {
    id: 'rommz_plus',
    name: 'RommZ+',
    price: PRICING.ROMMZ_PLUS_MONTHLY,
    quarterlyPrice: PRICING.ROMMZ_PLUS_QUARTERLY,
    priceDisplay: `${(PRICING.ROMMZ_PLUS_MONTHLY / 1000).toFixed(0)}.000đ/tháng`,
    recommended: true,
    features: [...PREMIUM_PUBLIC_BENEFIT_LABELS],
  },
];

export function getPlanById(planId: SubscriptionPlan): PlanDetails | undefined {
  return PLANS.find((plan) => plan.id === planId);
}

export function getRommZPlusPlan(): PlanDetails | undefined {
  return PLANS.find((plan) => plan.id === 'rommz_plus');
}

export function getCurrentPrice(
  billingCycle: BillingCycle = 'monthly',
  isPromo: boolean = false,
): number {
  const plan = getRommZPlusPlan();
  if (!plan) return 0;

  let price = PRICING.getPrice(billingCycle);
  if (isPromo) {
    price = PRICING.getPromoPrice(price);
  }
  return price;
}

export const SEPAY = {
  BANK: {
    CODE: 'MB',
    ACCOUNT: '0363565884',
    ACCOUNT_NAME: 'NGUYEN HOANG VIET DO',
  },
  QR: {
    BASE_URL: 'https://qr.sepay.vn/img',
    PARAMS: {
      BANK: 'bank',
      ACCOUNT: 'acc',
      AMOUNT: 'amount',
      DESCRIPTION: 'des',
    },
  },
  ORDER_EXPIRY_MINUTES: 20,
} as const;

export const FEATURES = {
  PROMO_ENABLED: true,
  QUARTERLY_BILLING_ENABLED: true,
  SHOW_FREE_PLAN: true,
} as const;
