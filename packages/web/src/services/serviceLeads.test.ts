import { test, expect } from '@playwright/test';
import { supabase } from '@/lib/supabase';
import { cancelServiceLead, rateServiceLead } from './serviceLeads';

type QueryResult<T> = {
  data: T | null;
  error: {
    message?: string;
  } | null;
};

type QueryBuilder<T> = {
  error: QueryResult<T>['error'];
  update: (payload: Record<string, unknown>) => QueryBuilder<T>;
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  select: (selection: string) => QueryBuilder<T>;
  single: () => Promise<QueryResult<T>>;
};

function createUpdateBuilder<T>(result: QueryResult<T>) {
  const calls = {
    updates: [] as Record<string, unknown>[],
    filters: [] as Array<[string, unknown]>,
    selections: [] as string[],
  };

  const builder: QueryBuilder<T> = {
    error: result.error,
    update(payload) {
      calls.updates.push(payload);
      return builder;
    },
    eq(column, value) {
      calls.filters.push([column, value]);
      return builder;
    },
    select(selection) {
      calls.selections.push(selection);
      return builder;
    },
    async single() {
      return result;
    },
  };

  return { builder, calls };
}

const mutableSupabase = supabase as typeof supabase & {
  from: typeof supabase.from;
  auth: typeof supabase.auth & {
    getUser: typeof supabase.auth.getUser;
  };
};

test.describe('service lead mutations', () => {
  const originalFrom = mutableSupabase.from;
  const originalGetUser = mutableSupabase.auth.getUser;

  test.afterEach(() => {
    mutableSupabase.from = originalFrom;
    mutableSupabase.auth.getUser = originalGetUser;
  });

  test('cancelServiceLead marks the lead as cancelled and refreshes updated_at', async () => {
    const { builder, calls } = createUpdateBuilder({
      data: { id: 'lead-1', status: 'cancelled' },
      error: null,
    });

    mutableSupabase.auth.getUser = (async () =>
      ({ data: { user: { id: 'user-1' } }, error: null })) as typeof supabase.auth.getUser;
    mutableSupabase.from = ((table: string) => {
      expect(table).toBe('service_leads');
      return builder as never;
    }) as typeof supabase.from;

    const result = await cancelServiceLead('lead-1');

    expect(result).toMatchObject({ id: 'lead-1', status: 'cancelled' });
    expect(calls.updates).toHaveLength(1);
    expect(calls.updates[0].status).toBe('cancelled');
    expect(typeof calls.updates[0].updated_at).toBe('string');
    expect(calls.filters).toEqual([
      ['id', 'lead-1'],
      ['user_id', 'user-1'],
    ]);
  });

  test('rateServiceLead keeps completed status while storing the review payload', async () => {
    const { builder, calls } = createUpdateBuilder({
      data: { id: 'lead-2', status: 'completed', user_rating: 5 },
      error: null,
    });

    mutableSupabase.auth.getUser = (async () =>
      ({ data: { user: { id: 'user-2' } }, error: null })) as typeof supabase.auth.getUser;
    mutableSupabase.from = (() => builder as never) as typeof supabase.from;

    const result = await rateServiceLead('lead-2', 5, 'Great service');

    expect(result).toMatchObject({
      id: 'lead-2',
      status: 'completed',
      user_rating: 5,
    });
    expect(calls.updates[0]).toMatchObject({
      user_rating: 5,
      user_review: 'Great service',
      status: 'completed',
    });
    expect(typeof calls.updates[0].updated_at).toBe('string');
  });

  test('service lead mutations reject anonymous users', async () => {
    mutableSupabase.auth.getUser = (async () =>
      ({ data: { user: null }, error: null })) as typeof supabase.auth.getUser;

    await expect(cancelServiceLead('lead-3')).rejects.toThrow('Not authenticated');
    await expect(rateServiceLead('lead-3', 4)).rejects.toThrow('Not authenticated');
  });
});
