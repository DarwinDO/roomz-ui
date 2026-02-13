/**
 * Swap Room TypeScript Types
 * Based on PLAN-swap-room.md specification
 */

import type { Database } from '@/lib/database.types';

// ============================================
// Database Row Types
// ============================================

export type SubletListingRow = Database['public']['Tables']['sublet_listings']['Row'];
export type SubletListingInsert = Database['public']['Tables']['sublet_listings']['Insert'];
export type SubletListingUpdate = Database['public']['Tables']['sublet_listings']['Update'];

export type SwapRequestRow = Database['public']['Tables']['swap_requests']['Row'];
export type SwapRequestInsert = Database['public']['Tables']['swap_requests']['Insert'];
export type SwapRequestUpdate = Database['public']['Tables']['swap_requests']['Update'];

export type SubletApplicationRow = Database['public']['Tables']['sublet_applications']['Row'];

// ============================================
// Enums (Simplified - 3 values each)
// ============================================

export type SubletStatus = 'active' | 'booked' | 'cancelled';
export type SwapRequestStatus = 'pending' | 'accepted' | 'rejected';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// ============================================
// Extended Types with Joined Data
// ============================================

export interface SubletListing extends SubletListingRow {
    // Joined data from rooms (original_room alias)
    original_room?: {
        id: string;
        title: string;
        address: string;
        district: string;
        city: string;
        area_sqm: number | null;
        bedroom_count: number | null;
        bathroom_count: number | null;
        furnished: boolean | null;
        latitude: number | null;
        longitude: number | null;
        room_type: Database['public']['Enums']['room_type'];
    };
    // Joined data from rooms
    room?: {
        id: string;
        title: string;
        address: string;
        district: string;
        city: string;
        area_sqm: number | null;
        bedroom_count: number | null;
        bathroom_count: number | null;
        furnished: boolean | null;
        latitude: number | null;
        longitude: number | null;
        room_type: Database['public']['Enums']['room_type'];
    };
    // Joined data from users (owner)
    owner?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_verified: boolean | null;
    };
    // Joined data from room_images
    images?: Array<{
        image_url: string;
        is_primary: boolean | null;
        display_order: number | null;
    }>;
}

export interface SubletListingWithDetails extends SubletListing {
    room_title: string;
    address: string;
    district: string;
    city: string;
    area_sqm: number | null;
    bedroom_count: number | null;
    bathroom_count: number | null;
    furnished: boolean | null;
    latitude: number | null;
    longitude: number | null;
    room_type: Database['public']['Enums']['room_type'];
    owner_name: string;
    owner_avatar: string | null;
    owner_verified: boolean | null;
    matchPercentage?: number; // For swap matches
}

export interface SwapRequest extends SwapRequestRow {
    requester?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    requester_listing?: SubletListing;
    recipient?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    recipient_listing?: SubletListing;
}

export interface SubletApplication extends SubletApplicationRow {
    sublet_listing?: SubletListing;
    applicant?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    reviewed_by_user?: {
        id: string;
        full_name: string;
    };
}

// ============================================
// Potential Match (RPC Response)
// ============================================

export interface PotentialMatch {
    listing_id: string;
    matched_listing_id: string;
    match_score: number;
    matched_listing: {
        id: string;
        sublet_price: number;
        title: string;
        address: string;
        district: string;
        city: string;
        latitude: number | null;
        longitude: number | null;
        area_sqm: number | null;
        bedroom_count: number | null;
        bathroom_count: number | null;
        furnished: boolean | null;
        room_type: string;
        owner_name: string;
        owner_avatar: string | null;
        images: Array<{
            image_url: string;
            is_primary: boolean | null;
        }>;
    };
}

// ============================================
// Filter Types
// ============================================

export interface SubletFilters {
    city?: string;
    district?: string;
    min_price?: number;
    max_price?: number;
    start_date?: string;
    end_date?: string;
    room_type?: Database['public']['Enums']['room_type'];
    furnished?: boolean;
    page?: number;
    pageSize?: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateSubletRequest {
    original_room_id: string;
    start_date: string;
    end_date: string;
    sublet_price: number;
    deposit_required?: number;
    description?: string;
    requirements?: string[];
}

export interface CreateSwapRequest {
    requester_listing_id: string;
    recipient_listing_id: string;
    message?: string;
    proposed_start_date: string;
    proposed_end_date: string;
}

export interface CreateApplicationRequest {
    sublet_listing_id: string;
    message?: string;
    preferred_move_in_date: string;
    documents?: Array<{
        type: string;
        url: string;
    }>;
}

export interface UpdateApplicationStatusRequest {
    status: ApplicationStatus;
    review_notes?: string;
    rejection_reason?: string;
}

export interface RespondToSwapRequest {
    status: 'accepted' | 'rejected';
    rejection_reason?: string;
}

// Potential Matches Response
export interface PotentialMatchResponse {
    matches: PotentialMatch[];
    totalCount: number;
}

// ============================================
// Search Response Types
// ============================================

export interface SubletSearchResponse {
    sublets: SubletListingWithDetails[];
    totalCount: number;
    hasMore: boolean;
}

// ============================================
// Component Props Types
// ============================================

export interface SubletCardProps {
    id: string;
    image: string;
    title: string;
    location: string;
    originalPrice: number;
    subletPrice: number;
    startDate: string;
    endDate: string;
    verified: boolean;
    ownerAvatar?: string;
    ownerName?: string;
    matchPercentage?: number;
    onClick?: () => void;
    onApply?: () => void;
    onSwapRequest?: () => void;
}

export interface PotentialMatchCardProps {
    match: PotentialMatch;
    onRequestSwap: () => void;
    onViewDetails: () => void;
}

export interface SwapRequestCardProps {
    request: SwapRequest;
    isIncoming: boolean;
    onAccept?: () => void;
    onReject?: () => void;
    onCancel?: () => void;
    onViewDetails?: () => void;
}

export interface ApplicationCardProps {
    application: SubletApplication;
    isOwner: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    onWithdraw?: () => void;
}

// ============================================
// Utility Types
// ============================================

export type DateRange = {
    start: string;
    end: string;
};

export type PriceRange = {
    min: number;
    max: number;
};
