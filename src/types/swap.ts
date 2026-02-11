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

export type SwapMatchRow = Database['public']['Tables']['swap_matches']['Row'];
export type SubletApplicationRow = Database['public']['Tables']['sublet_applications']['Row'];
export type SwapAgreementRow = Database['public']['Tables']['swap_agreements']['Row'];
export type SubletReviewRow = Database['public']['Tables']['sublet_reviews']['Row'];

// ============================================
// Enums
// ============================================

export type SubletStatus = 'draft' | 'pending' | 'active' | 'booked' | 'completed' | 'cancelled';
export type SwapRequestStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn' | 'expired';
export type AgreementStatus = 'draft' | 'pending_signatures' | 'active' | 'completed' | 'terminated';

// ============================================
// Extended Types with Joined Data
// ============================================

export interface SubletListing extends SubletListingRow {
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

export interface SwapMatch extends SwapMatchRow {
    my_listing?: SubletListing;
    matched_listing?: SubletListing;
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

export interface SwapAgreement extends SwapAgreementRow {
    swap_request?: SwapRequest;
    party_a?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    party_b?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface SubletReview extends SubletReviewRow {
    sublet_listing?: SubletListing;
    reviewer?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    reviewee?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
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

export interface SwapMatchFilters {
    min_score?: number;
    max_results?: number;
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
    preferred_move_out_date?: string;
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

// ============================================
// Search Response Types
// ============================================

export interface SubletSearchResponse {
    sublets: SubletListingWithDetails[];
    totalCount: number;
    hasMore: boolean;
}

export interface SwapMatchResponse {
    matches: SwapMatch[];
    totalCount: number;
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

export interface SwapMatchCardProps {
    matchId: string;
    myListing: SubletListing;
    matchedListing: SubletListing;
    matchScore: number;
    matchReasons: string[];
    onAccept: () => void;
    onPass: () => void;
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

export type MatchReason =
    | 'similar_location'
    | 'similar_price'
    | 'overlapping_dates'
    | 'same_district'
    | 'same_city'
    | 'compatible_requirements';

// ============================================
// TanStack Query Key Types
// ============================================

export const subletKeys = {
    all: ['sublets'] as const,
    lists: () => [...subletKeys.all, 'list'] as const,
    list: (filters: SubletFilters) => [...subletKeys.lists(), filters] as const,
    details: () => [...subletKeys.all, 'detail'] as const,
    detail: (id: string) => [...subletKeys.details(), id] as const,
    matches: (userId: string) => [...subletKeys.all, 'matches', userId] as const,
    requests: (userId: string) => [...subletKeys.all, 'requests', userId] as const,
    applications: (listingId: string) => [...subletKeys.all, 'applications', listingId] as const,
    myApplications: (userId: string) => [...subletKeys.all, 'my-applications', userId] as const,
} as const;

export type SubletQueryKey = typeof subletKeys;
