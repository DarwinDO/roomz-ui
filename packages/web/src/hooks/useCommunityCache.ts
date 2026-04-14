import type { InfiniteData } from '@tanstack/react-query';
import type { PostRow } from '@/services/community';

export type CommunityFeedPage = {
    posts: PostRow[];
    totalCount: number;
};

export type CommunityFeedData = CommunityFeedPage | InfiniteData<CommunityFeedPage>;

type PostUpdater = (post: PostRow) => PostRow;

function updateMatchingPost(post: PostRow, postId: string, updater: PostUpdater) {
    return post.id === postId ? updater(post) : post;
}

export function updatePostInCommunityFeed(
    data: CommunityFeedData | undefined,
    postId: string,
    updater: PostUpdater,
) {
    if (!data) {
        return data;
    }

    if ('pages' in data) {
        return {
            ...data,
            pages: data.pages.map((page) => ({
                ...page,
                posts: page.posts.map((post) => updateMatchingPost(post, postId, updater)),
            })),
        };
    }

    return {
        ...data,
        posts: data.posts.map((post) => updateMatchingPost(post, postId, updater)),
    };
}

export function updatePostInCommunityList(
    posts: PostRow[] | undefined,
    postId: string,
    updater: PostUpdater,
) {
    if (!posts) {
        return posts;
    }

    return posts.map((post) => updateMatchingPost(post, postId, updater));
}

export function updatePostInCommunityDetail(
    post: PostRow | null | undefined,
    postId: string,
    updater: PostUpdater,
) {
    if (!post || post.id !== postId) {
        return post;
    }

    return updater(post);
}
