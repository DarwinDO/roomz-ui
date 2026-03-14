/**
 * Reports Service
 * CRUD operations for admin reports management
 */
import { supabase } from '@/lib/supabase';

export interface Report {
    id: string;
    reporter_id: string;
    reported_id: string;
    reported_type: 'user' | 'room';
    type: 'spam' | 'fraud' | 'inappropriate' | 'other';
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    description: string | null;
    admin_notes: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
    reporter?: {
        id: string;
        full_name: string;
        email: string;
    };
    reported_name?: string;
}

export interface ReportFilters {
    status?: string;
    type?: string;
    priority?: string;
    search?: string;
}

type ReportRow = Omit<Report, 'reporter' | 'reported_name'> & {
    reporter?: {
        id: string;
        full_name: string;
        email: string;
    };
};

/**
 * Get all reports for admin with reporter info and reported name enrichment
 */
export async function getAdminReports(filters?: ReportFilters): Promise<Report[]> {
    let query = supabase
        .from('reports' as never)
        .select('*, reporter:users!reporter_id(id, full_name, email)')
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

    if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
    }

    if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    // Enrich with reported names
    const enriched = await Promise.all(
        ((data || []) as ReportRow[]).map(async (report) => {
            let reportedName = report.reported_id;
            if (report.reported_type === 'user') {
                const { data: user } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', report.reported_id)
                    .single();
                reportedName = user?.full_name || report.reported_id;
            } else if (report.reported_type === 'room') {
                const { data: room } = await supabase
                    .from('rooms')
                    .select('title')
                    .eq('id', report.reported_id)
                    .single();
                reportedName = room?.title || report.reported_id;
            }
            return { ...report, reported_name: reportedName };
        })
    );

    return enriched as Report[];
}

/**
 * Update report status
 */
export async function updateReportStatus(
    reportId: string,
    status: string
): Promise<void> {
    const { error } = await supabase
        .from('reports' as never)
        .update({
            status,
        } as never)
        .eq('id', reportId);

    if (error) {
        throw error;
    }
}

/**
 * Add admin note to report
 */
export async function addReportNote(
    reportId: string,
    note: string
): Promise<void> {
    const { error } = await supabase
        .from('reports' as never)
        .update({
            admin_notes: note,
        } as never)
        .eq('id', reportId);

    if (error) {
        throw error;
    }
}
