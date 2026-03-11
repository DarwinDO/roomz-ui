import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Check,
  Coffee,
  Eye,
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Moon,
  Send,
  Sparkles,
  Users,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoommateMatch } from '@/services/roommates';

interface RoommateCardProps {
  match: RoommateMatch;
  onViewProfile: () => void;
  onSendRequest: () => void;
  onMessage: () => void;
  hasPendingRequest: boolean;
  canSendRequest: boolean;
  isConnected?: boolean;
  hasIntroMessage?: boolean;
  isIncomingPending?: boolean;
  onAccept?: () => void;
  isAccepting?: boolean;
}

function getScoreTone(score: number): string {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50';
  if (score >= 60) return 'text-amber-700 bg-amber-50';
  return 'text-orange-700 bg-orange-50';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Rất phù hợp';
  if (score >= 75) return 'Phù hợp cao';
  if (score >= 60) return 'Phù hợp';
  return 'Cân nhắc';
}

function getMatchScopeLabel(scope: RoommateMatch['match_scope']): string {
  if (scope === 'same_district') return 'Cùng khu vực';
  if (scope === 'same_city') return 'Cùng thành phố';
  return 'Ngoài khu vực ưu tiên';
}

function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'Dữ liệu đầy đủ';
  if (score >= 60) return 'Dữ liệu khá đầy đủ';
  return 'Cần bổ sung dữ liệu';
}

function getConfidenceTone(score: number): string {
  if (score >= 80) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 60) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function ScoreBreakdown({
  sleepScore,
  cleanlinessScore,
  noiseScore,
  guestScore,
  weekendScore,
}: {
  sleepScore: number;
  cleanlinessScore: number;
  noiseScore: number;
  guestScore: number;
  weekendScore: number;
}) {
  const scores = [
    { label: 'Ngủ', value: sleepScore, icon: Moon },
    { label: 'Gọn gàng', value: cleanlinessScore, icon: Sparkles },
    { label: 'Tiếng ồn', value: noiseScore, icon: Volume2 },
    { label: 'Khách', value: guestScore, icon: Users },
    { label: 'Cuối tuần', value: weekendScore, icon: Coffee },
  ];

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {scores.map((score) => {
        const Icon = score.icon;
        const colorClass = score.value >= 80 ? 'text-emerald-600' : score.value >= 50 ? 'text-amber-600' : 'text-rose-500';

        return (
          <div key={score.label} className="flex items-center gap-1 text-xs" title={`${score.label}: ${score.value}%`}>
            <Icon className={cn('h-3 w-3', colorClass)} />
            <span className={colorClass}>{score.value}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function RoommateCard({
  match,
  onViewProfile,
  onSendRequest,
  onMessage,
  hasPendingRequest,
  canSendRequest,
  isConnected = false,
  hasIntroMessage = false,
  isIncomingPending = false,
  onAccept,
  isAccepting = false,
}: RoommateCardProps) {
  const initials = match.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={match.avatar_url || undefined} alt={match.full_name} />
            <AvatarFallback className="bg-primary/10 text-lg text-primary">{initials}</AvatarFallback>
          </Avatar>

          <div
            className={cn(
              'absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold sm:h-10 sm:w-10 sm:text-sm',
              getScoreTone(match.compatibility_score),
            )}
          >
            {match.compatibility_score}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-base font-semibold sm:text-lg">{match.full_name}</h3>
              {match.age && <p className="text-xs text-muted-foreground sm:text-sm">{match.age} tuổi</p>}
            </div>

            <Badge variant="outline" className={cn('hidden sm:flex', getScoreTone(match.compatibility_score))}>
              <Heart className="mr-1 h-3 w-3" />
              {getScoreLabel(match.compatibility_score)}
            </Badge>
          </div>

          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {match.district ? `${match.district}, ` : ''}
              {match.city}
            </span>
          </div>

          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[11px]">
              {getMatchScopeLabel(match.match_scope)}
            </Badge>
            <Badge variant="outline" className={cn('text-[11px]', getConfidenceTone(match.confidence_score))}>
              {getConfidenceLabel(match.confidence_score)}
            </Badge>
          </div>

          {match.university && (
            <div className="mb-1 hidden items-center gap-1 text-xs text-muted-foreground sm:flex sm:text-sm">
              <GraduationCap className="h-3 w-3 shrink-0" />
              <span className="truncate">{match.university}</span>
            </div>
          )}

          {match.bio && <p className="mb-1 hidden line-clamp-2 text-sm text-muted-foreground md:block">{match.bio}</p>}

          {match.hobbies.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1">
              {match.hobbies.slice(0, 3).map((hobby) => (
                <Badge key={hobby} variant="secondary" className="py-0 text-xs">
                  {hobby}
                </Badge>
              ))}
              {match.hobbies.length > 3 && (
                <Badge variant="secondary" className="py-0 text-xs">
                  +{match.hobbies.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="hidden sm:block">
            <ScoreBreakdown
              sleepScore={match.sleep_score}
              cleanlinessScore={match.cleanliness_score}
              noiseScore={match.noise_score}
              guestScore={match.guest_score}
              weekendScore={match.weekend_score}
            />
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span>Vị trí {match.location_score}%</span>
              <span>Chuyển vào {match.move_in_score}%</span>
              <span>Độ tin cậy {match.confidence_score}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t pt-3 sm:mt-4">
        <Button variant="outline" size="sm" onClick={onViewProfile} className="h-9 gap-1 sm:h-8 sm:gap-2" title="Xem hồ sơ chi tiết">
          <Eye className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Xem</span>
        </Button>

        {isConnected ? (
          <Button size="sm" onClick={onMessage} className="h-9 flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 sm:h-8 sm:gap-2" title="Mở cuộc trò chuyện">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Nhắn tin</span>
          </Button>
        ) : isIncomingPending ? (
          <Button
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onAccept?.();
            }}
            disabled={isAccepting}
            className="h-9 flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 sm:h-8 sm:gap-2"
            title="Chấp nhận yêu cầu kết nối"
          >
            {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span className="text-xs sm:text-sm">Chấp nhận</span>
          </Button>
        ) : hasPendingRequest || hasIntroMessage ? (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="h-9 flex-1 gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 sm:h-8 sm:gap-2"
            title="Yêu cầu kết nối đang chờ phản hồi"
          >
            <Check className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Đã gửi</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onSendRequest}
            disabled={!canSendRequest}
            className="h-9 flex-1 gap-1 sm:h-8 sm:gap-2"
            title="Gửi lời chào va yeu cau ket noi"
          >
            <Send className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Gửi lời chào</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
