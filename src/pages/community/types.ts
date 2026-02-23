
export interface Post {
    id: string;
    user_id?: string;
    author: {
        name: string;
        role: string;
        avatar?: string;
        verified?: boolean;
    };
    type: "story" | "offer" | "qa" | "tip";
    title: string;
    preview?: string;
    content: string;
    images: string[];
    likes: number;
    likes_count?: number;
    comments: number;
    comments_count?: number;
    shares: number;
    timestamp: string;
    created_at?: string;
    updated_at?: string;
    status?: "active" | "hidden" | "reported";
    liked?: boolean;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    created_at: string;
    author: {
        name: string;
        avatar?: string;
    };
    replies?: Comment[];
}

export interface CreatePostData {
    type: Post["type"];
    title: string;
    content: string;
    images?: File[];
}

export interface PostsFilter {
    type?: Post["type"];
    page?: number;
    pageSize?: number;
    userId?: string;
}

export interface PostWithAuthor extends Post {
    author: {
        id: string;
        name: string;
        role: string;
        avatar?: string;
        verified?: boolean;
    };
}
