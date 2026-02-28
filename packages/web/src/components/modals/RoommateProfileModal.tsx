import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, GraduationCap, MapPin, Briefcase, Heart, Moon, Sparkles, Volume2, Users, Calendar, Wallet, Gamepad2, Cake, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";
import type { RoommateMatch } from "@/services/roommates";
import { cn } from "@/lib/utils";

// Connection status types for dual-action footer
export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

interface RoommateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageClick: () => void;
  onSendRequest?: () => void;
  roommate: RoommateMatch | null;
  connectionStatus?: ConnectionStatus;
  isRequestLoading?: boolean;
}

// Helper to format last_seen time
function formatLastSeen(lastSeen: string | null | undefined): string {
  if (!lastSeen) return '';

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return 'Online';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return 'Lâu rồi';
}

export function RoommateProfileModal({
  isOpen,
  onClose,
  onMessageClick,
  onSendRequest,
  roommate,
  connectionStatus = 'none',
  isRequestLoading = false
}: RoommateProfileModalProps) {
  if (!roommate) return null;

  const interests = roommate.hobbies || [];
  const lastSeenText = formatLastSeen(roommate.last_seen);

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Xuất sắc";
    if (score >= 70) return "Tốt";
    if (score >= 50) return "Trung bình";
    return "Thấp";
  };

  const getScoreStyles = (score: number): { bg: string; bar: string; text: string } => {
    if (score >= 85) return { bg: "bg-emerald-50", bar: "bg-emerald-500", text: "text-emerald-700" };
    if (score >= 70) return { bg: "bg-sky-50", bar: "bg-sky-500", text: "text-sky-700" };
    if (score >= 50) return { bg: "bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" };
    return { bg: "bg-rose-50", bar: "bg-rose-500", text: "text-rose-700" };
  };

  const compatibilityFactors = [
    { id: "sleep", label: "Lịch ngủ", score: roommate.sleep_score, icon: Moon },
    { id: "clean", label: "Sạch sẽ", score: roommate.cleanliness_score, icon: Sparkles },
    { id: "noise", label: "Tiếng ồn", score: roommate.noise_score, icon: Volume2 },
    { id: "guest", label: "Khách", score: roommate.guest_score, icon: Users },
    { id: "weekend", label: "Cuối tuần", score: roommate.weekend_score, icon: Calendar },
    { id: "budget", label: "Ngân sách", score: roommate.budget_score, icon: Wallet },
    { id: "hobby", label: "Sở thích", score: roommate.hobby_score ?? 0, icon: Gamepad2 },
    { id: "age", label: "Độ tuổi", score: roommate.age_score ?? 50, icon: Cake },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg md:max-w-xl max-h-[92vh] overflow-hidden p-0 bg-white border-gray-200/80 shadow-2xl rounded-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Hồ sơ {roommate.full_name}</DialogTitle>
          <DialogDescription>Xem chi tiết sự tương thích</DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto max-h-[calc(92vh-80px)] overscroll-contain scrollbar-hide">
          {/* Hero Header */}
          <div className="relative bg-gradient-to-br from-slate-50 via-sky-50 to-teal-50 pt-10 pb-8 px-6 overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-teal-300/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="w-28 h-28 ring-4 ring-white shadow-xl transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={roommate.avatar_url || ''} alt={roommate.full_name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-sky-400 to-teal-400 text-2xl font-bold text-white uppercase">
                    {roommate.full_name?.split(" ").filter(Boolean).slice(-1).map((n) => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                {lastSeenText === 'Online' && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm animate-pulse" />
                )}
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-800 tracking-tight">
                {roommate.full_name}
              </h1>

              {/* Last Seen Status */}
              {lastSeenText && (
                <div className={cn(
                  "mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider",
                  lastSeenText === 'Online'
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100/80 text-slate-600 border border-slate-200/50"
                )}>
                  <Clock className="w-3 h-3" />
                  {lastSeenText === 'Online' ? 'Đang hoạt động' : lastSeenText}
                </div>
              )}

              {/* Info Chips */}
              <div className="mt-4 flex flex-wrap justify-center items-center gap-3 text-sm font-medium text-slate-600">
                {roommate.age && (
                  <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {roommate.age} tuổi
                  </div>
                )}
                {roommate.city && (
                  <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-rose-500/80" />
                    {roommate.city}
                  </div>
                )}
                {roommate.occupation && (
                  <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                    <Briefcase className="w-4 h-4 text-amber-500/80" />
                    {roommate.occupation === 'student' ? 'Sinh viên' : roommate.occupation === 'worker' ? 'Đi làm' : 'Freelancer'}
                  </div>
                )}
              </div>

              {/* Compatibility Score Badge - Floating Design */}
              <div className="mt-6 inline-flex items-center gap-2.5 px-6 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="p-1.5 bg-rose-50 rounded-lg">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-800 leading-none">
                      {roommate.compatibility_score}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">phù hợp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="px-6 py-6 space-y-8">
            {/* About Section */}
            <section className="relative">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-sky-400 rounded-full" />
                Giới thiệu
              </h3>
              <p className="text-slate-600 leading-relaxed text-base italic">
                "{roommate.bio || `Xin chào! Mình là ${roommate.full_name}. Mình đang tìm một bạn cùng phòng có lối sống tương đồng và không gian sống thoải mái.`}"
              </p>
            </section>

            {/* Compatibility Breakdown - Refactored Grid */}
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-teal-400 rounded-full" />
                Chi tiết tương thích
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {compatibilityFactors.map((factor) => {
                  const Icon = factor.icon;
                  const styles = getScoreStyles(factor.score);
                  return (
                    <div
                      key={factor.id}
                      className="group cursor-default"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg transition-colors", styles.bg)}>
                            <Icon className={cn("w-3.5 h-3.5", styles.text)} />
                          </div>
                          <span className="text-[13px] font-bold text-slate-700">{factor.label}</span>
                        </div>
                        <span className={cn("text-[13px] font-black tabular-nums", styles.text)}>
                          {factor.score}%
                        </span>
                      </div>

                      {/* Progress Bar - Improved Style */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                            styles.bar
                          )}
                          style={{ width: `${factor.score}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-wider", styles.text)}>
                          {getScoreLabel(factor.score)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Interests Tags */}
            {interests.length > 0 && (
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-amber-400 rounded-full" />
                  Sở thích
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-white border border-slate-100 hover:border-sky-200 hover:bg-sky-50 text-slate-600 font-semibold px-4 py-1.5 rounded-xl transition-all shadow-sm"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Sticky Footer CTA - Dual Action based on connection status */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-white">
          {connectionStatus === 'connected' ? (
            <Button
              onClick={() => {
                onClose();
                onMessageClick();
              }}
              className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white rounded-xl h-12 font-bold text-base shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Nhắn tin ngay
            </Button>
          ) : connectionStatus === 'pending_sent' ? (
            <Button
              disabled
              className="flex-1 bg-gray-100 text-gray-500 rounded-xl h-12 font-bold text-base cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Đã gửi yêu cầu
            </Button>
          ) : connectionStatus === 'pending_received' ? (
            <Button
              onClick={() => {
                onClose();
                onMessageClick();
              }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 font-bold text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chấp nhận & Nhắn tin
            </Button>
          ) : (
            <Button
              onClick={() => {
                onSendRequest?.();
              }}
              disabled={isRequestLoading}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl h-12 font-bold text-base shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isRequestLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {isRequestLoading ? 'Đang gửi...' : 'Gửi lời chào'}
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-shrink-0 w-24 rounded-xl h-12 font-bold border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
