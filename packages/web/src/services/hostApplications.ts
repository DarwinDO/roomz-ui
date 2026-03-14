import { supabase } from '@/lib/supabase';

type RpcError = { message?: string } | null;
type RpcRow = Record<string, unknown>;
type RpcResult = { data: unknown; error: RpcError };
type SupabaseRpcClient = typeof supabase & {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<RpcResult>;
};

const rpcSupabase = supabase as SupabaseRpcClient;

export type HostApplicationStatus = 'submitted' | 'approved' | 'rejected' | 'revoked';

export interface HostApplicationDraft {
  phone: string;
  address: string;
  propertyCount: string;
  experience: string;
  description: string;
}

export interface MyHostApplication {
  applicationId: string;
  status: HostApplicationStatus;
  phone: string | null;
  address: string | null;
  propertyCount: number | null;
  experience: string | null;
  description: string | null;
  source: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHostApplicationRecord extends MyHostApplication {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  userPhone: string | null;
  userRole: string | null;
  userAccountStatus: string | null;
  reviewedByName: string | null;
}

function toRpcRows(value: unknown): RpcRow[] {
  if (Array.isArray(value)) {
    return value as RpcRow[];
  }

  if (value && typeof value === 'object') {
    return [value as RpcRow];
  }

  return [];
}

function coerceString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function coerceNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function coerceNullableNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function coerceObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapHostApplicationRow(row: RpcRow): MyHostApplication {
  return {
    applicationId: coerceString(row.application_id),
    status: coerceString(row.status, 'submitted') as HostApplicationStatus,
    phone: coerceNullableString(row.phone),
    address: coerceNullableString(row.address),
    propertyCount: coerceNullableNumber(row.property_count),
    experience: coerceNullableString(row.experience),
    description: coerceNullableString(row.description),
    source: coerceString(row.source),
    submittedAt: coerceString(row.submitted_at),
    reviewedAt: coerceNullableString(row.reviewed_at),
    reviewedBy: coerceNullableString(row.reviewed_by),
    rejectionReason: coerceNullableString(row.rejection_reason),
    metadata: coerceObject(row.metadata),
    createdAt: coerceString(row.created_at),
    updatedAt: coerceString(row.updated_at),
  };
}

export function mapApplicationToDraft(application: MyHostApplication | null): HostApplicationDraft {
  return {
    phone: application?.phone ?? '',
    address: application?.address ?? '',
    propertyCount: application?.propertyCount?.toString() ?? '',
    experience: application?.experience ?? '',
    description: application?.description ?? '',
  };
}

export async function getMyHostApplication(): Promise<MyHostApplication | null> {
  const { data, error } = await rpcSupabase.rpc('get_my_host_application');

  if (error) {
    throw new Error(`Lỗi tải hồ sơ host: ${error.message}`);
  }

  const row = toRpcRows(data)[0] ?? null;
  return row ? mapHostApplicationRow(row) : null;
}

export async function submitHostApplication(draft: HostApplicationDraft): Promise<MyHostApplication> {
  const propertyCount = Number.parseInt(draft.propertyCount, 10);

  const { data, error } = await rpcSupabase.rpc('submit_host_application', {
    p_phone: draft.phone,
    p_address: draft.address,
    p_property_count: propertyCount,
    p_experience: draft.experience || null,
    p_description: draft.description || null,
  });

  if (error) {
    throw new Error(`Lỗi gửi đơn host: ${error.message}`);
  }

  const row = toRpcRows(data)[0];
  if (!row) {
    throw new Error('Không nhận được phản hồi từ hệ thống host');
  }

  return mapHostApplicationRow(row);
}

export async function getAdminHostApplications(status?: HostApplicationStatus | 'all'): Promise<AdminHostApplicationRecord[]> {
  const { data, error } = await rpcSupabase.rpc('get_admin_host_applications', {
    p_status: status && status !== 'all' ? status : null,
  });

  if (error) {
    throw new Error(`Lỗi tải danh sách hồ sơ host: ${error.message}`);
  }

  return toRpcRows(data).map((row) => ({
    ...mapHostApplicationRow(row),
    userId: coerceString(row.user_id),
    userName: coerceString(row.user_name, 'Chưa rõ người dùng'),
    userEmail: coerceString(row.user_email),
    userAvatar: coerceNullableString(row.user_avatar),
    userPhone: coerceNullableString(row.user_phone),
    userRole: coerceNullableString(row.user_role),
    userAccountStatus: coerceNullableString(row.user_account_status),
    reviewedByName: coerceNullableString(row.reviewed_by_name),
  }));
}

export async function reviewHostApplication(
  applicationId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
): Promise<MyHostApplication> {
  const { data, error } = await rpcSupabase.rpc('admin_review_host_application', {
    p_application_id: applicationId,
    p_status: status,
    p_rejection_reason: rejectionReason ?? null,
  });

  if (error) {
    throw new Error(`Lỗi duyệt hồ sơ host: ${error.message}`);
  }

  const row = toRpcRows(data)[0];
  if (!row) {
    throw new Error('Không nhận được kết quả duyệt hồ sơ host');
  }

  return mapHostApplicationRow(row);
}

export async function reviewHostApplicationForUser(
  userId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
): Promise<MyHostApplication> {
  const { data, error } = await rpcSupabase.rpc('admin_review_host_application_for_user', {
    p_user_id: userId,
    p_status: status,
    p_rejection_reason: rejectionReason ?? null,
  });

  if (error) {
    throw new Error(`Lỗi duyệt hồ sơ host: ${error.message}`);
  }

  const row = toRpcRows(data)[0];
  if (!row) {
    throw new Error('Không nhận được kết quả duyệt hồ sơ host');
  }

  return mapHostApplicationRow(row);
}

export function getHostApplicationStatusLabel(status: HostApplicationStatus): string {
  switch (status) {
    case 'submitted':
      return 'Đang chờ duyệt';
    case 'approved':
      return 'Đã phê duyệt';
    case 'rejected':
      return 'Cần bổ sung lại';
    case 'revoked':
      return 'Đã thu hồi';
    default:
      return 'Không xác định';
  }
}
