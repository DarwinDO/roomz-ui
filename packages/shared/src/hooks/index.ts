/**
 * Hooks Index - Strategy B Cleanup
 * 
 * This module exports shared hooks for cross-platform compatibility.
 * 
 * Architecture:
 * - Pure utility hooks (useDebounce) are fully implemented in shared
 * - Hooks with service dependencies remain in @roomz/web/src/hooks
 * - No platform-specific dependencies in shared hooks
 */

// ============================================
// Pure Utility Hooks
// ============================================

export { useDebounce } from './useDebounce';

// ============================================
// Types for hook factories (shared interfaces)
// ============================================

import type { NotificationAdapter } from '../adapters';

export type { NotificationAdapter, NotificationOptions } from '../adapters';

/**
 * Standard options for hooks that need notifications
 */
export interface HookNotificationOptions {
    notify?: NotificationAdapter;
}

/**
 * Auth context interface - to be implemented by consuming app
 */
export interface AuthContextUser {
    id: string;
    email?: string;
    profile?: {
        full_name?: string;
        avatar_url?: string | null;
    };
}

/**
 * Factory function to create hooks with dependencies
 * This pattern allows shared hooks to work with platform-specific implementations
 */
export interface HookFactory<T> {
    (dependencies: {
        auth: { user: AuthContextUser | null };
        notify?: NotificationAdapter;
    }): T;
}
