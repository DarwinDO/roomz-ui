/**
 * Premium Limits Constants
 * Centralized limit definitions for free vs premium users
 */

export const FREE_LIMITS = {
    PHONE_VIEWS_PER_DAY: 3,
    FAVORITES_MAX: 5,
    ROOMMATE_VIEWS_PER_DAY: 10,
    ROOMMATE_REQUESTS_PER_DAY: 5,
} as const;

export const PREMIUM_LIMITS = {
    PHONE_VIEWS_PER_DAY: 100,
    FAVORITES_MAX: Infinity,
    ROOMMATE_VIEWS_PER_DAY: Infinity,
    ROOMMATE_REQUESTS_PER_DAY: Infinity,
} as const;
