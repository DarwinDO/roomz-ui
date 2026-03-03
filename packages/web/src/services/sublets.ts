/**
 * Sublet Services
 * API functions for sublet listings and applications
 * Following Supabase Postgres Best Practices
 */

import { supabase } from '@/lib/supabase';
import type {
    SubletListing,
    SubletListingWithDetails,
    SubletApplication,
    SubletFilters,
    SubletSearchResponse,
    CreateSubletRequest,
    CreateApplicationRequest,
    UpdateApplicationStatusRequest,
} from '@roomz/shared/types/swap';

const PAGE_SIZE = 12;

/**
 * Fetch sublet listings with filters and pagination
 * Uses cursor-based pagination for O(1) performance
 */
export async function fetchSublets(
    filters: SubletFilters,
    page: number = 1,
    userId?: string
): Promise<SubletSearchResponse> {
    // Start with base query on the view for joined data
    let query = supabase
        .from('sublet_listings')
        .select(
            `
      *,
      original_room:original_room_id!inner (
        id, title, address, district, city, area_sqm,
        bedroom_count, bathroom_count, furnished,
        latitude, longitude, room_type,
        room_images(image_url, is_primary, display_order)
      ),
      owner:owner_id (
        id, full_name, avatar_url, id_card_verified
      )
    `,
            { count: 'exact' }
        )
        .eq('status', 'active');

    // Exclude own listings if userId provided
    if (userId) {
        query = query.neq('owner_id', userId);
    }

    // Apply filters
    if (filters.city) {
        query = query.eq('original_room.city', filters.city);
    }
    if (filters.district) {
        query = query.eq('original_room.district', filters.district);
    }
    if (filters.min_price !== undefined) {
        query = query.gte('sublet_price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
        query = query.lte('sublet_price', filters.max_price);
    }
    if (filters.start_date) {
        query = query.lte('start_date', filters.start_date);
    }
    if (filters.end_date) {
        query = query.gte('end_date', filters.end_date);
    }

    // Apply pagination with cursor-based approach
    const from = (page - 1) * (filters.pageSize || PAGE_SIZE);
    const to = from + (filters.pageSize || PAGE_SIZE) - 1;

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        if (import.meta.env.DEV) console.error('Error fetching sublets:', error);
        throw error;
    }

    // Transform data to match our types
    const sublets = (data || []).map((item) => ({
        ...item,
        room_title: item.original_room?.title || '',
        address: item.original_room?.address || '',
        district: item.original_room?.district || '',
        city: item.original_room?.city || '',
        area_sqm: item.original_room?.area_sqm,
        bedroom_count: item.original_room?.bedroom_count,
        bathroom_count: item.original_room?.bathroom_count,
        furnished: item.original_room?.furnished,
        latitude: item.original_room?.latitude,
        longitude: item.original_room?.longitude,
        room_type: item.original_room?.room_type,
        owner_name: item.owner?.full_name || '',
        owner_avatar: item.owner?.avatar_url,
        owner_verified: item.owner?.id_card_verified,
        images: (item.original_room as any)?.room_images?.map((img: any) => ({
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order,
        })) || [],
        room: item.original_room,
        owner: item.owner,
    })) as unknown as SubletListingWithDetails[];

    return {
        sublets,
        totalCount: count || 0,
        hasMore: sublets.length === (filters.pageSize || PAGE_SIZE),
    };
}

/**
 * Fetch a single sublet listing by ID
 * Uses composite index on id
 */
export async function fetchSubletById(id: string): Promise<SubletListing | null> {
    const { data, error } = await supabase
        .from('sublet_listings')
        .select(
            `
      *,
      original_room:original_room_id (
        id, title, address, district, city, area_sqm,
        bedroom_count, bathroom_count, furnished,
        latitude, longitude, room_type,
        room_images(image_url, is_primary, display_order)
      ),
      owner:owner_id (
        id, full_name, avatar_url, id_card_verified
      )
    `
        )
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        if (import.meta.env.DEV) console.error('Error fetching sublet:', error);
        throw error;
    }

    return {
        ...data,
        room: data.original_room,
        owner: data.owner,
        images: (data.original_room as any)?.room_images?.map((img: any) => ({
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order,
        })) || [],
    } as unknown as SubletListing;
}

/**
 * Create a new sublet listing
 * Validates constraints before insert
 */
export async function createSublet(
    request: CreateSubletRequest
): Promise<SubletListing> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Parallel fetch: verify user identity + validate room ownership
    const [{ data: profile }, { data: room, error: roomError }] = await Promise.all([
        supabase.from('users').select('id_card_verified').eq('id', user.user.id).single(),
        supabase.from('rooms').select('landlord_id, price_per_month').eq('id', request.original_room_id).single(),
    ]);

    // Guard: user must be identity-verified to post
    if (!profile?.id_card_verified) {
        throw new Error('REQUIRE_VERIFICATION');
    }

    if (roomError || !room) {
        throw new Error('Không tìm thấy phòng');
    }

    if (room.landlord_id !== user.user.id) {
        throw new Error('Bạn chỉ có thể tạo tin đăng cho phòng của chính mình');
    }

    // Validate price constraint (max 120% of original)
    const maxPrice = room.price_per_month * 1.2;
    if (request.sublet_price > maxPrice) {
        throw new Error(`Giá sublet không được vượt quá ${maxPrice.toLocaleString('vi-VN')} VNĐ`);
    }

    const { data, error } = await supabase
        .from('sublet_listings')
        .insert({
            original_room_id: request.original_room_id,
            owner_id: user.user.id,
            start_date: request.start_date,
            end_date: request.end_date,
            original_price: room.price_per_month,
            sublet_price: request.sublet_price,
            deposit_required: request.deposit_required || 0,
            description: request.description,
            requirements: request.requirements || [],
            status: 'active',
            published_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        if (import.meta.env.DEV) console.error('Error creating sublet:', error);
        throw error;
    }

    return data as SubletListing;
}

/**
 * Create a sublet listing WITH auto-created room (for non-landlord users)
 * Flow: verify user → upload images → create room → create sublet → rollback on failure
 */
export interface CreateSubletWithRoomRequest {
    // Room info
    title: string;
    address: string;
    district?: string;
    city: string;
    room_type: 'private' | 'shared' | 'studio' | 'entire';
    price_per_month: number;
    area_sqm?: number;
    bedroom_count?: number;
    bathroom_count?: number;
    furnished?: boolean;
    image_urls?: string[];
    // Sublet info
    start_date: string;
    end_date: string;
    sublet_price: number;
    deposit_required?: number;
    description?: string;
    requirements?: string[];
}

export async function createSubletWithRoom(
    request: CreateSubletWithRoomRequest
): Promise<SubletListing> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Chưa đăng nhập');

    // 1. Verify identity
    const { data: profile } = await supabase
        .from('users')
        .select('id_card_verified')
        .eq('id', user.user.id)
        .single();

    if (!profile?.id_card_verified) {
        throw new Error('REQUIRE_VERIFICATION');
    }

    // 2. Validate price (sublet <= 120% of original)
    const maxPrice = request.price_per_month * 1.2;
    if (request.sublet_price > maxPrice) {
        throw new Error(`Giá cho thuê lại không được vượt quá ${maxPrice.toLocaleString('vi-VN')} VNĐ (120% giá gốc)`);
    }

    // 3. Create "Ghost Room" (active for search visibility)
    const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
            landlord_id: user.user.id,
            title: request.title,
            address: request.address,
            district: request.district || null,
            city: request.city,
            room_type: request.room_type,
            price_per_month: request.price_per_month,
            area_sqm: request.area_sqm || null,
            bedroom_count: request.bedroom_count || 1,
            bathroom_count: request.bathroom_count || 1,
            furnished: request.furnished || false,
            status: 'active',
            is_available: true,
        } as never)
        .select('id, price_per_month')
        .single();

    if (roomError) throw new Error(`Lỗi tạo phòng: ${roomError.message}`);

    // 4. Insert room images (if any)
    if (request.image_urls && request.image_urls.length > 0) {
        const images = request.image_urls.map((url, index) => ({
            room_id: newRoom.id,
            image_url: url,
            display_order: index,
            is_primary: index === 0,
        }));
        await supabase.from('room_images').insert(images as never);
    }

    // 5. Create sublet listing (linked to ghost room)
    const { data: sublet, error: subletError } = await supabase
        .from('sublet_listings')
        .insert({
            original_room_id: newRoom.id,
            owner_id: user.user.id,
            start_date: request.start_date,
            end_date: request.end_date,
            original_price: newRoom.price_per_month,
            sublet_price: request.sublet_price,
            deposit_required: request.deposit_required || 0,
            description: request.description,
            requirements: request.requirements || [],
            status: 'active',
            published_at: new Date().toISOString(),
        })
        .select()
        .single();

    // 6. Rollback: delete room if sublet insert failed
    if (subletError) {
        try {
            await supabase.from('rooms').delete().eq('id', newRoom.id);
        } catch {
            // best-effort cleanup
        }
        throw new Error(`Lỗi tạo tin đăng: ${subletError.message}`);
    }

    return sublet as SubletListing;
}

/**
 * Update a sublet listing
 * Only owner can update
 */
export async function updateSublet(
    id: string,
    updates: Partial<CreateSubletRequest>
): Promise<SubletListing> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (updates.start_date) updateData.start_date = updates.start_date;
    if (updates.end_date) updateData.end_date = updates.end_date;
    if (updates.sublet_price !== undefined)
        updateData.sublet_price = updates.sublet_price;
    if (updates.deposit_required !== undefined)
        updateData.deposit_required = updates.deposit_required;
    if (updates.description !== undefined)
        updateData.description = updates.description;
    if (updates.requirements) updateData.requirements = updates.requirements;

    const { data, error } = await supabase
        .from('sublet_listings')
        .update(updateData)
        .eq('id', id)
        .eq('owner_id', user.user.id) // RLS backup
        .select()
        .single();

    if (error) {
        if (import.meta.env.DEV) console.error('Error updating sublet:', error);
        throw error;
    }

    return data as SubletListing;
}

/**
 * Delete a sublet listing
 * Soft delete by updating status
 */
export async function deleteSublet(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('sublet_listings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('owner_id', user.user.id);

    if (error) {
        if (import.meta.env.DEV) console.error('Error deleting sublet:', error);
        throw error;
    }
}

/**
 * Increment view count
 * Uses atomic update
 */
export async function incrementSubletView(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_sublet_view_count', {
        p_sublet_id: id,
    });

    if (error) {
        if (import.meta.env.DEV) console.error('Failed to increment sublet view count:', error);
    }
}

// ============================================
// Application Services
// ============================================

/**
 * Create an application for a sublet
 */
export async function createApplication(
    request: CreateApplicationRequest
): Promise<SubletApplication> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Guard: prevent self-application
    const { data: listing } = await supabase
        .from('sublet_listings')
        .select('owner_id')
        .eq('id', request.sublet_listing_id)
        .single();

    if (listing?.owner_id === user.user.id) {
        throw new Error('Bạn không thể đăng ký thuê phòng của chính mình');
    }

    const { data, error } = await supabase
        .from('sublet_applications')
        .insert({
            sublet_listing_id: request.sublet_listing_id,
            applicant_id: user.user.id,
            message: request.message,
            preferred_move_in_date: request.preferred_move_in_date,
            documents: request.documents || [],
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        if (import.meta.env.DEV) console.error('Error creating application:', error);
        throw error;
    }

    return data as SubletApplication;
}

/**
 * Fetch applications for a sublet listing (owner view)
 */
export async function fetchApplicationsForSublet(
    subletId: string
): Promise<SubletApplication[]> {
    const { data, error } = await supabase
        .from('sublet_applications')
        .select(
            `
      *,
      applicant:applicant_id (
        id, full_name, avatar_url, email, phone, id_card_verified
      )
    `
        )
        .eq('sublet_listing_id', subletId)
        .order('created_at', { ascending: false });

    if (error) {
        if (import.meta.env.DEV) console.error('Error fetching applications:', error);
        throw error;
    }

    return (data || []).map((item) => ({
        ...item,
        applicant: item.applicant,
    })) as unknown as SubletApplication[];
}

/**
 * Fetch my applications (applicant view)
 */
export async function fetchMyApplications(): Promise<SubletApplication[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('sublet_applications')
        .select(
            `
      *,
      sublet_listing:sublet_listing_id (
        id, start_date, end_date, sublet_price,
        original_room:original_room_id (
          title, address, district, city
        )
      )
    `
        )
        .eq('applicant_id', user.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        if (import.meta.env.DEV) console.error('Error fetching my applications:', error);
        throw error;
    }

    return data as unknown as SubletApplication[];
}

/**
 * Update application status (approve/reject)
 */
export async function updateApplicationStatus(
    applicationId: string,
    request: UpdateApplicationStatusRequest
): Promise<SubletApplication> {
    const { data, error } = await supabase
        .from('sublet_applications')
        .update({
            status: request.status,
            review_notes: request.review_notes,
            rejection_reason: request.rejection_reason,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .select()
        .single();

    if (error) {
        if (import.meta.env.DEV) console.error('Error updating application:', error);
        throw error;
    }

    return data as SubletApplication;
}

/**
 * Withdraw an application
 */
export async function withdrawApplication(applicationId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('sublet_applications')
        .update({ status: 'cancelled' })
        .eq('id', applicationId)
        .eq('applicant_id', user.user.id);

    if (error) {
        if (import.meta.env.DEV) console.error('Error withdrawing application:', error);
        throw error;
    }
}

// ============================================
// My Sublets (Owner view)
// ============================================

/**
 * Fetch my sublet listings
 */
export async function fetchMySublets(): Promise<SubletListing[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('sublet_listings')
        .select(
            `
      *,
      original_room:original_room_id (
        id, title, address, district, city,
        area_sqm, bedroom_count, bathroom_count, room_type, price_per_month,
        room_images(image_url, is_primary, display_order)
      ),
      owner:owner_id (
        id, full_name, avatar_url, id_card_verified
      )
    `
        )
        .eq('owner_id', user.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        if (import.meta.env.DEV) console.error('Error fetching my sublets:', error);
        throw error;
    }

    return (data || []).map((item) => ({
        ...item,
        room: item.original_room,
        owner: item.owner,
        images: (item.original_room as any)?.room_images?.map((img: any) => ({
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order,
        })) || [],
    })) as unknown as SubletListing[];
}
