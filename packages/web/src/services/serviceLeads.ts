/**
 * Service Leads API Service
 * Interact with 'service_leads' table
 */
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import type {
    ServiceLead,
    CreateServiceLeadRequest,
    ServiceLeadFilters,
    ServiceLeadStatus
} from '@roomz/shared/types/serviceLeads';

/**
 * Get current user's service leads
 */
export async function getMyServiceLeads(filters: ServiceLeadFilters = {}): Promise<ServiceLead[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    let query = supabase
        .from('service_leads')
        .select('*, partner:partners(id, name, category, specialization, rating, image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.service_type) {
        query = query.eq('service_type', filters.service_type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching service leads:', error);
        throw error;
    }

    return (data || []) as ServiceLead[];
}

/**
 * Get single service lead by ID
 */
export async function getServiceLeadById(id: string): Promise<ServiceLead | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
        .from('service_leads')
        .select('*, partner:partners(id, name, category, specialization, rating, image_url)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching service lead:', error);
        return null;
    }

    return data as unknown as ServiceLead;
}

/**
 * Create a new service lead
 */
export async function createServiceLead(data: CreateServiceLeadRequest): Promise<ServiceLead> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data: lead, error } = await supabase
        .from('service_leads')
        .insert({
            user_id: user.id,
            service_type: data.service_type,
            partner_id: data.partner_id || null,
            details: data.details as Json,
            preferred_date: data.preferred_date || null,
        })
        .select('*, partner:partners(id, name, category, specialization, rating, image_url)')
        .single();

    if (error) {
        console.error('Error creating service lead:', error);
        throw error;
    }

    return lead as unknown as ServiceLead;
}

/**
 * Cancel a service lead
 */
export async function cancelServiceLead(id: string): Promise<ServiceLead> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data: lead, error } = await supabase
        .from('service_leads')
        .update({
            status: 'cancelled' as ServiceLeadStatus,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, partner:partners(id, name, category, specialization, rating, image_url)')
        .single();

    if (error) {
        console.error('Error cancelling service lead:', error);
        throw error;
    }

    return lead as unknown as ServiceLead;
}

/**
 * Rate a completed service
 */
export async function rateServiceLead(
    id: string,
    rating: number,
    review?: string
): Promise<ServiceLead> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data: lead, error } = await supabase
        .from('service_leads')
        .update({
            user_rating: rating,
            user_review: review || null,
            status: 'rated' as ServiceLeadStatus,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, partner:partners(id, name, category, specialization, rating, image_url)')
        .single();

    if (error) {
        console.error('Error rating service lead:', error);
        throw error;
    }

    return lead as unknown as ServiceLead;
}
