import { test, expect } from '@playwright/test';
import { supabase } from '@/lib/supabase';
import { assignPartnerToLead, updateServiceLeadStatus } from './admin';

type UpdateResult = {
  error: {
    message?: string;
  } | null;
};

type UpdateBuilder = {
  error: UpdateResult['error'];
  update: (payload: Record<string, unknown>) => UpdateBuilder;
  eq: (column: string, value: unknown) => UpdateBuilder;
};

function createAdminUpdateBuilder(result: UpdateResult) {
  const calls = {
    updates: [] as Record<string, unknown>[],
    filters: [] as Array<[string, unknown]>,
  };

  const builder: UpdateBuilder = {
    error: result.error,
    update(payload) {
      calls.updates.push(payload);
      return builder;
    },
    eq(column, value) {
      calls.filters.push([column, value]);
      return builder;
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

test.describe('admin service lead mutations', () => {
  const originalFrom = mutableSupabase.from;
  const originalGetUser = mutableSupabase.auth.getUser;

  test.afterEach(() => {
    mutableSupabase.from = originalFrom;
    mutableSupabase.auth.getUser = originalGetUser;
  });

  test('assignPartnerToLead clears rejection metadata and records assignment audit fields', async () => {
    const { builder, calls } = createAdminUpdateBuilder({ error: null });

    mutableSupabase.auth.getUser = (async () =>
      ({ data: { user: { id: 'admin-1' } }, error: null })) as typeof supabase.auth.getUser;
    mutableSupabase.from = ((table: string) => {
      expect(table).toBe('service_leads');
      return builder as never;
    }) as typeof supabase.from;

    await assignPartnerToLead('lead-1', 'partner-1');

    expect(calls.updates).toHaveLength(1);
    expect(calls.updates[0]).toMatchObject({
      partner_id: 'partner-1',
      status: 'assigned',
      assigned_by: 'admin-1',
      rejection_reason: null,
    });
    expect(typeof calls.updates[0].assigned_at).toBe('string');
    expect(typeof calls.updates[0].updated_at).toBe('string');
    expect(calls.filters).toEqual([['id', 'lead-1']]);
  });

  test('updateServiceLeadStatus clears stale rejection reason for non-rejected states', async () => {
    const { builder, calls } = createAdminUpdateBuilder({ error: null });

    mutableSupabase.from = (() => builder as never) as typeof supabase.from;

    await updateServiceLeadStatus('lead-2', 'confirmed');

    expect(calls.updates[0]).toMatchObject({
      status: 'confirmed',
      rejection_reason: null,
    });
    expect(typeof calls.updates[0].updated_at).toBe('string');
  });

  test('updateServiceLeadStatus stores rejection reason only for rejected states', async () => {
    const { builder, calls } = createAdminUpdateBuilder({ error: null });

    mutableSupabase.from = (() => builder as never) as typeof supabase.from;

    await updateServiceLeadStatus('lead-3', 'rejected', 'Missing documents');

    expect(calls.updates[0]).toMatchObject({
      status: 'rejected',
      rejection_reason: 'Missing documents',
    });
    expect(calls.filters).toEqual([['id', 'lead-3']]);
  });
});
