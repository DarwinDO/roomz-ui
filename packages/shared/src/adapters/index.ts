// Platform adapter interfaces for cross-platform compatibility
// These interfaces define the contract between shared code and platform-specific implementations

// ============================================
// Storage Adapter (AsyncStorage on RN is async)
// ============================================
export interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

// ============================================
// Notification Adapter
// ============================================
export interface NotificationAdapter {
    success(message: string, options?: NotificationOptions): void;
    error(message: string, options?: NotificationOptions): void;
    info(message: string, options?: NotificationOptions): void;
    show(message: string, options?: NotificationOptions): void;
}

export interface NotificationOptions {
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// ============================================
// Platform File (RN-compatible, no browser File API)
// ============================================
export interface PlatformFile {
    uri: string;
    name: string;
    type: string;
    size?: number;
}

// ============================================
// Config Adapter
// ============================================
export interface ConfigAdapter {
    supabaseUrl: string;
    supabaseAnonKey: string;
}

// ============================================
// Combined Platform Adapters
// ============================================
export interface PlatformAdapters {
    storage: StorageAdapter;
    notification: NotificationAdapter;
    config: ConfigAdapter;
}
