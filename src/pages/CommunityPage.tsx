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
        name: "Sarah Chen",
        role: "Student • Computer Science",
        verified: true,
      },
      type: "story",
      title: "My First Month Living Off-Campus",
      preview: "Moving into my first apartment was both exciting and terrifying! Here's what I learned about budgeting, cooking, and making new friends...",
      content: "Moving into my first apartment was both exciting and terrifying! Here's what I learned about budgeting, cooking, and making new friends in the neighborhood. The transition from dorm life to independent living taught me so much about responsibility and self-care. I'd love to share my tips with other students making this transition!",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
      ],
      likes: 124,
      comments: 18,
      shares: 5,
      timestamp: "2 hours ago",
      liked: false,
    },
    {
      id: "2",
      author: {
        name: "Michael Torres",
        role: "Host • Property Manager",
        verified: true,
      },
      type: "offer",
      title: "🏠 Cozy Room Available Near Campus - Special Student Rate!",
      preview: "Fully furnished private room in a modern 3-bedroom apartment. $750/month including utilities. Available from November 1st...",
      content: "Fully furnished private room in a modern 3-bedroom apartment. $750/month including utilities. Available from November 1st. Perfect for students - quiet building, great wifi, close to bus stops. Current roommates are friendly grad students. First month gets 15% off!",
      images: [
        "https://images.unsplash.com/photo-1668089677938-b52086753f77?w=800",
      ],
      likes: 89,
      comments: 23,
      shares: 12,
      timestamp: "5 hours ago",
      liked: false,
    },
    {
      id: "3",
      author: {
        name: "Alex Kim",
        role: "Student • Business Major",
        verified: false,
      },
      type: "qa",
      title: "How to Split Utilities Fairly?",
      preview: "My roommates and I are having trouble deciding how to split electricity bills. Should we split evenly or based on usage? What's the standard practice?",
      content: "My roommates and I are having trouble deciding how to split electricity bills. Should we split evenly or based on usage? What's the standard practice? We have 3 people in a 2-bedroom apartment and one person works from home. Any advice would be appreciated!",
      images: [],
      likes: 45,
      comments: 31,
      shares: 2,
      timestamp: "1 day ago",
      liked: true,
    },
    {
      id: "4",
      author: {
        name: "Emma Wilson",
        role: "Student • Engineering",
        verified: false,
      },
      type: "story",
      title: "Best Study Spots Near University District",
      preview: "I've explored every café and library in the area - here are my top 5 places for productive studying with great coffee and wifi...",
      content: "I've explored every café and library in the area - here are my top 5 places for productive studying with great coffee and wifi. From quiet corners to collaborative spaces, I've got recommendations for every study style. Plus, some of these places offer student discounts!",
      images: [
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
      ],
      likes: 156,
      comments: 42,
      shares: 28,
      timestamp: "2 days ago",
      liked: false,
    },
  ]);

  const topPosts = [
    { title: "Moving checklist for students", likes: 342 },
    { title: "How I saved $500/month on rent", likes: 289 },
    { title: "Roommate agreement template", likes: 234 },
  ];

  const suggestedTopics = [
    "#RoommateTips",
    "#ForRent",
    "#CampusLife",
    "#StudentDeals",
    "#ApartmentHunting",
    "#MovingAdvice",
  ];

  const followedHosts = [
    { name: "John Davis", properties: 5 },
    { name: "Lisa Park", properties: 8 },
    { name: "Robert Lee", properties: 3 },
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
      timestamp: "Just now",
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
        return "Story";
      case "offer":
        return "Offer";
      case "qa":
        return "Q&A";
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
              <h1 className="mb-2">RoomZ Community</h1>
              <p className="text-gray-600">
                Share stories, find offers, and connect with the community
              </p>
            </div>
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-primary hover:bg-primary/90 rounded-full hidden md:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
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
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="stories">Stories</TabsTrigger>
                <TabsTrigger value="offers">Offers</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
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
                <h3>Top Posts This Week</h3>
              </div>
              <div className="space-y-3">
                {topPosts.map((post, index) => (
                  <div key={index} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{post.likes} likes</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Suggested Topics */}
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-primary" />
                <h3>Suggested Topics</h3>
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
                <h3>Followed Hosts</h3>
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
                      <p className="text-xs text-gray-500">{host.properties} properties</p>
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
        size="icon"
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
                    alt={`Post image ${index + 1}`}
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
