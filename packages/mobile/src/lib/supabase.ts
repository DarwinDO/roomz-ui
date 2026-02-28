/**
 * Supabase Client — Mobile
 * Uses AsyncStorage for session persistence
 * detectSessionInUrl: false (no browser URL)
 */
import { createClient } from '@supabase/supabase-js';
import { createStorageAdapter } from '../adapters';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const storage = createStorageAdapter();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: {
            getItem: (key: string) => storage.getItem(key),
            setItem: (key: string, value: string) => storage.setItem(key, value),
            removeItem: (key: string) => storage.removeItem(key),
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,  // ← CRITICAL: mobile doesn't have URL bar
    },
});
