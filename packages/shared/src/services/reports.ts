/**
 * Reports API Service (Shared)
 * CRUD operations for user reports
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type ReportType = 'room' | 'user' | 'message' | 'review' | 'post' | 'partner';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected';

export interface Report {
    id: string;
    reporter_id: string;
    type: ReportType;
    target_id: string;
    reason: string;
    description: string | null;
    evidence: string[];
    status: ReportStatus;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    reporter?: {
        id: string;
        full_name: string;
    };
}

// ============================================
// API Functions
// ============================================

/**
 * Create a report
 */
export async function createReport(
    supabase: SupabaseClient,
    data: {
        reporter_id: string;
        type: ReportType;
        target_id: string;
        reason: string;
        description?: string;
        evidence?: string[];
    }
): Promise<Report> {
    const { data: report, error } = await supabase
        .from('reports')
        .insert({
            ...data,
            evidence: data.evidence || [],
        })
        .select()
        .single();

    if (error) throw error;

    return report as Report;
}

/**
 * Get user's reports
 */
export async function getUserReports(
    supabase: SupabaseClient,
    userId: string
): Promise<Report[]> {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Report[];
}

/**
 * Get report by ID
 */
export async function getReportById(
    supabase: SupabaseClient,
    id: string
): Promise<Report | null> {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as Report;
}

/**
 * Get all reports (admin)
 */
export async function getAllReports(
    supabase: SupabaseClient,
    options?: {
        status?: ReportStatus;
        type?: ReportType;
        page?: number;
        pageSize?: number;
    }
): Promise<{ reports: Report[]; totalCount: number }> {
    let query = supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.type) {
        query = query.eq('type', options.type);
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        reports: (data || []) as Report[],
        totalCount: count || 0,
    };
}

/**
 * Update report status (admin)
 */
export async function updateReportStatus(
    supabase: SupabaseClient,
    id: string,
    data: {
        status: ReportStatus;
        admin_notes?: string;
    }
): Promise<Report> {
    const { data: report, error } = await supabase
        .from('reports')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return report as Report;
}
