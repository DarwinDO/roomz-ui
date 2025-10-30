import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, X, GraduationCap, MapPin, Calendar, Moon, Sparkles, Book, Volume2 } from "lucide-react";

interface RoommateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageClick: () => void;
  roommate: {
    name: string;
    role: string;
    match: number;
    age?: number;
    university?: string;
    major?: string;
    bio?: string;
  };
}

export function RoommateProfileModal({ isOpen, onClose, onMessageClick, roommate }: RoommateProfileModalProps) {
  const interests = ["Âm nhạc", "Nấu ăn", "Leo núi", "Chơi game", "Đọc sách", "Yoga"];
  const lifestylePrefs = [
    { icon: Moon, label: "Lịch ngủ", value: "Ngủ sớm (10 giờ tối - 6 giờ sáng)" },
    { icon: Sparkles, label: "Mức độ sạch sẽ", value: "Rất ngăn nắp" },
    { icon: Book, label: "Thói quen học tập", value: "Học yên tĩnh, thích thư viện" },
    { icon: Volume2, label: "Độ chịu đựng tiếng ồn", value: "Thích môi trường yên tĩnh" },
  ];

  const compatibilityBreakdown = [
    { category: "Giao tiếp", score: 95 },
    { category: "Sạch sẽ", score: 92 },
    { category: "Học tập", score: 88 },
    { category: "Đời sống xã hội", score: 85 },
    { category: "Lịch ngủ", score: 90 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Hồ sơ bạn cùng phòng</DialogTitle>
          <DialogDescription>
            Xem thông tin phù hợp chi tiết và sở thích lối sống
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header with Avatar */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl">
                {roommate.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <h2 className="mb-1">
              {roommate.name}
              {roommate.age && `, ${roommate.age}`}
            </h2>
            <p className="text-gray-600 mb-1">
              {roommate.university || roommate.role}
            </p>
            {roommate.major && (
              <p className="text-sm text-gray-500 mb-2">{roommate.major}</p>
            )}
            <Badge className="bg-gradient-to-r from-secondary to-primary text-white px-4 py-1 shadow-md">
              {roommate.match}% phù hợp
            </Badge>
          </div>

          {/* About Section */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Giới thiệu
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {roommate.bio || `Xin chào! Mình là ${roommate.role.toLowerCase()} đang tìm bạn cùng phòng sạch sẽ, tôn trọng,
              coi trọng giao tiếp và không gian chung. Mình thích sự ngăn nắp và tin vào việc tạo ra
              môi trường sống thoải mái để cả hai có thể phát triển cả về học tập và đời sống xã hội.`}
            </p>
          </div>

          {/* Interests */}
          <div>
            <h3 className="mb-3">Sở thích</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-white border-primary/20 text-primary px-3 py-1"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Lifestyle Preferences */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="mb-4">Sở thích lối sống</h3>
            <div className="space-y-4">
              {lifestylePrefs.map((pref, index) => {
                const Icon = pref.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1">{pref.label}</p>
                      <p className="text-xs text-gray-600">{pref.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compatibility Breakdown */}
          <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-4">Chi tiết độ phù hợp</h3>
            <div className="space-y-4">
              {compatibilityBreakdown.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm">{item.category}</p>
                    <p className="text-sm text-primary">{item.score}%</p>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                onClose();
                onMessageClick();
              }}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Nhắn tin
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
            >
              <X className="w-4 h-4 mr-2" />
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
