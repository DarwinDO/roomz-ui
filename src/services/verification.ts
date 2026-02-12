/**
 * Identity Verification Service
 * CCCD upload + admin review via Supabase Storage (private) + verification_requests table
 */

import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

const BUCKET = 'identity_documents';

// ============================================
// Types
// ============================================

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

// ============================================
// Image Compression
// ============================================

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
};

async function compressImage(file: File): Promise<File> {
  if (file.size <= 1024 * 1024) return file; // Skip if already < 1MB
  return imageCompression(file, COMPRESSION_OPTIONS);
}

// ============================================
// User Functions
// ============================================

/**
 * Upload CCCD images (front + back) to private storage
 * Returns { frontPath, backPath } for DB insert
 */
export async function uploadCCCDImages(
  frontFile: File,
  backFile: File
): Promise<{ frontPath: string; backPath: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Chưa đăng nhập');

  const userId = user.user.id;
  const timestamp = Date.now();

  // Compress both images in parallel
  const [compressedFront, compressedBack] = await Promise.all([
    compressImage(frontFile),
    compressImage(backFile),
  ]);

  const frontPath = `${userId}/front_${timestamp}.jpg`;
  const backPath = `${userId}/back_${timestamp}.jpg`;

  // Upload both in parallel
  const [frontResult, backResult] = await Promise.all([
    supabase.storage.from(BUCKET).upload(frontPath, compressedFront, {
      contentType: 'image/jpeg',
      upsert: false,
    }),
    supabase.storage.from(BUCKET).upload(backPath, compressedBack, {
      contentType: 'image/jpeg',
      upsert: false,
    }),
  ]);

  if (frontResult.error) throw new Error(`Lỗi upload mặt trước: ${frontResult.error.message}`);
  if (backResult.error) throw new Error(`Lỗi upload mặt sau: ${backResult.error.message}`);

  return { frontPath, backPath };
}

/**
 * Submit verification request to DB
 */
export async function submitVerificationRequest(
  frontPath: string,
  backPath: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Chưa đăng nhập');

  const { error } = await supabase
    .from('verification_requests')
    .insert({
      user_id: user.user.id,
      document_type: 'cccd',
      front_image_path: frontPath,
      back_image_path: backPath,
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
export async function getMyVerificationStatus(): Promise<VerificationRequest | null> {
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

// ============================================
// Admin Functions
// ============================================

/**
 * Fetch all verification requests (admin only)
 * Joins user info for display
 */
export async function fetchVerificationRequests(
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
 * Get signed URL for viewing CCCD image (60 second expiry)
 */
export async function getSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error) throw new Error(`Lỗi tạo URL: ${error.message}`);
  return data.signedUrl;
}

/**
 * Admin: approve or reject a verification request
 */
export async function reviewVerification(
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
