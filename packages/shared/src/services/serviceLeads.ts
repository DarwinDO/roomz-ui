/**
 * Service Leads API Service (Shared)
 * CRUD operations for service leads (moving, cleaning, etc.)
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceLead, ServiceLeadFilters, CreateServiceLeadRequest, UpdateServiceLeadRequest } from '../types/serviceLeads';

// ============================================
// API Functions
// ============================================

/**
 * Get user's service leads
 */
export async function getUserServiceLeads(
    supabase: SupabaseClient,
    userId: string
): Promise<ServiceLead[]> {
    const { data, error } = await supabase
        .from('service_leads')
        .select(`
            *,
            partner:partners(id, name, category, specialization, rating, image_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as ServiceLead[];
}

/**
 * Get service lead by ID
 */
export async function getServiceLeadById(
    supabase: SupabaseClient,
    id: string
): Promise<ServiceLead | null> {
    const { data, error } = await supabase
        .from('service_leads')
        .select(`
            *,
            partner:partners(id, name, category, specialization, rating, image_url)
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as ServiceLead;
}

/**
 * Create a service lead
 */
export async function createServiceLead(
    supabase: SupabaseClient,
    userId: string,
    data: CreateServiceLeadRequest
): Promise<ServiceLead> {
    const { data: lead, error } = await supabase
        .from('service_leads')
        .insert({
            user_id: userId,
            service_type: data.service_type,
            partner_id: data.partner_id || null,
            details: data.details,
            preferred_date: data.preferred_date || null,
        })
        .select(`
            *,
            partner:partners(id, name, category, specialization, rating, image_url)
        `)
        .single();

    if (error) throw error;

    return lead as ServiceLead;
}

/**
 * Update a service lead
 */
export async function updateServiceLead(
    supabase: SupabaseClient,
    id: string,
    data: UpdateServiceLeadRequest
): Promise<ServiceLead> {
    const { data: lead, error } = await supabase
        .from('service_leads')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
            *,
            partner:partners(id, name, category, specialization, rating, image_url)
        `)
        .single();

    if (error) throw error;

    return lead as ServiceLead;
}

/**
 * Cancel a service lead
 */
export async function cancelServiceLead(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('service_leads')
        .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get service leads (admin)
 */
export async function getAllServiceLeads(
    supabase: SupabaseClient,
    filters?: ServiceLeadFilters
): Promise<{ leads: ServiceLead[]; totalCount: number }> {
    let query = supabase
        .from('service_leads')
        .select(`
            *,
            partner:partners(id, name, category, specialization, rating, image_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        leads: (data || []) as ServiceLead[],
        totalCount: count || 0,
    };
}
