/**
 * Identity Verification Service
 * CCCD upload + admin review via Supabase Storage (private) + verification_requests table
 */

import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

const BUCKET = 'identity_documents';

type RpcError = { message?: string } | null;
type RpcRow = Record<string, unknown>;
type RpcResult = { data: unknown; error: RpcError };
type SupabaseRpcClient = typeof supabase & {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<RpcResult>;
};

const rpcSupabase = supabase as SupabaseRpcClient;

export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type VerificationLifecycleStatus = VerificationStatus | 'revoked' | 'unverified';
export type ManagedVerificationType = 'id_card' | 'student_card';

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
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
}

export interface MyVerificationStatus {
  request_id: string | null;
  status: VerificationLifecycleStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  is_currently_verified: boolean;
  latest_event_type: string | null;
  latest_event_reason: string | null;
}

export interface VerifiedUserRecord {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  id_card_verified: boolean;
  student_card_verified: boolean;
  verification_types: string[];
  latest_approved_at: string | null;
  latest_approved_by: string | null;
  latest_approved_by_name: string | null;
  latest_revoke_at: string | null;
  latest_revoke_reason: string | null;
  source_hint: string | null;
}

export interface VerificationAuditEvent {
  event_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  verification_type: string;
  event_type: string;
  reason: string | null;
  created_at: string;
  performed_by: string | null;
  performed_by_name: string | null;
  verification_request_id: string | null;
  metadata: Record<string, unknown> | null;
}

function toRpcRows(value: unknown): RpcRow[] {
  return Array.isArray(value) ? (value as RpcRow[]) : [];
}

function coerceString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function coerceNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function coerceStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function coerceObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
};

async function compressImage(file: File): Promise<File> {
  if (file.size <= 1024 * 1024) {
    return file;
  }

  return imageCompression(file, COMPRESSION_OPTIONS);
}

export async function uploadCCCDImages(
  frontFile: File,
  backFile: File,
): Promise<{ frontPath: string; backPath: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Chưa đăng nhập');
  }

  const userId = user.user.id;
  const timestamp = Date.now();

  const [compressedFront, compressedBack] = await Promise.all([
    compressImage(frontFile),
    compressImage(backFile),
  ]);

  const frontPath = `${userId}/front_${timestamp}.jpg`;
  const backPath = `${userId}/back_${timestamp}.jpg`;

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

  if (frontResult.error) {
    throw new Error(`Lỗi upload mặt trước: ${frontResult.error.message}`);
  }

  if (backResult.error) {
    throw new Error(`Lỗi upload mặt sau: ${backResult.error.message}`);
  }

  return { frontPath, backPath };
}

export async function deleteUploadedFiles(frontPath: string, backPath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([frontPath, backPath]);
}

export async function uploadMultiplePhotos(
  userId: string,
  files: File[],
  bucket: string,
): Promise<string[]> {
  const bucketName = bucket === 'room_photos' ? 'room_photos' : BUCKET;
  const uploadedUrls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const compressed = await compressImage(file);
    const path = `${userId}/${bucket}_${Date.now()}_${index}.jpg`;

    const { error } = await supabase.storage.from(bucketName).upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      throw new Error(`Lỗi upload ảnh ${index + 1}: ${error.message}`);
    }

    uploadedUrls.push(path);
  }

  return uploadedUrls;
}

export async function submitVerificationRequest(
  userId: string,
  documentType: string,
  imagePaths: string[],
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('Chưa đăng nhập');
  }

  const frontImagePath = imagePaths[0] || '';
  const backImagePath = imagePaths[1] || '';

  const { error } = await supabase.from('verification_requests').insert({
    user_id: userId || user.user.id,
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

export async function uploadStudentCardImages(
  frontFile: File,
  backFile: File,
): Promise<{ frontPath: string; backPath: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Chưa đăng nhập');

  const userId = user.user.id;
  const timestamp = Date.now();

  const [compressedFront, compressedBack] = await Promise.all([
    compressImage(frontFile),
    compressImage(backFile),
  ]);

  const frontPath = `${userId}/student_front_${timestamp}.jpg`;
  const backPath = `${userId}/student_back_${timestamp}.jpg`;

  const [frontResult, backResult] = await Promise.all([
    supabase.storage.from(BUCKET).upload(frontPath, compressedFront, { contentType: 'image/jpeg', upsert: false }),
    supabase.storage.from(BUCKET).upload(backPath, compressedBack, { contentType: 'image/jpeg', upsert: false }),
  ]);

  if (frontResult.error) throw new Error(`Lỗi upload mặt trước: ${frontResult.error.message}`);
  if (backResult.error) throw new Error(`Lỗi upload mặt sau: ${backResult.error.message}`);

  return { frontPath, backPath };
}

export async function getMyStudentCardVerificationStatus(): Promise<MyVerificationStatus | null> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, status, rejection_reason, submitted_at, reviewed_at')
    .eq('user_id', authData.user.id)
    .eq('document_type', 'student_card')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Lỗi tải trạng thái xác thực thẻ SV: ${error.message}`);
  if (!data) return null;

  return {
    request_id: data.id,
    status: data.status as VerificationLifecycleStatus,
    rejection_reason: data.rejection_reason ?? null,
    submitted_at: data.submitted_at ?? null,
    reviewed_at: data.reviewed_at ?? null,
    is_currently_verified: data.status === 'approved',
    latest_event_type: null,
    latest_event_reason: null,
  };
}

export async function getMyVerificationStatus(): Promise<MyVerificationStatus | null> {
  const { data, error } = await rpcSupabase.rpc('get_my_verification_status');

  if (error) {
    throw new Error(`Lỗi tải trạng thái xác thực: ${error.message}`);
  }

  const row = toRpcRows(data)[0] ?? null;
  if (!row) {
    return null;
  }

  return {
    request_id: coerceNullableString(row.request_id),
    status: coerceString(row.status, 'unverified') as VerificationLifecycleStatus,
    rejection_reason: coerceNullableString(row.rejection_reason),
    submitted_at: coerceNullableString(row.submitted_at),
    reviewed_at: coerceNullableString(row.reviewed_at),
    is_currently_verified: Boolean(row.is_currently_verified),
    latest_event_type: coerceNullableString(row.latest_event_type),
    latest_event_reason: coerceNullableString(row.latest_event_reason),
  };
}

export async function fetchVerificationRequests(
  statusFilter?: VerificationStatus,
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
  if (error) {
    throw new Error(`Lỗi tải danh sách xác thực: ${error.message}`);
  }

  return (data ?? []) as VerificationRequest[];
}

export async function fetchVerifiedUsers(): Promise<VerifiedUserRecord[]> {
  const { data, error } = await rpcSupabase.rpc('get_verified_users_admin');

  if (error) {
    throw new Error(`Lỗi tải danh sách người dùng đã xác thực: ${error.message}`);
  }

  return toRpcRows(data).map((row) => ({
    user_id: coerceString(row.user_id),
    full_name: coerceString(row.full_name, 'Không rõ người dùng'),
    email: coerceString(row.email),
    avatar_url: coerceNullableString(row.avatar_url),
    id_card_verified: Boolean(row.id_card_verified),
    student_card_verified: Boolean(row.student_card_verified),
    verification_types: coerceStringArray(row.verification_types),
    latest_approved_at: coerceNullableString(row.latest_approved_at),
    latest_approved_by: coerceNullableString(row.latest_approved_by),
    latest_approved_by_name: coerceNullableString(row.latest_approved_by_name),
    latest_revoke_at: coerceNullableString(row.latest_revoke_at),
    latest_revoke_reason: coerceNullableString(row.latest_revoke_reason),
    source_hint: coerceNullableString(row.source_hint),
  }));
}

export async function fetchVerificationAuditLog(limit = 100): Promise<VerificationAuditEvent[]> {
  const { data, error } = await rpcSupabase.rpc('get_verification_audit_log_admin', {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Lỗi tải lịch sử xác thực: ${error.message}`);
  }

  return toRpcRows(data).map((row) => ({
    event_id: coerceString(row.event_id),
    user_id: coerceString(row.user_id),
    user_name: coerceNullableString(row.user_name),
    user_email: coerceNullableString(row.user_email),
    verification_type: coerceString(row.verification_type),
    event_type: coerceString(row.event_type),
    reason: coerceNullableString(row.reason),
    created_at: coerceString(row.created_at),
    performed_by: coerceNullableString(row.performed_by),
    performed_by_name: coerceNullableString(row.performed_by_name),
    verification_request_id: coerceNullableString(row.verification_request_id),
    metadata: coerceObject(row.metadata),
  }));
}

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);

  if (error) {
    throw new Error(`Lỗi tạo URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function reviewVerification(
  requestId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
): Promise<void> {
  const { error } = await rpcSupabase.rpc('admin_review_verification_request', {
    p_request_id: requestId,
    p_status: status,
    p_rejection_reason: rejectionReason ?? null,
  });

  if (error) {
    throw new Error(`Lỗi cập nhật: ${error.message}`);
  }
}

export async function revokeVerification(
  userId: string,
  verificationType: ManagedVerificationType,
  reason: string,
): Promise<void> {
  const { error } = await rpcSupabase.rpc('admin_revoke_user_verification', {
    p_user_id: userId,
    p_verification_type: verificationType,
    p_reason: reason,
  });

  if (error) {
    throw new Error(`Lỗi gỡ xác thực: ${error.message}`);
  }
}
