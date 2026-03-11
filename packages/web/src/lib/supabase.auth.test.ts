import { expect, test } from '@playwright/test';
import { auth, supabase } from './supabase';

const mutableAuth = supabase.auth as typeof supabase.auth & {
  signInWithOtp: typeof supabase.auth.signInWithOtp;
  verifyOtp: typeof supabase.auth.verifyOtp;
};

test.describe('supabase auth OTP helpers', () => {
  const originalSignInWithOtp = mutableAuth.signInWithOtp;
  const originalVerifyOtp = mutableAuth.verifyOtp;

  test.afterEach(() => {
    mutableAuth.signInWithOtp = originalSignInWithOtp;
    mutableAuth.verifyOtp = originalVerifyOtp;
  });

  test('sendEmailOtp requests an email OTP and allows account creation', async () => {
    let capturedArgs: Parameters<typeof supabase.auth.signInWithOtp>[0] | null = null;

    mutableAuth.signInWithOtp = (async (args) => {
      capturedArgs = args;
      return {
        data: { user: null, session: null },
        error: null,
      } as Awaited<ReturnType<typeof supabase.auth.signInWithOtp>>;
    }) as typeof supabase.auth.signInWithOtp;

    await auth.sendEmailOtp('user@example.com');

    expect(capturedArgs).toEqual({
      email: 'user@example.com',
      options: {
        shouldCreateUser: true,
      },
    });
  });

  test('verifyEmailOtp verifies the numeric code using email OTP mode', async () => {
    let capturedArgs: Parameters<typeof supabase.auth.verifyOtp>[0] | null = null;

    mutableAuth.verifyOtp = (async (args) => {
      capturedArgs = args;
      return {
        data: { user: { id: 'user-1' }, session: { access_token: 'token' } },
        error: null,
      } as Awaited<ReturnType<typeof supabase.auth.verifyOtp>>;
    }) as typeof supabase.auth.verifyOtp;

    const result = await auth.verifyEmailOtp('user@example.com', '123456');

    expect(capturedArgs).toEqual({
      email: 'user@example.com',
      token: '123456',
      type: 'email',
    });
    expect(result).toMatchObject({
      user: { id: 'user-1' },
      session: { access_token: 'token' },
    });
  });
});
