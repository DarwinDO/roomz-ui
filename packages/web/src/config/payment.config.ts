/**
 * Payment Configuration
 * Centralized config for pricing, plans, and payment settings
 * Makes it easy to update prices without touching code logic
 */

// ============================================
// Plan Pricing (in VND)
// ============================================
export const PRICING = {
    // RommZ+ monthly subscription
    ROMMZ_PLUS_MONTHLY: 49_000,

    // RommZ+ quarterly subscription (3 months)
    ROMMZ_PLUS_QUARTERLY: 119_000,

    // Promo discount percentage (0.5 = 50% off)
    PROMO_DISCOUNT: 0.5,

    // Calculate promo price
    getPromoPrice: (basePrice: number): number =>
        Math.round(basePrice * (1 - PRICING.PROMO_DISCOUNT)),

    // Get price by billing cycle
    getPrice: (billingCycle: 'monthly' | 'quarterly'): number =>
        billingCycle === 'quarterly'
            ? PRICING.ROMMZ_PLUS_QUARTERLY
            : PRICING.ROMMZ_PLUS_MONTHLY,
} as const;

// ============================================
// Promo Configuration
// ============================================
export const PROMO = {
    // Total available slots for early bird promotion
    TOTAL_SLOTS: 500,

    // Default values when promo_status view is not available
    DEFAULT_CLAIMED_SLOTS: 0,

    // Whether promo is currently active
    IS_ACTIVE: true,
} as const;

// ============================================
// Order Configuration
// ============================================
export const ORDER = {
    // QR code expiration time in minutes
    EXPIRATION_MINUTES: 20,

    // Order code prefix
    CODE_PREFIX: 'ROMMZ',

    // Status values
    STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        EXPIRED: 'expired',
        MANUAL_REVIEW: 'manual_review',
    } as const,
} as const;

// ============================================
// Plan Definitions
// ============================================
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
            'Xem số điện thoại chủ nhà (3 lần/ngày)',
        ],
    },
    {
        id: 'rommz_plus',
        name: 'RommZ+',
        price: PRICING.ROMMZ_PLUS_MONTHLY,
        quarterlyPrice: PRICING.ROMMZ_PLUS_QUARTERLY,
        priceDisplay: `${(PRICING.ROMMZ_PLUS_MONTHLY / 1000).toFixed(0)}.000đ/tháng`,
        recommended: true,
        features: [
            '♾️ Xem SĐT không giới hạn',
            '♾️ Lưu phòng yêu thích không giới hạn',
            '♾️ Roommate views & requests không giới hạn',
            '👑 Badge premium trên profile',
            '🎁 Deal độc quyền Local Passport',
            '⚡ Ưu tiên hiển thị',
            '🛡️ Duyệt xác thực nhanh',
            '📞 Hỗ trợ ưu tiên 24/7',
        ],
    },
];

// ============================================
// Helper Functions
// ============================================
export function getPlanById(planId: SubscriptionPlan): PlanDetails | undefined {
    return PLANS.find((p) => p.id === planId);
}

export function getRommZPlusPlan(): PlanDetails | undefined {
    return PLANS.find((p) => p.id === 'rommz_plus');
}

export function getCurrentPrice(
    billingCycle: BillingCycle = 'monthly',
    isPromo: boolean = false
): number {
    const plan = getRommZPlusPlan();
    if (!plan) return 0;

    let price = PRICING.getPrice(billingCycle);
    if (isPromo) {
        price = PRICING.getPromoPrice(price);
    }
    return price;
}

// ============================================
// SePay Configuration
// ============================================
export const SEPAY = {
    // Bank configuration for VietQR
    BANK: {
        CODE: 'MB', // Military Bank
        ACCOUNT: '0363565884',
        ACCOUNT_NAME: 'NGUYEN HOANG VIET DO',
    },

    // QR Code settings
    QR: {
        BASE_URL: 'https://qr.sepay.vn/img',
        PARAMS: {
            BANK: 'bank',
            ACCOUNT: 'acc',
            AMOUNT: 'amount',
            DESCRIPTION: 'des',
        },
    },

    // Order expiration (in minutes)
    ORDER_EXPIRY_MINUTES: 20,
} as const;

// ============================================
// Feature Flags
// ============================================
export const FEATURES = {
    // Enable/disable promo feature
    PROMO_ENABLED: true,

    // Enable/disable quarterly billing option
    QUARTERLY_BILLING_ENABLED: true,

    // Show/hide free plan in UI
    SHOW_FREE_PLAN: true,
} as const;
