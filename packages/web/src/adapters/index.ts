/**
 * Web Platform Adapters
 * 
 * Implementations of platform adapters for the web platform.
 * These adapters bridge the gap between shared interfaces and web-specific APIs.
 */

import { toast } from 'sonner';
import type {
    NotificationAdapter,
    NotificationOptions,
    StorageAdapter,
    PlatformAdapters,
    PlatformFile,
    ConfigAdapter,
} from '@roomz/shared/adapters';

// ============================================
// Web-specific File Adapter (Browser-only)
// ============================================

export interface ImageCompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    fileType?: string;
}

export interface FileAdapter {
    compressImage(file: PlatformFile, options?: ImageCompressionOptions): Promise<Blob>;
    getFileExtension(filename: string): string;
}

// ============================================
// Notification Adapter (Sonner)
// ============================================

/**
 * Creates a NotificationAdapter using Sonner toast
 * Use this in web applications to show toast notifications
 */
export function createNotificationAdapter(): NotificationAdapter {
    return {
        show: (message: string, options?: NotificationOptions) => {
            toast(message, {
                duration: options?.duration,
                description: options?.description,
                action: options?.action,
            });
        },
        success: (message: string, options?: NotificationOptions) => {
            toast.success(message, {
                duration: options?.duration,
                description: options?.description,
                action: options?.action,
            });
        },
        error: (message: string, options?: NotificationOptions) => {
            toast.error(message, {
                duration: options?.duration,
                description: options?.description,
                action: options?.action,
            });
        },
        info: (message: string, options?: NotificationOptions) => {
            toast.info(message, {
                duration: options?.duration,
                description: options?.description,
                action: options?.action,
            });
        },
    };
}

// Default singleton instance
let _notificationAdapter: NotificationAdapter | null = null;

export function getNotificationAdapter(): NotificationAdapter {
    if (!_notificationAdapter) {
        _notificationAdapter = createNotificationAdapter();
    }
    return _notificationAdapter;
}

// ============================================
// Storage Adapter (localStorage - async wrapper)
// ============================================

/**
 * Creates a StorageAdapter using localStorage
 * Wraps sync localStorage in async methods for cross-platform compatibility
 */
export function createStorageAdapter(): StorageAdapter {
    return {
        getItem: async (key: string): Promise<string | null> => {
            return localStorage.getItem(key);
        },
        setItem: async (key: string, value: string): Promise<void> => {
            localStorage.setItem(key, value);
        },
        removeItem: async (key: string): Promise<void> => {
            localStorage.removeItem(key);
        },
    };
}

let _storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
    if (!_storageAdapter) {
        _storageAdapter = createStorageAdapter();
    }
    return _storageAdapter;
}

// ============================================
// Config Adapter
// ============================================

/**
 * Creates a ConfigAdapter from environment variables
 */
export function createConfigAdapter(): ConfigAdapter {
    return {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
}

let _configAdapter: ConfigAdapter | null = null;

export function getConfigAdapter(): ConfigAdapter {
    if (!_configAdapter) {
        _configAdapter = createConfigAdapter();
    }
    return _configAdapter;
}

// ============================================
// File Adapter (Browser-specific)
// ============================================

/**
 * Creates a FileAdapter for browser environments
 */
export async function createFileAdapter(): Promise<FileAdapter> {
    // Dynamic import for browser-image-compression
    const imageCompression = (await import('browser-image-compression')).default;

    return {
        compressImage: async (file: PlatformFile, options?: ImageCompressionOptions): Promise<Blob> => {
            const compressed = await imageCompression(file as unknown as File, {
                maxSizeMB: options?.maxSizeMB ?? 1,
                maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
                useWebWorker: options?.useWebWorker ?? true,
                fileType: options?.fileType as any,
            });
            return compressed;
        },
        getFileExtension: (filename: string): string => {
            return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
        },
    };
}

// ============================================
// Combined Platform Adapters
// ============================================

let _platformAdapters: PlatformAdapters | null = null;

export async function createPlatformAdapters(): Promise<PlatformAdapters> {
    return {
        notification: createNotificationAdapter(),
        storage: createStorageAdapter(),
        config: createConfigAdapter(),
    };
}

export function getPlatformAdapters(): PlatformAdapters {
    if (!_platformAdapters) {
        _platformAdapters = {
            notification: getNotificationAdapter(),
            storage: getStorageAdapter(),
            config: getConfigAdapter(),
        };
    }
    return _platformAdapters;
}
