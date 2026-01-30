import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendingUp, Hash, UserCheck } from "lucide-react";

export function CommunitySidebar() {
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

    return (
        <div className="hidden lg:block space-y-6">
            {/* Top Posts */}
            <Card className="p-5 rounded-2xl shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Bài viết nổi bật trong tuần</h3>
                </div>
                <div className="space-y-3">
                    {topPosts.map((post, index) => (
                        <div key={index} className="flex items-start gap-3 cursor-pointer hover:bg-muted p-2 rounded-xl transition-colors">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm shrink-0 font-medium">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{post.likes} lượt thích</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Suggested Topics */}
            <Card className="p-5 rounded-2xl shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Chủ đề gợi ý</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {suggestedTopics.map((topic, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1 px-3 rounded-lg border-primary/20 text-primary-foreground/80 bg-primary/5"
                        >
                            {topic}
                        </Badge>
                    ))}
                </div>
            </Card>

            {/* Followed Hosts */}
            <Card className="p-5 rounded-2xl shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Chủ nhà đang theo dõi</h3>
                </div>
                <div className="space-y-3">
                    {followedHosts.map((host, index) => (
                        <div key={index} className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-xl transition-colors">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs">
                                    {host.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{host.name}</p>
                                <p className="text-xs text-muted-foreground">{host.properties} tin đang mở</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
