/**
 * App Configuration
 * Centralized configuration exports
 */

// Payment and subscription config
export * from './payment.config';

// App-wide constants
export const APP_CONFIG = {
    // App info
    NAME: 'RommZ',
    VERSION: '1.0.0',

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
    },

    // Cache durations (in milliseconds)
    CACHE: {
        DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes
        DEFAULT_GC_TIME: 30 * 60 * 1000,   // 30 minutes
    },

    // Realtime settings
    REALTIME: {
        RECONNECT_INTERVAL: 5000,
        MAX_RECONNECT_ATTEMPTS: 5,
    },
} as const;
