import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  TrendingUp,
  Hash,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { PostDetailModal } from "@/components/modals/PostDetailModal";

interface Post {
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

  const topPosts = [
    { title: "Checklist chuyển phòng cho sinh viên", likes: 342 },
    { title: "Bí kíp giảm 2 triệu tiền nhà mỗi tháng", likes: 289 },
    { title: "Mẫu thỏa thuận ở ghép rõ ràng", likes: 234 },
  ];

  const suggestedTopics = [
    "#MeoRoommate",
    "#PhongChoThue",
    "#DoiSongSinhVien",
    "#UuDaiSinhVien",
    "#SanPhongGiaTot",
    "#BiKipChuyenNha",
  ];

  const followedHosts = [
    { name: "Ngô Minh Phúc", properties: 5 },
    { name: "Vũ Hải Yến", properties: 8 },
    { name: "Đặng Quốc Bảo", properties: 3 },
  ];

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
        return "bg-secondary/10 text-secondary";
      case "offer":
        return "bg-primary/10 text-primary";
      case "qa":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 px-6 py-8 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-2">Cộng đồng RoomZ</h1>
              <p className="text-gray-600">
                Chia sẻ trải nghiệm, săn tin ưu đãi và kết nối với mọi người
              </p>
            </div>
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-primary hover:bg-primary/90 rounded-full hidden md:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Viết bài
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="stories">Chia sẻ</TabsTrigger>
                <TabsTrigger value="offers">Ưu đãi</TabsTrigger>
                <TabsTrigger value="qa">Hỏi đáp</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {posts.map((post) => (
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
              </TabsContent>

              <TabsContent value="stories" className="space-y-4">
                {posts.filter(p => p.type === "story").map((post) => (
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
              </TabsContent>

              <TabsContent value="offers" className="space-y-4">
                {posts.filter(p => p.type === "offer").map((post) => (
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
              </TabsContent>

              <TabsContent value="qa" className="space-y-4">
                {posts.filter(p => p.type === "qa").map((post) => (
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block space-y-6">
            {/* Top Posts */}
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3>Bài viết nổi bật trong tuần</h3>
              </div>
              <div className="space-y-3">
                {topPosts.map((post, index) => (
                  <div key={index} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{post.likes} lượt thích</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Suggested Topics */}
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-primary" />
                <h3>Chủ đề gợi ý</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((topic, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Followed Hosts */}
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3>Chủ nhà đang theo dõi</h3>
              </div>
              <div className="space-y-3">
                {followedHosts.map((host, index) => (
                  <div key={index} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                        {host.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{host.name}</p>
                      <p className="text-xs text-gray-500">{host.properties} tin đang mở</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onClick: () => void;
  getTimeAgo: (timestamp: string) => string;
  getTypeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
}

function PostCard({ post, onLike, onClick, getTimeAgo, getTypeColor, getTypeLabel }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="p-5 rounded-2xl transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : undefined,
        border: isHovered ? '2px solid #E6EFFF' : '2px solid transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Clickable Card Body */}
      <div onClick={onClick}>
        {/* Author Info */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
              {post.author.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm truncate">{post.author.name}</p>
              {post.author.verified && (
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500">{post.author.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(post.type)} variant="outline">
              {getTypeLabel(post.type)}
            </Badge>
            <span className="text-xs text-gray-400">{getTimeAgo(post.timestamp)}</span>
          </div>
        </div>

        {/* Post Content */}
        <div>
          <h3 className="mb-2">{post.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.preview}</p>

          {/* Images */}
          {post.images.length > 0 && (
            <div className={`grid gap-2 mb-4 ${
              post.images.length === 1 ? "grid-cols-1" :
              post.images.length === 2 ? "grid-cols-2" :
              "grid-cols-3"
            }`}>
              {post.images.slice(0, 3).map((image, index) => (
                <div key={index} className="relative aspect-video overflow-hidden rounded-xl">
                  <ImageWithFallback
                    src={image}
                    alt={`Ảnh bài viết ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interaction Bar - Not Clickable for Modal */}
      <div 
        className="flex items-center gap-4 pt-3 border-t"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors cursor-pointer"
        >
          <Heart className={`w-5 h-5 ${post.liked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{post.likes}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle share action
          }}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors cursor-pointer"
        >
          <Share2 className="w-5 h-5" />
          <span>{post.shares}</span>
        </button>
      </div>
    </Card>
  );
}

