import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { PostDetailModal } from "@/components/modals/PostDetailModal";

// Components
import { PostCard } from "./community/components/PostCard";
import { CommunitySidebar } from "./community/components/CommunitySidebar";
import { usePosts, useToggleLike, useDeletePost } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "./community/types";
import type { PostRow } from "@/services/community";

// Helper to convert PostRow to Post for PostCard
function transformToPost(row: PostRow): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    author: row.author,
    type: row.type as Post['type'],
    title: row.title,
    content: row.content,
    images: row.images,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    shares: 0,
    created_at: row.created_at,
    liked: row.liked || false,
  };
}

export default function CommunityPage() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState<Post['type'] | undefined>(undefined);
  const observerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch posts based on filter
  const { posts, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = usePosts({
    type: filterType,
  });

  const toggleLikeMutation = useToggleLike();
  const deletePostMutation = useDeletePost();

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    switch (value) {
      case "all":
        setFilterType(undefined);
        break;
      case "stories":
        setFilterType("story");
        break;
      case "offers":
        setFilterType("offer");
        break;
      case "qa":
        setFilterType("qa");
        break;
      default:
        setFilterType(undefined);
    }
  };

  // Handle like
  const handleLike = useCallback((postId: string) => {
    toggleLikeMutation.mutate(postId);
  }, [toggleLikeMutation]);

  // Handle post created/updated
  const handlePostCreated = () => {
    setIsCreatePostOpen(false);
    setEditPost(null);
  };

  // Handle edit
  const handleEdit = useCallback((post: Post) => {
    setEditPost(post);
    setIsCreatePostOpen(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback((postId: string) => {
    deletePostMutation.mutate(postId);
  }, [deletePostMutation]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get time ago helper
  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa đăng";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Type helpers
  const getTypeColor = (type: string) => {
    switch (type) {
      case "story":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "offer":
        return "bg-primary/10 text-primary border-primary/20";
      case "qa":
        return "bg-purple-100 text-purple-600 border-purple-200";
      case "tip":
        return "bg-green-100 text-green-600 border-green-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "story":
        return "Chia sẻ";
      case "offer":
        return "Ưu đãi";
      case "qa":
        return "Hỏi đáp";
      case "tip":
        return "Mẹo";
      default:
        return type;
    }
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-2xl border border-border animate-pulse">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
          <div className="h-6 w-3/4 bg-muted rounded mb-3" />
          <div className="h-4 w-full bg-muted rounded mb-2" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>
      ))}
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">Chưa có bài viết nào</p>
      <Button onClick={() => setIsCreatePostOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Viết bài đầu tiên
      </Button>
    </div>
  );

  // Render post list
  const renderPostList = (postRows: PostRow[]) => {
    if (postRows.length === 0) {
      return renderEmpty();
    }

    return (
      <div className="space-y-4">
        {postRows.map((row) => (
          <PostCard
            key={row.id}
            post={transformToPost(row)}
            currentUserId={user?.id}
            onLike={handleLike}
            onClick={() => setSelectedPost(transformToPost(row))}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getTimeAgo={getTimeAgo}
            getTypeColor={getTypeColor}
            getTypeLabel={getTypeLabel}
          />
        ))}
        {/* Load more trigger */}
        <div ref={observerRef} className="h-4">
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Cộng đồng RoomZ
            </h1>
            <p className="text-muted-foreground text-sm hidden sm:block">
              Chia sẻ trải nghiệm, săn tin ưu đãi và kết nối với mọi người
            </p>
          </div>
          <Button
            onClick={() => setIsCreatePostOpen(true)}
            className="bg-primary hover:bg-primary/90 rounded-xl hidden md:flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Viết bài
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-4 mb-6 rounded-xl bg-muted/50 p-1">
                <TabsTrigger value="all" className="rounded-lg">
                  Tất cả
                </TabsTrigger>
                <TabsTrigger value="stories" className="rounded-lg">
                  Chia sẻ
                </TabsTrigger>
                <TabsTrigger value="offers" className="rounded-lg">
                  Ưu đãi
                </TabsTrigger>
                <TabsTrigger value="qa" className="rounded-lg">
                  Hỏi đáp
                </TabsTrigger>
              </TabsList>

              {/* Single content block - filtering is handled by filterType state */}
              <div className="mt-0">
                {isLoading ? renderSkeleton() : renderPostList(posts)}
              </div>
            </Tabs>
          </div>

          {/* Sidebar - Desktop Only */}
          <CommunitySidebar />
        </div>
      </div>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={() => setIsCreatePostOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-40"
        size="icon"
        aria-label="Viết bài mới"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => { setIsCreatePostOpen(false); setEditPost(null); }}
        onPostCreated={handlePostCreated}
        editPost={editPost}
      />

      {selectedPost && (
        <PostDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
          onLike={handleLike}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
