import { describe, expect, test } from 'vitest';
import { createPost, deletePost } from '@roomz/shared/services/community';

type InsertResult = {
  data: {
    id: string;
    user_id: string;
    type: 'story' | 'offer' | 'qa' | 'tip';
    title: string;
    content: string;
    images: string[];
    likes_count: number;
    comments_count: number;
    status: 'active' | 'hidden' | 'reported';
    created_at: string;
    updated_at: string;
  } | null;
  error: { message?: string } | null;
};

describe('shared community service', () => {
  test('maps legacy post types to database types and persists active status', async () => {
    let insertedPayload: Record<string, unknown> | null = null;

    const builder = {
      insert(payload: Record<string, unknown>) {
        insertedPayload = payload;
        return builder;
      },
      select() {
        return builder;
      },
      async single(): Promise<InsertResult> {
        return {
          data: {
            id: 'post-1',
            user_id: 'user-1',
            type: 'qa',
            title: 'Need advice',
            content: 'Any tips?',
            images: [],
            likes_count: 0,
            comments_count: 0,
            status: 'active',
            created_at: '2026-03-10T00:00:00.000Z',
            updated_at: '2026-03-10T00:00:00.000Z',
          },
          error: null,
        };
      },
    };

    const supabase = {
      from(table: string) {
        expect(table).toBe('community_posts');
        return builder;
      },
    };

    const result = await createPost(supabase as never, {
      type: 'question',
      title: 'Need advice',
      content: 'Any tips?',
      images: [],
    });

    expect(insertedPayload).toMatchObject({
      type: 'qa',
      title: 'Need advice',
      content: 'Any tips?',
      status: 'active',
    });
    expect(result.type).toBe('qa');
    expect(result.status).toBe('active');
  });

  test('soft deletes community posts by hiding them', async () => {
    let updatePayload: Record<string, unknown> | null = null;
    const filters: Array<[string, unknown]> = [];

    const builder = {
      error: null,
      update(payload: Record<string, unknown>) {
        updatePayload = payload;
        return builder;
      },
      eq(column: string, value: unknown) {
        filters.push([column, value]);
        return builder;
      },
    };

    const supabase = {
      from(table: string) {
        expect(table).toBe('community_posts');
        return builder;
      },
    };

    await deletePost(supabase as never, 'post-2');

    expect(updatePayload).toEqual({ status: 'hidden' });
    expect(filters).toEqual([['id', 'post-2']]);
  });
});
