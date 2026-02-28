/**
 * useActivityTracker - Track user's last_seen time
 * Updates last_seen in users table when app loads and periodically while active
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useActivityTracker() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const updatePresence = async () => {
            try {
                // Note: last_seen column added via migration 20260206_improve_compatibility_scoring.sql
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('users') as any)
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', user.id);
            } catch (error) {
                // Silently fail - not critical
                console.debug('[ActivityTracker] Failed to update presence:', error);
            }
        };

        // Update immediately on mount
        updatePresence();

        // Update every 5 minutes while user has app open
        const interval = setInterval(updatePresence, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user]);
}
