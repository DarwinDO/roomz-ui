import { describe, expect, test } from 'vitest';
import { verifyPayment } from './sepay';

type GetSessionResult = {
  data: {
    session: {
      access_token: string;
    } | null;
  };
  error: Error | null;
};

type InvokeResult = {
  data: unknown;
  error: {
    message?: string;
    context?: Response;
  } | null;
};

describe('verifyPayment', () => {
  test('returns normalized verification result from edge function', async () => {
    const result = await verifyPayment('ROMMZ123', {
      getSession: async () => ({
        data: {
          session: {
            access_token: 'token-1',
          },
        },
        error: null,
      }) as GetSessionResult,
      invokeVerifyPayment: async (accessToken, orderCode) => {
        expect(accessToken).toBe('token-1');
        expect(orderCode).toBe('ROMMZ123');

        return {
          data: {
            success: true,
            status: 'paid',
            transactionId: 'SEPAY-REF-1',
            source: 'sepay_api',
          },
          error: null,
        } as InvokeResult;
      },
    });

    expect(result).toEqual({
      success: true,
      status: 'paid',
      transactionId: 'SEPAY-REF-1',
      source: 'sepay_api',
    });
  });

  test('throws when session is missing', async () => {
    await expect(
      verifyPayment('ROMMZ124', {
        getSession: async () => ({
          data: { session: null },
          error: null,
        }) as GetSessionResult,
        invokeVerifyPayment: async () => {
          throw new Error('invoke should not be called without a session');
        },
      })
    ).rejects.toThrow('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  });

  test('surfaces server error payload from the edge function', async () => {
    await expect(
      verifyPayment('ROMMZ125', {
        getSession: async () => ({
          data: {
            session: {
              access_token: 'token-2',
            },
          },
          error: null,
        }) as GetSessionResult,
        invokeVerifyPayment: async () => ({
          data: null,
          error: {
            message: 'Function error',
            context: new Response(JSON.stringify({ error: 'Không thể xác minh thanh toán.' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }),
          },
        }) as InvokeResult,
      })
    ).rejects.toThrow('Không thể xác minh thanh toán.');
  });
});
