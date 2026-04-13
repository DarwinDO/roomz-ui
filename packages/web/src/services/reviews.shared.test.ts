import { describe, expect, test } from 'vitest';
import { updateReview } from '@roomz/shared/services/reviews';

describe('shared reviews service', () => {
  test('re-selects reviewer premium metadata after updating a review', async () => {
    let selectedColumns = '';

    const builder = {
      update() {
        return builder;
      },
      eq() {
        return builder;
      },
      select(columns: string) {
        selectedColumns = columns;
        return builder;
      },
      async single() {
        return {
          data: {
            id: 'review-1',
            partner_id: 'partner-1',
            user_id: 'user-1',
            rating: 5,
            comment: 'Updated review',
            images: [],
            is_verified: true,
            status: 'published',
            created_at: '2026-04-01T00:00:00.000Z',
            updated_at: '2026-04-13T00:00:00.000Z',
            user: {
              id: 'user-1',
              full_name: 'Premium Reviewer',
              avatar_url: 'https://example.com/avatar.jpg',
              is_premium: true,
            },
          },
          error: null,
        };
      },
    };

    const supabase = {
      from(table: string) {
        expect(table).toBe('reviews');
        return builder;
      },
    };

    const result = await updateReview(supabase as never, 'review-1', {
      comment: 'Updated review',
    });

    expect(selectedColumns).toContain('user:users!user_id');
    expect(selectedColumns).toContain('is_premium');
    expect(result.user).toMatchObject({
      id: 'user-1',
      full_name: 'Premium Reviewer',
      is_premium: true,
    });
  });
});
