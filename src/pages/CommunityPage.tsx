import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { PostDetailModal } from "@/components/modals/PostDetailModal";

// Components & Types
import { PostCard } from "./community/components/PostCard";
import { CommunitySidebar } from "./community/components/CommunitySidebar";
import type { Post } from "./community/types";

export default function CommunityPage() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: {
        name: "Nguyễn Hoàng Linh",
        role: "Sinh viên • Khoa Công nghệ thông tin",
        verified: true,
      },
      type: "story",
      title: "Tháng đầu tiên sống ngoài ký túc xá",
      preview:
        "Chuyển ra ở riêng vừa háo hức vừa hơi choáng. Mình học cách tự cân đối chi phí, nấu ăn và giữ phòng gọn gàng hơn thế nào...",
      content:
        "Sau một tháng sống ngoài ký túc xá, mình đã quen với việc lập bảng chi tiêu, chuẩn bị các bữa ăn đơn giản và phân chia việc nhà với bạn cùng phòng. Hy vọng những kinh nghiệm nhỏ này sẽ giúp các bạn chuẩn bị sớm khi ra ở riêng.",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
      ],
      likes: 124,
      comments: 18,
      shares: 5,
      timestamp: "2 giờ trước",
      liked: false,
    },
    {
      id: "2",
      author: {
        name: "Trần Minh Tuấn",
        role: "Chủ nhà • Quản lý căn hộ",
        verified: true,
      },
      type: "offer",
      title: "Phòng riêng full nội thất gần ĐH Bách Khoa",
      preview:
        "Phòng 18m² trong căn hộ 3 phòng ngủ, 7.5tr/tháng đã bao gồm điện nước và wifi. Có thể vào ở từ 01/11...",
      content:
        "Phòng riêng rộng 18m², đầy đủ nội thất, tủ lạnh mini và bàn học. Giá 7.500.000đ/tháng đã bao gồm điện nước, wifi. Căn hộ có thang máy, bảo vệ 24/7, cách cổng trường 5 phút đi bộ. Giảm 10% cho sinh viên thanh toán 3 tháng/lần.",
      images: ["https://images.unsplash.com/photo-1668089677938-b52086753f77?w=800"],
      likes: 89,
      comments: 23,
      shares: 12,
      timestamp: "5 giờ trước",
      liked: false,
    },
    {
      id: "3",
      author: {
        name: "Phạm Thu Hà",
        role: "Sinh viên • Khoa Kinh tế",
        verified: false,
      },
      type: "qa",
      title: "Chia tiền điện nước sao cho công bằng?",
      preview:
        "Nhà mình có 3 người, 1 bạn làm việc ở nhà nên dùng điện nhiều hơn. Mọi người thường chia tiền như thế nào cho hợp lý?",
      content:
        "Nhà mình có 3 người ở chung. Hai bạn đi học cả ngày, một bạn làm việc tại nhà nên dùng điều hòa và máy tính nhiều hơn. Mọi người thường chia tiền điện nước theo đầu người hay theo mức sử dụng? Có mẹo nào theo dõi chỉ số định kỳ không?",
      images: [],
      likes: 45,
      comments: 31,
      shares: 2,
      timestamp: "1 ngày trước",
      liked: true,
    },
    {
      id: "4",
      author: {
        name: "Lê Khánh Vy",
        role: "Sinh viên • Kỹ thuật môi trường",
        verified: false,
      },
      type: "story",
      title: "5 quán cà phê học bài yêu thích ở Quận 3",
      preview:
        "Mình đã đi thử gần hết các quán cà phê quanh trường. Đây là 5 địa điểm học bài có ổ cắm, wifi mạnh và nhạc chill nhất...",
      content:
        "Nếu bạn đang tìm địa điểm học bài cuối tuần, đây là 5 quán cà phê mình thích nhất: có ổ cắm đầy đủ, wifi khỏe, không gian yên tĩnh và đồ uống dưới 60k. Một vài quán còn có ưu đãi giảm giá cho sinh viên nữa!",
      images: [
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
      ],
      likes: 156,
      comments: 42,
      shares: 28,
      timestamp: "2 ngày trước",
      liked: false,
    },
  ]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handlePostCreated = (newPost: Omit<Post, "id" | "likes" | "comments" | "shares" | "timestamp">) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: "Vừa đăng",
    };
    setPosts([post, ...posts]);
  };

  const getTimeAgo = (timestamp: string) => {
    return timestamp;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "story":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "offer":
        return "bg-primary/10 text-primary border-primary/20";
      case "qa":
        return "bg-purple-100 text-purple-600 border-purple-200";
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
      default:
        return type;
    }
  };

  const renderPostList = (filteredPosts: Post[]) => (
    <div className="space-y-4 animate-fade-in stagger-children">
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onClick={() => setSelectedPost(post)}
          getTimeAgo={getTimeAgo}
          getTypeColor={getTypeColor}
          getTypeLabel={getTypeLabel}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Cộng đồng rommz</h1>
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
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 rounded-xl bg-muted/50 p-1">
                <TabsTrigger value="all" className="rounded-lg">Tất cả</TabsTrigger>
                <TabsTrigger value="stories" className="rounded-lg">Chia sẻ</TabsTrigger>
                <TabsTrigger value="offers" className="rounded-lg">Ưu đãi</TabsTrigger>
                <TabsTrigger value="qa" className="rounded-lg">Hỏi đáp</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {renderPostList(posts)}
              </TabsContent>

              <TabsContent value="stories" className="mt-0">
                {renderPostList(posts.filter(p => p.type === "story"))}
              </TabsContent>

              <TabsContent value="offers" className="mt-0">
                {renderPostList(posts.filter(p => p.type === "offer"))}
              </TabsContent>

              <TabsContent value="qa" className="mt-0">
                {renderPostList(posts.filter(p => p.type === "qa"))}
              </TabsContent>
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
        size="icon" aria-label="Viết bài mới"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {selectedPost && (
        <PostDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
          onLike={handleLike}
        />
      )}
    </div>
  );
}
