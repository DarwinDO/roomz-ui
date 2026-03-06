/**
 * Partner Leads API Service
 * Xử lý đăng ký đối tác mới từ form "Trở thành đối tác"
 */
import { supabase } from '@/lib/supabase';

export type PartnerLeadStatus = 'pending' | 'contacted' | 'approved' | 'rejected';

export interface PartnerLead {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    service_area: string;
    notes?: string;
    status: PartnerLeadStatus;
    created_at: string;
    updated_at: string;
}

export interface CreatePartnerLeadRequest {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    serviceArea: string;
    notes?: string;
}

/**
 * Create a new partner lead
 * Lưu thông tin đăng ký đối tác vào database
 */
export async function createPartnerLead(data: CreatePartnerLeadRequest): Promise<PartnerLead> {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
        throw new Error('Không thể gửi đăng ký từ server. Vui lòng tải lại trang.');
    }

    // Use type assertion because partner_leads table might not be in generated types
    const client = supabase as any;

    const { error } = await client
        .from('partner_leads')
        .insert({
            company_name: data.companyName,
            contact_name: data.contactName,
            email: data.email,
            phone: data.phone,
            service_area: data.serviceArea,
            notes: data.notes || null,
            status: 'pending',
        });

    if (error) {
        console.error('Error creating partner lead:', error);

        // Check for specific error types
        if (error.code === '23505') {
            throw new Error('Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc liên hệ với chúng tôi.');
        }

        if (error.code === '42P01') {
            throw new Error('Hệ thống đang được cập nhật. Vui lòng thử lại sau ít phút.');
        }

        throw new Error('Không thể gửi đăng ký. Vui lòng thử lại sau.');
    }

    // Return mock data since we can't select due to RLS
    // Admin will see the real data in the admin panel
    return {
        id: 'temp-id',
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        service_area: data.serviceArea,
        notes: data.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    } as PartnerLead;
}

/**
 * Check if email already exists in partner leads
 */
export async function checkPartnerLeadExists(email: string): Promise<boolean> {
    // Use type assertion because partner_leads table might not be in generated types
    const client = supabase as any;

    const { data, error } = await client
        .from('partner_leads')
        .select('id')
        .eq('email', email)
        .limit(1);

    if (error) {
        console.error('Error checking partner lead:', error);
        return false;
    }

    return data && data.length > 0;
}

/**
 * Get all partner leads (admin only)
 * Lấy danh sách tất cả đơn đăng ký đối tác
 */
export async function getPartnerLeads(): Promise<PartnerLead[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Use type assertion because partner_leads table might not be in generated types
    const client = supabase as any;

    const { data, error } = await client
        .from('partner_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching partner leads:', error);
        throw new Error('Không thể tải danh sách đơn đăng ký');
    }

    return (data || []) as PartnerLead[];
}

/**
 * Update partner lead status (admin only)
 * Cập nhật trạng thái đơn đăng ký
 */
export async function updatePartnerLeadStatus(
    id: string,
    status: PartnerLeadStatus
): Promise<PartnerLead> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Use type assertion because partner_leads table might not be in generated types
    const client = supabase as any;

    const { data, error } = await client
        .from('partner_leads')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        console.error('Error updating partner lead status:', error);
        throw new Error('Không thể cập nhật trạng thái');
    }

    return data as PartnerLead;
}
