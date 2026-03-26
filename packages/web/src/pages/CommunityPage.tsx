import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { PostDetailModal } from "@/components/modals/PostDetailModal";
import { usePosts, useTopPosts, useToggleLike, useDeletePost } from "@/hooks/useCommunity";
import { createPublicMotion } from "@/lib/motion";
import { stitchAssets } from "@/lib/stitchAssets";
import { StitchFooter } from "@/components/common/StitchFooter";
import type { Post } from "./community/types";
import type { PostRow } from "@/services/community";

const topicChips = [
  "Tìm bạn cùng phòng",
  "Đánh giá khu vực",
  "Thanh lý đồ dùng",
  "Tư vấn pháp lý",
  "Sự kiện",
] as const;

const filterMap = {
  "Tất cả": undefined,
  "Chia sẻ": "story",
  "Ưu đãi": "offer",
  "Hỏi đáp": "qa",
} as const;

const events = [
  {
    date: "24",
    month: "T10",
    title: "Workshop: Pháp lý trong thuê nhà",
    meta: "19:00 - 21:00 • Online Zoom",
    cta: "Tham gia ngay",
    tone: "primary",
  },
  {
    date: "28",
    month: "T10",
    title: "Meetup: Coffee kết nối bạn trọ",
    meta: "09:00 - 11:30 • Quận 1, TP.HCM",
    cta: "Đăng ký",
    tone: "tertiary",
  },
] as const;

function transformToPost(row: PostRow): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    author: row.author,
    type: row.type as Post["type"],
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

function getTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return "Vừa đăng";
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function getFeaturedMedia(post: PostRow, fallbackImage: string) {
  return post.images.length > 0 ? post.images : [fallbackImage];
}

export default function CommunityPage() {
  const shouldReduceMotion = useReducedMotion();
  const motionTokens = useMemo(
    () => createPublicMotion(!!shouldReduceMotion),
    [shouldReduceMotion],
  );
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<keyof typeof filterMap>("Tất cả");

  const { posts, isLoading } = usePosts({
    type: filterMap[activeFilter],
  });
  const { data: topPosts = [] } = useTopPosts(3);
  const toggleLikeMutation = useToggleLike();
  const deletePostMutation = useDeletePost();

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts;
    }

    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query),
    );
  }, [posts, searchQuery]);

  const featuredPosts = filteredPosts.slice(0, 2);
  const storyPosts = filteredPosts.slice(2, 4);

  const contributorCards = useMemo(
    () =>
      topPosts.slice(0, 3).map((post, index) => ({
        name: post.author.name,
        subtitle: `${post.likes_count} lượt thích`,
        avatar: stitchAssets.community.contributors[index],
        rank: index + 1,
      })),
    [topPosts],
  );

  return (
    <div className="bg-background text-foreground">
      <main
        className="mx-auto max-w-7xl px-6 py-8 pt-24 md:py-12"
        aria-label="Noi dung chinh cong dong, skip link duoc cung cap boi AppShell"
      >
        <motion.section
          className="relative mb-16 overflow-hidden rounded-[32px] shadow-2xl"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.revealScale(22)}
        >
          <div className="stitch-primary-gradient relative z-10 flex flex-col items-center p-12 text-center md:p-20">
            <h1 className="mb-6 text-white">Cộng đồng RommZ</h1>
            <p className="mb-10 max-w-2xl text-lg font-medium text-blue-50/90 md:text-xl">
              Nơi kết nối sinh viên và người thuê trẻ, chia sẻ kinh nghiệm ở thật,
              review khu vực thật và giúp nhau đỡ lạc hơn khi ra ở riêng.
            </p>
            <div className="flex w-full max-w-2xl flex-col gap-4 md:flex-row">
              <div className="group relative flex-grow">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  id="community-search"
                  aria-label="Tim kiem chu de thao luan"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm kiếm chủ đề thảo luận..."
                  className="w-full rounded-full border-none bg-white px-12 py-4 text-lg text-foreground shadow-lg outline-none ring-0"
                />
              </div>
              <motion.button
                type="button"
                onClick={() => setIsCreatePostOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.currentTarget.blur();
                  }
                }}
                className="flex items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-8 py-4 font-display text-sm font-bold text-primary shadow-lg transition-transform hover:scale-[1.02]"
                whileHover={motionTokens.hoverSoft}
                whileTap={motionTokens.tap}
              >
                Tạo bài viết
              </motion.button>
            </div>
          </div>
          <div className="absolute -left-[5%] bottom-[-10%] h-96 w-96 rounded-full bg-primary-container/20 blur-3xl" />
          <div className="absolute -right-[5%] top-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </motion.section>

        <motion.section
          className="mb-16"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.stagger(0.06, 0.04)}
        >
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            variants={motionTokens.stagger(0.05, 0.03)}
          >
            {topicChips.map((chip) => (
              <motion.button
                key={chip}
                type="button"
                className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-foreground shadow-sm transition-all hover:bg-primary-container/10 hover:shadow-md"
                variants={motionTokens.revealScale(12)}
                whileTap={motionTokens.tap}
              >
                <span className="text-primary">•</span>
                {chip}
              </motion.button>
            ))}
          </motion.div>
        </motion.section>

        <motion.div
          className="grid gap-12 lg:grid-cols-12"
          initial="hidden"
          whileInView="show"
          viewport={motionTokens.viewport}
          variants={motionTokens.stagger(0.08, 0.06)}
        >
          <div className="space-y-16 lg:col-span-8">
            <section>
              <div className="mb-8 flex items-end justify-between">
                <h2 className="text-3xl">Thảo luận nổi bật</h2>
                <div className="flex gap-2">
                  {Object.keys(filterMap).map((filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setActiveFilter(filter as keyof typeof filterMap)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              <motion.div className="space-y-6" variants={motionTokens.stagger(0.08, 0.06)}>
                {featuredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPost(transformToPost(post))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedPost(transformToPost(post));
                      }
                    }}
                    className="group w-full rounded-[28px] bg-surface-container-lowest p-8 text-left shadow-[0_10px_40px_rgba(40,43,81,0.04)] transition-all hover:shadow-[0_20px_60px_rgba(40,43,81,0.08)]"
                    variants={motionTokens.revealScale(18)}
                  >
                    {(() => {
                      const media = getFeaturedMedia(
                        post,
                        stitchAssets.community.storyImages[index % stitchAssets.community.storyImages.length],
                      );

                      if (media.length === 1) {
                        return (
                          <div className="mb-6 overflow-hidden rounded-[24px] bg-surface-container-low p-3">
                            <img
                              src={media[0]}
                              alt={post.title}
                              className="h-auto max-h-[360px] w-full rounded-[18px] object-contain"
                            />
                          </div>
                        );
                      }

                      return (
                        <div className="mb-6 grid gap-3 sm:grid-cols-2">
                          {media.slice(0, 3).map((image, imageIndex) => {
                            const isLastVisible = imageIndex === 2;
                            const extraImages = media.length - 3;

                            return (
                              <div
                                key={`${post.id}-${image}-${imageIndex}`}
                                className={`relative overflow-hidden rounded-[20px] bg-surface-container-low ${
                                  imageIndex === 0 && media.length >= 3 ? "sm:col-span-2" : ""
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`${post.title} - ảnh ${imageIndex + 1}`}
                                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                                    imageIndex === 0 && media.length >= 3 ? "h-52" : "h-44"
                                  }`}
                                />
                                {isLastVisible && extraImages > 0 ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/52">
                                    <span className="text-base font-bold text-white">
                                      +{extraImages} ảnh
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="mb-4 flex items-start gap-4">
                      <img
                        src={stitchAssets.community.discussionAvatars[index] || stitchAssets.community.discussionAvatars[0]}
                        alt={post.author.name}
                        className="h-12 w-12 rounded-full border-2 border-primary-container/20 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Bởi <span className="font-bold text-primary">{post.author.name}</span> •{" "}
                          {getTimeAgo(post.created_at)}
                        </p>
                      </div>
                      <Badge className="rounded-full bg-tertiary-container text-tertiary-container-foreground">
                        {post.type === "qa" ? "Hỏi đáp" : post.type === "offer" ? "Ưu đãi" : "Chia sẻ"}
                      </Badge>
                    </div>

                    <p className="mb-6 line-clamp-2 text-muted-foreground">{post.content}</p>

                    <div className="flex items-center gap-6 border-t border-surface-container-low pt-6 text-sm text-muted-foreground">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleLikeMutation.mutate(post.id);
                        }}
                        className="flex items-center gap-2 transition-colors hover:text-primary"
                      >
                        ❤️ <span className="font-bold">{post.likes_count}</span>
                      </button>
                      <span className="flex items-center gap-2">
                        💬 <span className="font-bold">{post.comments_count}</span>
                      </span>
                      <span className="ml-auto">Mở chi tiết</span>
                    </div>
                  </motion.article>
                ))}

                {!isLoading && featuredPosts.length === 0 ? (
                  <div className="rounded-[28px] bg-white p-8 text-center text-muted-foreground stitch-editorial-shadow">
                    Chưa có bài viết phù hợp với bộ lọc hiện tại.
                  </div>
                ) : null}
              </motion.div>
            </section>

            <section>
              <div className="mb-8">
                <h2 className="text-3xl">Chuyện chúng mình</h2>
                <p className="mt-2 font-medium text-muted-foreground">
                  Những lát cắt chân thực về cuộc sống thuê trọ, chuyển nhà và ở ghép.
                </p>
              </div>

              <motion.div
                className="grid gap-8 md:grid-cols-2"
                variants={motionTokens.stagger(0.08, 0.06)}
              >
                {storyPosts.map((post, index) => (
                  <motion.button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPost(transformToPost(post))}
                    className="group overflow-hidden rounded-[28px] bg-white text-left shadow-sm transition-all hover:shadow-xl"
                    variants={motionTokens.revealScale(18)}
                    whileTap={motionTokens.tap}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={post.images[0] || stitchAssets.community.storyImages[index] || stitchAssets.community.storyImages[0]}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                      <div className="absolute bottom-4 left-6">
                        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                          {post.type === "offer" ? "Ưu đãi" : "Phóng sự"}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h4 className="mb-4 text-xl transition-colors group-hover:text-primary">
                        {post.title}
                      </h4>
                      <p className="mb-6 line-clamp-3 text-muted-foreground">{post.content}</p>
                      <span className="font-display text-sm font-bold text-primary">
                        Đọc tiếp
                      </span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </section>
          </div>

          <motion.aside className="space-y-12 lg:col-span-4" variants={motionTokens.stagger(0.08, 0.08)}>
            <motion.section
              className="rounded-[28px] bg-surface-container-low p-8"
              variants={motionTokens.revealScale(18)}
            >
              <h3 className="mb-6 flex items-center gap-2 text-2xl">
                <span className="text-primary">◦</span>
                Sự kiện sắp tới
              </h3>
              <div className="space-y-6">
                {events.map((event) => (
                  <div
                    key={event.title}
                    className={`rounded-[24px] bg-white p-5 shadow-sm border-l-4 ${
                      event.tone === "primary" ? "border-primary" : "border-tertiary"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div
                        className={`rounded-md p-2 text-center font-bold leading-tight ${
                          event.tone === "primary"
                            ? "bg-primary-container/20 text-primary"
                            : "bg-tertiary-container/20 text-tertiary"
                        }`}
                      >
                        <span className="block text-xs uppercase">{event.month}</span>
                        <span className="text-lg">{event.date}</span>
                      </div>
                      <h4 className="font-display text-base font-bold">{event.title}</h4>
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">{event.meta}</p>
                    <Button className={event.tone === "primary" ? "w-full rounded-full" : "w-full rounded-full bg-tertiary text-white hover:bg-tertiary/90"}>
                      {event.cta}
                    </Button>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              className="rounded-[28px] border border-surface-container bg-white p-8 shadow-[0_10px_40px_rgba(40,43,81,0.04)]"
              variants={motionTokens.revealScale(18)}
            >
              <h3 className="mb-6 flex items-center gap-2 text-2xl">
                <Star className="h-5 w-5 text-secondary" />
                Thành viên tích cực
              </h3>
              <div className="space-y-6">
                {contributorCards.map((contributor) => (
                  <div key={contributor.name} className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={contributor.avatar}
                        alt={contributor.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
                        {contributor.rank}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-display text-base font-bold">{contributor.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground">{contributor.subtitle}</p>
                    </div>
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-8 w-full rounded-full">
                Gia nhập đội ngũ
              </Button>
            </motion.section>

            <motion.div
              className="stitch-primary-gradient relative overflow-hidden rounded-[28px] p-8 text-white"
              variants={motionTokens.revealScale(18)}
            >
              <div className="relative z-10">
                <h4 className="text-xl text-white">Bạn có mẹo hay?</h4>
                <p className="mt-2 text-sm text-white/80">
                  Chia sẻ kinh nghiệm của bạn để giúp cộng đồng và nhận huy hiệu đóng góp.
                </p>
                <motion.button
                  type="button"
                  onClick={() => setIsCreatePostOpen(true)}
                  className="mt-6 rounded-full bg-white px-6 py-2 text-sm font-bold text-primary shadow-md"
                  whileHover={motionTokens.hoverSoft}
                  whileTap={motionTokens.tap}
                >
                  Bắt đầu ngay
                </motion.button>
              </div>
              <span className="absolute -bottom-4 -right-4 text-8xl opacity-20">💡</span>
            </motion.div>
          </motion.aside>
        </motion.div>
      </main>

      <StitchFooter />

      <Button
        onClick={() => setIsCreatePostOpen(true)}
        className="fixed bottom-28 right-6 h-16 w-16 rounded-full md:bottom-12 md:right-12"
        size="icon"
      >
        +
      </Button>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => {
          setIsCreatePostOpen(false);
          setEditPost(null);
        }}
        onPostCreated={() => {
          setIsCreatePostOpen(false);
          setEditPost(null);
        }}
        editPost={editPost}
      />

      {selectedPost ? (
        <PostDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
          onLike={(postId) => toggleLikeMutation.mutate(postId)}
          onEdit={(post) => {
            setEditPost(post);
            setIsCreatePostOpen(true);
          }}
          onDelete={(postId) => deletePostMutation.mutate(postId)}
        />
      ) : null}
    </div>
  );
}
