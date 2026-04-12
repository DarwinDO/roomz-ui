import { describe, expect, test } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getPartners, togglePartnerStatus } from './partners';

type PartnerRow = {
  id: string;
  status: 'active' | 'inactive';
};

type QueryCall = {
  filters: Array<[string, unknown]>;
  orClauses: string[];
  orders: Array<[string, boolean | undefined]>;
};

function createListBuilder(result: { data: PartnerRow[]; error: null }, calls: QueryCall) {
  const builder = {
    select() {
      return builder;
    },
    eq(column: string, value: unknown) {
      calls.filters.push([column, value]);
      return builder;
    },
    or(clause: string) {
      calls.orClauses.push(clause);
      return builder;
    },
    order(column: string, options?: { ascending?: boolean }) {
      calls.orders.push([column, options?.ascending]);
      return Promise.resolve(result);
    },
  };

  return builder;
}

function createSingleBuilder<T>(result: { data: T; error: null }) {
  const builder = {
    select() {
      return builder;
    },
    update() {
      return builder;
    },
    eq() {
      return builder;
    },
    single() {
      return Promise.resolve(result);
    },
  };

  return builder;
}

const mutableSupabase = supabase as typeof supabase & {
  from: typeof supabase.from;
};

describe('partners service', () => {
  const originalFrom = mutableSupabase.from;

  test.afterEach(() => {
    mutableSupabase.from = originalFrom;
  });

  test('getPartners defaults to active-only results', async () => {
    const calls: QueryCall = {
      filters: [],
      orClauses: [],
      orders: [],
    };

    mutableSupabase.from = (() =>
      createListBuilder({ data: [], error: null }, calls) as never) as typeof supabase.from;

    await getPartners();

    expect(calls.filters).toContainEqual(['status', 'active']);
    expect(calls.orders).toEqual([['rating', false]]);
  });

  test('getPartners does not force a status filter when admin requests all', async () => {
    const calls: QueryCall = {
      filters: [],
      orClauses: [],
      orders: [],
    };

    mutableSupabase.from = (() =>
      createListBuilder({ data: [], error: null }, calls) as never) as typeof supabase.from;

    await getPartners({ status: 'all', search: 'move', category: 'moving', sortBy: 'name' });

    expect(calls.filters).not.toContainEqual(['status', 'active']);
    expect(calls.filters).toContainEqual(['category', 'moving']);
    expect(calls.orClauses).toEqual(['name.ilike.%move%,specialization.ilike.%move%']);
    expect(calls.orders).toEqual([['name', true]]);
  });

  test('togglePartnerStatus only flips between active and inactive', async () => {
    const calls = {
      updates: [] as Array<Record<string, unknown>>,
    };

    let invocation = 0;
    mutableSupabase.from = (() => {
      invocation += 1;

      if (invocation === 1) {
        return createSingleBuilder({ data: { status: 'active' }, error: null }) as never;
      }

      return {
        update(payload: Record<string, unknown>) {
          calls.updates.push(payload);
          return this;
        },
        eq() {
          return this;
        },
        select() {
          return this;
        },
        single() {
          return Promise.resolve({
            data: { id: 'partner-1', status: 'inactive' },
            error: null,
          });
        },
      } as never;
    }) as typeof supabase.from;

    const result = await togglePartnerStatus('partner-1');

    expect(calls.updates).toEqual([{ status: 'inactive' }]);
    expect(result.status).toBe('inactive');
  });
});
