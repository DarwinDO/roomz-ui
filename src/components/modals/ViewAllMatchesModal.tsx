import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowUpDown, Heart, MessageCircle, Eye } from "lucide-react";

interface ViewAllMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (roommate: { name: string; role: string; match: number }) => void;
  onMessage?: (roommate: { name: string; role: string; match: number }) => void;
}

interface Roommate {
  id: number;
  name: string;
  match: number;
  avatar: string;
  role: string;
  major: string;
  year: string;
  bio: string;
  interests: string[];
  distance: string;
}

export function ViewAllMatchesModal({ isOpen, onClose, onViewProfile, onMessage }: ViewAllMatchesModalProps) {
  const [sortBy, setSortBy] = useState("compatibility");

  const roommates: Roommate[] = [
    {
      id: 1,
      name: "Nguyễn Minh Tuấn",
      match: 92,
      avatar: "",
      role: "Công nghệ thông tin",
      major: "Công nghệ thông tin",
      year: "Năm 3",
      bio: "Yêu công nghệ, sống ngăn nắp và thích nấu ăn cuối tuần.",
      interests: ["Game", "Lập trình", "Nấu ăn"],
      distance: "0.5 km",
    },
    {
      id: 2,
      name: "Phạm Gia Hân",
      match: 88,
      avatar: "",
      role: "Kinh doanh",
      major: "Quản trị kinh doanh",
      year: "Năm 2",
      bio: "Thức dậy sớm, không hút thuốc, thích không gian yên tĩnh.",
      interests: ["Đọc sách", "Gym", "Cà phê"],
      distance: "0.3 km",
    },
    {
      id: 3,
      name: "Trần Khánh Ly",
      match: 85,
      avatar: "",
      role: "Kỹ thuật",
      major: "Kỹ thuật cơ khí",
      year: "Cao học",
      bio: "Đam mê âm nhạc, tôn trọng không gian chung, thích leo núi cuối tuần.",
      interests: ["Âm nhạc", "Leo núi", "Chụp ảnh"],
      distance: "0.8 km",
    },
    {
      id: 4,
      name: "Võ Bảo Nam",
      match: 82,
      avatar: "",
      role: "Tâm lý",
      major: "Tâm lý học",
      year: "Năm 4",
      bio: "Thân thiện, cởi mở, thích tổ chức xem phim cùng bạn bè.",
      interests: ["Phim ảnh", "Tâm lý", "Yoga"],
      distance: "1.2 km",
    },
    {
      id: 5,
      name: "Lê Hồng Phúc",
      match: 79,
      avatar: "",
      role: "Thiết kế",
      major: "Thiết kế đồ họa",
      year: "Năm 3",
      bio: "Sáng tạo, hay thức khuya và rất mê chăm cây 🌱",
      interests: ["Art", "Thiết kế", "Cây cảnh"],
      distance: "0.6 km",
    },
    {
      id: 6,
      name: "Đặng Thu Uyên",
      match: 76,
      avatar: "",
      role: "Sinh học",
      major: "Công nghệ sinh học",
      year: "Năm 2",
      bio: "Đam mê khoa học, giữ phòng sạch sẽ, ngủ sớm mỗi ngày.",
      interests: ["Khoa học", "Chạy bộ", "Podcast"],
      distance: "1.0 km",
    },
  ];

  const sortedRoommates = [...roommates].sort((a, b) => {
    if (sortBy === "compatibility") {
      return b.match - a.match;
    }
    const distA = parseFloat(a.distance);
    const distB = parseFloat(b.distance);
    return distA - distB;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Danh sách bạn cùng phòng phù hợp
            </DialogTitle>
            <Badge className="bg-secondary text-white">
              {roommates.length} đề xuất
            </Badge>
          </div>
          <DialogDescription>
            Những người có lối sống tương đồng và sẵn sàng ghép phòng với bạn
          </DialogDescription>

          <div className="flex items-center gap-2 mt-4">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 rounded-full">
                <SelectValue placeholder="Mức độ tương hợp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compatibility">Mức độ tương hợp</SelectItem>
                <SelectItem value="proximity">Khoảng cách</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-6 space-y-4">
          {sortedRoommates.map((roommate) => (
            <div
              key={roommate.id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-border hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20">
                  <AvatarFallback className="bg-transparent text-lg">
                    {roommate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base mb-0.5">{roommate.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {roommate.major} • {roommate.year}
                      </p>
                    </div>
                    <Badge className="bg-secondary text-white ml-2 shrink-0">
                      {roommate.match}% phù hợp
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{roommate.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {roommate.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs rounded-full">
                        {interest}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs rounded-full text-primary border-primary">
                      📍 {roommate.distance}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Điểm tương hợp</span>
                      <span className="text-xs text-primary">{roommate.match}%</span>
                    </div>
                    <Progress value={roommate.match} className="h-1.5" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full bg-primary hover:bg-primary/90 h-9"
                      onClick={() => {
                        onClose();
                        onViewProfile?.({ name: roommate.name, role: roommate.role, match: roommate.match });
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Xem hồ sơ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-full h-9"
                      onClick={() => {
                        onClose();
                        onMessage?.({ name: roommate.name, role: roommate.role, match: roommate.match });
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      Nhắn tin
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full h-9 px-3">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 bg-muted/30 shrink-0">
          <p className="text-xs text-center text-muted-foreground">
            💡 Mẹo: Điểm tương hợp cao đồng nghĩa với lối sống và thói quen sinh hoạt gần nhau
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
