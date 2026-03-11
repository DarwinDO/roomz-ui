import { test, expect } from '@playwright/test';
import { getPotentialMatches } from '@roomz/shared/services/swap';

test.describe('shared swap service', () => {
  test('calls the swap match RPC with the current database contract', async () => {
    const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const supabase = {
      rpc: async (name: string, args: Record<string, unknown>) => {
        rpcCalls.push({ name, args });
        return {
          data: [
            { id: 'match-1', match_score: 72 },
            { id: 'match-2', match_score: 65 },
          ],
          error: null,
        };
      },
    };

    const result = await getPotentialMatches(supabase as never, 'listing-1');

    expect(rpcCalls).toEqual([
      {
        name: 'find_potential_swap_matches',
        args: {
          p_listing_id: 'listing-1',
        },
      },
    ]);
    expect(result.totalCount).toBe(2);
    expect(result.matches).toHaveLength(2);
  });
});
