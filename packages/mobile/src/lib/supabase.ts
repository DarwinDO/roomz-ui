/**
 * Supabase Client — Mobile
 * Uses AsyncStorage for session persistence
 * detectSessionInUrl: false (no browser URL)
 *
 * IMPORTANT: Lazy-initialized to avoid SSR crash.
 * AsyncStorage uses `window` internally, which doesn't exist
 * during Expo Router's server-side rendering on web.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { createStorageAdapter } from '../adapters';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

let _supabase: SupabaseClient | null = null;

function createSupabase(): SupabaseClient {
    const storage = createStorageAdapter();
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: {
                getItem: (key: string) => storage.getItem(key),
                setItem: (key: string, value: string) => storage.setItem(key, value),
                removeItem: (key: string) => storage.removeItem(key),
            },
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
}

/**
 * Get the Supabase client (lazy-initialized).
 * Safe to call in components — won't crash during SSR.
 */
export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createSupabase();
    }
    return _supabase;
}

/**
 * Direct export for convenience in components.
 * Uses getter to ensure lazy initialization.
 */
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabase() as any)[prop];
    },
});
