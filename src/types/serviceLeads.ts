/**
 * Service Leads TypeScript Types
 * Based on service_leads table schema
 */

import type { Database } from '@/lib/database.types';

// ============================================
// Types
// ============================================

export type ServiceType = 'moving' | 'cleaning' | 'setup' | 'support';
export type ServiceLeadStatus = 'submitted' | 'partner_contacted' | 'confirmed' | 'completed' | 'cancelled';

// ============================================
// Database Row Type
// ============================================

export type ServiceLeadRow = {
    id: string;
    user_id: string;
    partner_id: string | null;
    service_type: ServiceType;
    status: ServiceLeadStatus;
    details: Record<string, unknown>;
    preferred_date: string | null;
    estimated_price: number | null;
    user_rating: number | null;
    user_review: string | null;
    created_at: string;
    updated_at: string;
};

// ============================================
// Extended Types
// ============================================

export interface ServiceLead extends ServiceLeadRow {
    partner?: {
        id: string;
        name: string;
        category: string;
        specialization: string | null;
        rating: number | null;
        image_url: string | null;
    } | null;
}

// ============================================
// API Request Types
// ============================================

export interface CreateServiceLeadRequest {
    service_type: ServiceType;
    partner_id?: string;
    details: Record<string, unknown>;
    preferred_date?: string;
}

export interface UpdateServiceLeadRequest {
    status?: ServiceLeadStatus;
    partner_id?: string;
    estimated_price?: number;
    user_rating?: number;
    user_review?: string;
}

export interface ServiceLeadFilters {
    status?: ServiceLeadStatus;
    service_type?: ServiceType;
}

// ============================================
// Form Types
// ============================================

export interface MovingServiceDetails {
    pickup_address: string;
    destination_address: string;
    floor_pickup?: number;
    floor_destination?: number;
    has_elevator_pickup?: boolean;
    has_elevator_destination?: boolean;
    items?: string[];
    notes?: string;
    contact_phone?: string;
}

export interface CleaningServiceDetails {
    address: string;
    cleaning_type: 'basic' | 'deep' | 'move_in' | 'move_out';
    num_rooms?: number;
    num_bathrooms?: number;
    add_ons?: string[];
    notes?: string;
    contact_phone?: string;
}

export interface SetupServiceDetails {
    address: string;
    items?: string[];
    setup_type?: 'furniture' | 'appliances' | 'full';
    notes?: string;
    contact_phone?: string;
}
