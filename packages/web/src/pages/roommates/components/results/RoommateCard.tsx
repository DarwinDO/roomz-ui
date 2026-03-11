import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Check,
  Eye,
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoommateMatch } from '@/services/roommates';
import {
  buildConcernSignals,
  buildMatchFactors,
  buildTopSignals,
  getConfidenceLabel,
  getConfidenceTone,
  getMatchScopeLabel,
  getMissingDataLabels,
} from '@/components/modals/roommateProfileModal.utils';

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
  if (score >= 65) return 'text-sky-700 bg-sky-50';
  if (score >= 50) return 'text-amber-700 bg-amber-50';
  return 'text-rose-700 bg-rose-50';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Rất phù hợp';
  if (score >= 75) return 'Phù hợp cao';
  if (score >= 60) return 'Khá hợp';
  return 'Cần hỏi kỹ';
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

  const factors = buildMatchFactors(match);
  const topSignals = buildTopSignals(factors).slice(0, 2);
  const concernSignals = buildConcernSignals(factors).slice(0, 2);
  const missingDataLabels = getMissingDataLabels(factors, 2);

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
            <div className="min-w-0">
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
            <div className="mb-2 flex flex-wrap gap-1">
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
            {topSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topSignals.map((signal) => (
                  <Badge key={signal.label} variant="outline" className="border-slate-200 bg-slate-50 text-[11px] text-slate-700">
                    {signal.label} {signal.score}%
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-2 text-[11px] text-muted-foreground">
              {missingDataLabels.length > 0 ? (
                <p>Thiếu dữ liệu: {missingDataLabels.join(', ')}.</p>
              ) : concernSignals.length > 0 ? (
                <p>Cần hỏi kỹ: {concernSignals.map((signal) => signal.label.toLowerCase()).join(', ')}.</p>
              ) : (
                <p>Điểm mạnh nhất hiện tại là {topSignals.map((signal) => signal.label.toLowerCase()).join(', ')}.</p>
              )}
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
            title="Gửi lời chào và yêu cầu kết nối"
          >
            <Send className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Gửi lời chào</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
