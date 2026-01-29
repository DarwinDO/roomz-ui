export interface Post {
    id: string;
    author: {
        name: string;
        role: string;
        avatar?: string;
        verified?: boolean;
    };
    type: "story" | "offer" | "qa";
    title: string;
    preview: string;
    content: string;
    images: string[];
    likes: number;
    comments: number;
    shares: number;
    timestamp: string;
    liked?: boolean;
}
