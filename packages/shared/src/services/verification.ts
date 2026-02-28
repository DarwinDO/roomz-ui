/**
 * Verification Service (Shared)
 * Core DB operations for identity verification
 * Platform-agnostic - accepts SupabaseClient as parameter
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
    id: string;
    user_id: string;
    document_type: string;
    front_image_path: string;
    back_image_path: string;
    status: VerificationStatus;
    rejection_reason: string | null;
    reviewed_by: string | null;
    submitted_at: string;
    reviewed_at: string | null;
    // Joined fields (admin queries)
    user?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        email: string;
    };
}

/**
 * Submit verification request to DB
 * Supports both CCCD (2 photos) and room_photos (multiple photos)
 */
export async function submitVerificationRequest(
    supabase: SupabaseClient,
    userId: string,
    documentType: string,
    imagePaths: string[]
): Promise<void> {
    const frontImagePath = imagePaths[0] || '';
    const backImagePath = imagePaths[1] || '';

    const { error } = await supabase
        .from('verification_requests')
        .insert({
            user_id: userId,
            document_type: documentType,
            front_image_path: frontImagePath,
            back_image_path: backImagePath,
            status: 'pending',
        });

    if (error) {
        if (error.code === '23505') {
            throw new Error('Bạn đã có yêu cầu xác thực đang chờ duyệt');
        }
        throw new Error(`Lỗi gửi yêu cầu: ${error.message}`);
    }
}

/**
 * Get current user's latest verification status
 */
export async function getMyVerificationStatus(
    supabase: SupabaseClient
): Promise<VerificationRequest | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data as VerificationRequest | null;
}

/**
 * Fetch all verification requests (admin only)
 * Joins user info for display
 */
export async function fetchVerificationRequests(
    supabase: SupabaseClient,
    statusFilter?: VerificationStatus
): Promise<VerificationRequest[]> {
    let query = supabase
        .from('verification_requests')
        .select(`
            *,
            user:users!verification_requests_user_id_fkey(
                id, full_name, avatar_url, email
            )
        `)
        .order('submitted_at', { ascending: false });

    if (statusFilter) {
        query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as VerificationRequest[];
}

/**
 * Admin: approve or reject a verification request
 */
export async function reviewVerification(
    supabase: SupabaseClient,
    requestId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Chưa đăng nhập');

    const { error } = await supabase
        .from('verification_requests')
        .update({
            status,
            rejection_reason: status === 'rejected' ? (rejectionReason || 'Giấy tờ không hợp lệ') : null,
            reviewed_by: user.user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

    if (error) throw new Error(`Lỗi cập nhật: ${error.message}`);
}
