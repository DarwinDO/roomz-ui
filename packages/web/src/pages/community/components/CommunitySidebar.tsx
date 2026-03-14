import { Card } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";
import { useTopPosts } from "@/hooks/useCommunity";

export function CommunitySidebar() {
    const { data: topPosts, isLoading } = useTopPosts(5);

    // Get time ago helper
    const getTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return "Vừa đăng";
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}ng`;
        return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
    };

    return (
        <div className="hidden lg:block space-y-6">
            {/* Top Posts */}
            <Card className="p-5 rounded-2xl shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Bài viết nổi bật</h3>
                </div>
                <div className="space-y-3">
                    {isLoading ? (
                        // Loading skeleton
                        [1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-3 animate-pulse">
                                <div className="w-6 h-6 bg-muted rounded-full shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 w-full bg-muted rounded mb-2" />
                                    <div className="h-3 w-16 bg-muted rounded" />
                                </div>
                            </div>
                        ))
                    ) : topPosts && topPosts.length > 0 ? (
                        topPosts.map((post, index) => (
                            <div
                                key={post.id}
                                className="flex items-start gap-3 cursor-pointer hover:bg-muted p-2 rounded-xl transition-colors"
                            >
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm shrink-0 font-medium">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {post.likes_count} thích • {getTimeAgo(post.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Chưa có bài viết nổi bật</p>
                    )}
                </div>
            </Card>

            {/* Community Guidelines */}
            <Card className="p-5 rounded-2xl shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Nội quy cộng đồng</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Chia sẻ kinh nghiệm thực tế</p>
                    <p>• Không đăng tin quảng cáo</p>
                    <p>• Tôn trọng người khác</p>
                    <p>• Không vi phạm pháp luật</p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    Bài viết có từ 3 báo cáo sẽ bị ẩn tự động.
                </p>
            </Card>
        </div>
    );
}
