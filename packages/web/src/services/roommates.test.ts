import { expect, test } from '@playwright/test';
import { supabase } from '@/lib/supabase';
import { calculateCompatibility, getTopMatches } from './roommates';

type RpcResult<T> = {
  data: T | null;
  error: {
    code?: string;
    message?: string;
  } | null;
};

const mutableSupabase = supabase as typeof supabase & {
  rpc: typeof supabase.rpc;
};

test.describe('roommates service RPC contract', () => {
  const originalRpc = mutableSupabase.rpc;

  test.afterEach(() => {
    mutableSupabase.rpc = originalRpc;
  });

  test('getTopMatches preserves scope and confidence fields from the RPC result', async () => {
    let capturedArgs: Record<string, unknown> | null = null;

    mutableSupabase.rpc = (async (_fn, args) => {
      capturedArgs = args as Record<string, unknown>;
      return {
        data: [
          {
            matched_user_id: 'user-2',
            compatibility_score: 72,
            confidence_score: 85,
            match_scope: 'same_city',
            full_name: 'Test Match',
            avatar_url: null,
            bio: null,
            university: null,
            major: null,
            city: 'Ha Noi',
            district: 'Long Bien',
            age: 23,
            gender: 'female',
            occupation: 'student',
            hobbies: ['music'],
            sleep_score: 80,
            cleanliness_score: 70,
            noise_score: 65,
            guest_score: 60,
            weekend_score: 75,
            budget_score: 90,
            hobby_score: 50,
            age_score: 80,
            move_in_score: 70,
            location_score: 75,
            last_seen: '2026-03-10T10:00:00.000Z',
          },
        ],
        error: null,
      } as RpcResult<Awaited<ReturnType<typeof getTopMatches>>>;
    }) as typeof supabase.rpc;

    const result = await getTopMatches('user-1', 5);

    expect(capturedArgs).toEqual({
      p_user_id: 'user-1',
      p_limit: 5,
    });
    expect(result[0]).toMatchObject({
      matched_user_id: 'user-2',
      match_scope: 'same_city',
      confidence_score: 85,
      move_in_score: 70,
      location_score: 75,
    });
  });

  test('calculateCompatibility falls back to zero scores when RPC returns no row', async () => {
    mutableSupabase.rpc = (async () => {
      return {
        data: [],
        error: null,
      } as RpcResult<[]>;
    }) as typeof supabase.rpc;

    const result = await calculateCompatibility('user-1', 'user-2');

    expect(result).toEqual({
      total_score: 0,
      sleep_score: 0,
      cleanliness_score: 0,
      noise_score: 0,
      guest_score: 0,
      weekend_score: 0,
      budget_score: 0,
      hobby_score: 0,
      age_score: 0,
      move_in_score: 0,
      location_score: 0,
      confidence_score: 0,
    });
  });
});
