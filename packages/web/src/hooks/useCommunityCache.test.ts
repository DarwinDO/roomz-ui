import { describe, expect, test } from 'vitest';
import type { PostRow } from '../services/community';
import {
    updatePostInCommunityDetail,
    updatePostInCommunityFeed,
    updatePostInCommunityList,
    type CommunityFeedData,
} from './useCommunityCache';

function createPost(overrides: Partial<PostRow> = {}): PostRow {
    return {
        id: 'post-1',
        user_id: 'user-1',
        type: 'story',
        title: 'Community update',
        content: 'Body',
        images: [],
        likes_count: 2,
        comments_count: 1,
        status: 'active',
        created_at: '2026-04-12T00:00:00.000Z',
        updated_at: '2026-04-12T00:00:00.000Z',
        author: {
            id: 'user-1',
            name: 'Lan Anh',
            role: 'student',
        },
        liked: false,
        ...overrides,
    };
}

describe('useCommunityCache helpers', () => {
    test('updates the matching post across paginated feed pages', () => {
        const feed: CommunityFeedData = {
            pages: [
                {
                    posts: [createPost(), createPost({ id: 'post-2', likes_count: 5 })],
                    totalCount: 3,
                },
                {
                    posts: [createPost({ id: 'post-3', comments_count: 4 })],
                    totalCount: 3,
                },
            ],
            pageParams: [1, 2],
        };

        const updatedFeed = updatePostInCommunityFeed(feed, 'post-3', (post) => ({
            ...post,
            comments_count: post.comments_count + 1,
        }));

        expect(updatedFeed?.pages[1]?.posts[0]?.comments_count).toBe(5);
        expect(updatedFeed?.pages[0]?.posts[0]?.comments_count).toBe(1);
    });

    test('updates matching list and detail entries without touching unrelated posts', () => {
        const posts = [createPost(), createPost({ id: 'post-2', liked: true, likes_count: 6 })];
        const detail = createPost({ id: 'post-2', liked: true, likes_count: 6 });

        const updatedPosts = updatePostInCommunityList(posts, 'post-2', (post) => ({
            ...post,
            liked: false,
            likes_count: post.likes_count - 1,
        }));
        const updatedDetail = updatePostInCommunityDetail(detail, 'post-2', (post) => ({
            ...post,
            liked: false,
            likes_count: post.likes_count - 1,
        }));

        expect(updatedPosts?.[0]?.likes_count).toBe(2);
        expect(updatedPosts?.[1]).toMatchObject({
            liked: false,
            likes_count: 5,
        });
        expect(updatedDetail).toMatchObject({
            liked: false,
            likes_count: 5,
        });
    });
});
