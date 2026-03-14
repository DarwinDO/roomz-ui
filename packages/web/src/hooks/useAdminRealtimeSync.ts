/**
 * Admin Realtime Sync Hook
 * Automatically invalidates queries when database changes
 */
import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { adminKeys } from './useAdmin';
import { adminReportKeys } from './useAdminReports';
import { adminServiceLeadKeys } from './useAdminServiceLeads';

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: TArgs) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

export function useAdminRealtimeSync() {
    const queryClient = useQueryClient();

    const invalidate = useMemo(
        () => debounce((key: readonly unknown[]) => {
            queryClient.invalidateQueries({ queryKey: key });
        }, 500),
        [queryClient]
    );

    useEffect(() => {
        const channel = supabase
            .channel('admin-realtime-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' },
                () => invalidate(adminKeys.rooms.all()))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' },
                () => invalidate(adminKeys.users.all()))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
                () => invalidate(adminKeys.stats()))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' },
                () => invalidate(adminReportKeys.all))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_leads' },
                () => invalidate(adminServiceLeadKeys.all))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [invalidate]);
}
