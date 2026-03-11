import { expect, test } from '@playwright/test';
import { supabase } from '@/lib/supabase';
import {
  fetchVerificationAuditLog,
  fetchVerifiedUsers,
  getMyVerificationStatus,
  reviewVerification,
  revokeVerification,
} from './verification';

type RpcResult = {
  data: unknown;
  error: { message?: string } | null;
};

const mutableSupabase = supabase as typeof supabase & {
  rpc: typeof supabase.rpc;
};

test.describe('verification service', () => {
  const originalRpc = mutableSupabase.rpc;

  test.afterEach(() => {
    mutableSupabase.rpc = originalRpc;
  });

  test('getMyVerificationStatus returns revoked state when RPC reports it', async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: [
          {
            request_id: 'request-1',
            status: 'revoked',
            rejection_reason: 'Gỡ do vi phạm',
            submitted_at: '2026-03-10T10:00:00.000Z',
            reviewed_at: '2026-03-10T11:00:00.000Z',
            is_currently_verified: false,
            latest_event_type: 'revoked',
            latest_event_reason: 'Gỡ do vi phạm',
          },
        ],
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await getMyVerificationStatus();

    expect(result).toMatchObject({
      status: 'revoked',
      rejection_reason: 'Gỡ do vi phạm',
      is_currently_verified: false,
      latest_event_type: 'revoked',
    });
  });

  test('fetchVerifiedUsers normalizes verified user rows from RPC', async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: [
          {
            user_id: 'user-1',
            full_name: 'Nguyễn Văn A',
            email: 'a@example.com',
            avatar_url: null,
            id_card_verified: true,
            student_card_verified: false,
            verification_types: ['id_card'],
            latest_approved_at: '2026-03-10T11:00:00.000Z',
            latest_approved_by: 'admin-1',
            latest_approved_by_name: 'Admin A',
            latest_revoke_at: null,
            latest_revoke_reason: null,
            source_hint: 'verification_requests_trigger',
          },
        ],
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await fetchVerifiedUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      user_id: 'user-1',
      verification_types: ['id_card'],
      source_hint: 'verification_requests_trigger',
    });
  });

  test('fetchVerificationAuditLog maps audit rows from RPC', async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: [
          {
            event_id: 'event-1',
            user_id: 'user-1',
            user_name: 'Nguyễn Văn A',
            user_email: 'a@example.com',
            verification_type: 'id_card',
            event_type: 'revoked',
            reason: 'Vi phạm nội quy',
            created_at: '2026-03-10T12:00:00.000Z',
            performed_by: 'admin-1',
            performed_by_name: 'Admin A',
            verification_request_id: 'request-1',
            metadata: { source: 'admin_revoke' },
          },
        ],
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await fetchVerificationAuditLog(20);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      event_type: 'revoked',
      verification_type: 'id_card',
      reason: 'Vi phạm nội quy',
    });
  });

  test('reviewVerification uses admin review RPC', async () => {
    let rpcName = '';
    let rpcArgs: Record<string, unknown> | undefined;

    mutableSupabase.rpc = (async (name: string, args?: Record<string, unknown>) => {
      rpcName = name;
      rpcArgs = args;
      return { data: null, error: null } as RpcResult;
    }) as typeof supabase.rpc;

    await reviewVerification('request-1', 'approved');

    expect(rpcName).toBe('admin_review_verification_request');
    expect(rpcArgs).toMatchObject({
      p_request_id: 'request-1',
      p_status: 'approved',
      p_rejection_reason: null,
    });
  });

  test('revokeVerification uses admin revoke RPC', async () => {
    let rpcName = '';
    let rpcArgs: Record<string, unknown> | undefined;

    mutableSupabase.rpc = (async (name: string, args?: Record<string, unknown>) => {
      rpcName = name;
      rpcArgs = args;
      return { data: null, error: null } as RpcResult;
    }) as typeof supabase.rpc;

    await revokeVerification('user-1', 'student_card', 'Giả mạo giấy tờ');

    expect(rpcName).toBe('admin_revoke_user_verification');
    expect(rpcArgs).toMatchObject({
      p_user_id: 'user-1',
      p_verification_type: 'student_card',
      p_reason: 'Giả mạo giấy tờ',
    });
  });
});
