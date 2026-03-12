/**
 * Upgrade source tracking constants
 * Used to track where users initiate premium upgrade flow
 */

export const UPGRADE_SOURCES = {
    PROFILE_BANNER: 'profile_banner',
    PHONE_REVEAL: 'phone_reveal',
    FAVORITES_LIMIT: 'favorites_limit',
    ROOMMATE_LIMIT: 'roommate_limit',
    DEAL_PREMIUM: 'deal_premium',
    SIDEBAR_CTA: 'sidebar_cta',
    CONTEXTUAL_HINT: 'contextual_hint',
} as const;

export type UpgradeSource = typeof UPGRADE_SOURCES[keyof typeof UPGRADE_SOURCES];
