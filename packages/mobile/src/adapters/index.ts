/**
 * Mobile Platform Adapters
 * Implements adapter interfaces for React Native
 */

// ============================================
// Types (inlined from @roomz/shared/adapters)
// ============================================
export interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

export interface NotificationOptions {
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export interface NotificationAdapter {
    success(message: string, options?: NotificationOptions): void;
    error(message: string, options?: NotificationOptions): void;
    info(message: string, options?: NotificationOptions): void;
    show(message: string, options?: NotificationOptions): void;
}

export interface ConfigAdapter {
    supabaseUrl: string;
    supabaseAnonKey: string;
}

export interface PlatformAdapters {
    storage: StorageAdapter;
    notification: NotificationAdapter;
    config: ConfigAdapter;
}

// ============================================
// Storage Adapter (AsyncStorage)
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export function createStorageAdapter(): StorageAdapter {
    return {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
    };
}

// ============================================
// Notification Adapter (Alert)
// ============================================
import { Alert } from 'react-native';

export function createNotificationAdapter(): NotificationAdapter {
    return {
        show: (message: string, options?: NotificationOptions) => {
            Alert.alert(message, options?.description);
        },
        success: (message: string, options?: NotificationOptions) => {
            Alert.alert('✅ ' + message, options?.description);
        },
        error: (message: string, options?: NotificationOptions) => {
            Alert.alert('❌ ' + message, options?.description);
        },
        info: (message: string, options?: NotificationOptions) => {
            Alert.alert('ℹ️ ' + message, options?.description);
        },
    };
}

// ============================================
// Navigation Adapter (Expo Router)
// ============================================
export interface NavigationAdapter {
    navigate(path: string): void;
    replace(path: string): void;
    back(): void;
}

export function createNavigationAdapter(router: any): NavigationAdapter {
    return {
        navigate: (path: string) => router.push(path),
        replace: (path: string) => router.replace(path),
        back: () => router.back(),
    };
}

// ============================================
// Config Adapter
// ============================================
export function createConfigAdapter(): ConfigAdapter {
    return {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
}

// ============================================
// Combined
// ============================================
let _adapters: PlatformAdapters | null = null;

export function getPlatformAdapters(): PlatformAdapters {
    if (!_adapters) {
        _adapters = {
            storage: createStorageAdapter(),
            notification: createNotificationAdapter(),
            config: createConfigAdapter(),
        };
    }
    return _adapters;
}
