import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumAvatar } from '@/components/ui/PremiumAvatar';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Cake,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import type { RoommateMatch } from '@/services/roommates';
import { cn } from '@/lib/utils';
import {
  buildConcernSignals,
  buildMatchFactors,
  buildTopSignals,
  formatLastSeen,
  formatOccupation,
  getConfidenceLabel,
  getConfidenceTone,
  getFactorSignalLabel,
  getFactorSignalTone,
  getMatchScopeLabel,
  getMatchSummary,
  getMatchTone,
  getMissingDataLabels,
  getOverallGuidance,
  getScoreTone,
} from './roommateProfileModal.utils';

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

function renderActionButton(
  connectionStatus: ConnectionStatus,
  onClose: () => void,
  onMessageClick: () => void,
  onSendRequest: (() => void) | undefined,
  isRequestLoading: boolean,
) {
  if (connectionStatus === 'connected') {
    return (
      <Button
        onClick={() => {
          onClose();
          onMessageClick();
        }}
        className="h-12 flex-1 rounded-2xl bg-[#0f172a] text-base font-semibold text-white hover:bg-[#111c35]"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        Nhắn tin ngay
      </Button>
    );
  }

  if (connectionStatus === 'pending_sent') {
    return (
      <Button disabled className="h-12 flex-1 rounded-2xl bg-slate-100 text-base font-semibold text-slate-500">
        <CheckCircle2 className="mr-2 h-5 w-5" />
        Đã gửi lời chào
      </Button>
    );
  }

  if (connectionStatus === 'pending_received') {
    return (
      <Button
        onClick={() => {
          onClose();
          onMessageClick();
        }}
        className="h-12 flex-1 rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        Chấp nhận và nhắn tin
      </Button>
    );
  }

  return (
    <Button
      onClick={() => onSendRequest?.()}
      disabled={isRequestLoading}
      className="h-12 flex-1 rounded-2xl bg-primary text-base font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
    >
      {isRequestLoading ? <Clock className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
      {isRequestLoading ? 'Đang gửi...' : 'Gửi lời chào'}
    </Button>
  );
}

export function RoommateProfileModal({
  isOpen,
  onClose,
  onMessageClick,
  onSendRequest,
  roommate,
  connectionStatus = 'none',
  isRequestLoading = false,
}: RoommateProfileModalProps) {
  if (!roommate) {
    return null;
  }

  const headlineTone = getMatchTone(roommate.compatibility_score);
  const lastSeenText = formatLastSeen(roommate.last_seen);
  const matchFactors = buildMatchFactors(roommate);
  const lifestyleFactors = matchFactors.slice(0, 5);
  const practicalFactors = matchFactors.slice(5);
  const topSignals = buildTopSignals(matchFactors);
  const concernSignals = buildConcernSignals(matchFactors);
  const missingDataLabels = getMissingDataLabels(matchFactors);
  const interests = roommate.hobbies || [];
  const profileRows = [
    {
      label: 'Công việc',
      value: formatOccupation(roommate.occupation),
      icon: Briefcase,
      isMissing: roommate.occupation == null,
    },
    {
      label: 'Khu vực',
      value: [roommate.district, roommate.city].filter(Boolean).join(', ') || 'Chưa cập nhật',
      icon: MapPin,
      isMissing: !roommate.district && !roommate.city,
    },
    {
      label: 'Trường / ngành',
      value: roommate.university || roommate.major || 'Chưa cập nhật',
      icon: GraduationCap,
      isMissing: !roommate.university && !roommate.major,
    },
    {
      label: 'Độ tuổi',
      value: roommate.age ? `${roommate.age} tuổi` : 'Chưa cập nhật',
      icon: Cake,
      isMissing: !roommate.age,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[94vh] w-[min(96vw,1140px)] overflow-hidden rounded-[32px] border border-slate-200 bg-[#fcfbf8] p-0 shadow-2xl sm:max-w-[1140px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Hồ sơ {roommate.full_name}</DialogTitle>
          <DialogDescription>Xem hồ sơ và mức độ tương thích của người này.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(94vh-92px)] overflow-y-auto">
          <div className="grid gap-6 border-b border-slate-200 px-6 py-6 lg:grid-cols-[minmax(0,1.16fr)_360px]">
            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#f7f4ed_0%,#ffffff_44%,#f3f8ff_100%)] p-6 shadow-sm">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <PremiumAvatar
                    isPremium={roommate.is_premium ?? false}
                    className="h-24 w-24 rounded-[28px] border-4 border-white shadow-lg"
                  >
                    <AvatarImage src={roommate.avatar_url || ''} alt={roommate.full_name} className="object-cover" />
                    <AvatarFallback className="rounded-[24px] bg-primary/10 text-2xl font-bold uppercase text-primary">
                      {roommate.full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('') || '?'}
                    </AvatarFallback>
                  </PremiumAvatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
                        {getMatchScopeLabel(roommate.match_scope)}
                      </Badge>
                      <Badge className={cn('rounded-full border', getConfidenceTone(roommate.confidence_score))}>
                        {getConfidenceLabel(roommate.confidence_score)}
                      </Badge>
                    </div>

                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-[3.15rem]">
                      {roommate.full_name}
                    </h2>

                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                      {roommate.bio ||
                        'Người này đang tìm một bạn ở cùng có kỳ vọng rõ ràng về chi phí, khu vực và nhịp sống chung. Điểm hiện tại nên được xem như gợi ý để mở lời, không phải kết luận cuối cùng.'}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {lastSeenText}
                      </div>
                      {roommate.city && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {roommate.city}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Chân dung nhanh
                    </p>
                    <div className="mt-4 space-y-3">
                      {profileRows.map((row) => {
                        const Icon = row.icon;

                        return (
                          <div
                            key={row.label}
                            className="grid gap-2 rounded-[22px] border border-white/90 bg-white/88 px-4 py-4 shadow-sm sm:grid-cols-[148px_minmax(0,1fr)] sm:gap-4"
                          >
                            <dt className="flex items-start gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              <span className="rounded-xl bg-slate-100 p-2 text-slate-500">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="pt-1">{row.label}</span>
                            </dt>
                            <dd
                              className={cn(
                                'min-w-0 break-words text-base leading-7 text-slate-900',
                                row.isMissing && 'text-slate-500',
                              )}
                            >
                              {row.value}
                            </dd>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Nhận định hiện tại
                    </p>
                    <p className={cn('mt-4 text-3xl font-semibold leading-tight', headlineTone)}>
                      {getMatchSummary(roommate.compatibility_score)}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {getOverallGuidance(roommate.compatibility_score, roommate.confidence_score)}
                    </p>

                    <div className="mt-5 space-y-4">
                      {topSignals.slice(0, 2).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Điểm đang sáng</p>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                            {topSignals.slice(0, 2).map((signal) => (
                              <li key={signal.label} className="rounded-2xl bg-slate-50 px-3 py-2">
                                <span className="font-semibold text-slate-900">{signal.label}:</span> {signal.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {concernSignals.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cần hỏi kỹ</p>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                            {concernSignals.slice(0, 2).map((signal) => (
                              <li key={signal.label} className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-900">
                                <span className="font-semibold">{signal.label}:</span> {signal.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {missingDataLabels.length > 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Thiếu dữ liệu cần xác nhận
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{missingDataLabels.join(', ')}.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-[#f4ede2] p-5 shadow-sm">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Đánh giá mức hợp
                    </p>
                    <p className={cn('mt-4 text-6xl font-black leading-none', headlineTone)}>
                      {roommate.compatibility_score}
                      <span className="text-2xl align-top">%</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Độ phù hợp tổng thể</p>
                  </div>

                  <div className="rounded-[22px] bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Độ tin cậy</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{roommate.confidence_score}%</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {topSignals.map((signal) => {
                    const tone = getScoreTone(signal.score);

                    return (
                      <div key={signal.label} className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">{signal.label}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">{signal.description}</p>
                          </div>
                          <span className={cn('shrink-0 text-sm font-bold', tone.label)}>{signal.score}%</span>
                        </div>
                        <div className={cn('h-2 rounded-full', tone.track)}>
                          <div className={cn('h-2 rounded-full', tone.fill)} style={{ width: `${signal.score}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {missingDataLabels.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Thiếu dữ liệu cần hỏi thêm
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {missingDataLabels.join(', ')}. Nên xác nhận trực tiếp các điểm này trước khi ghép phòng.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">Nếp sống và cách ở chung</h3>
              </div>

              <div className="space-y-4">
                {[...lifestyleFactors, ...practicalFactors].map((factor) => {
                  const Icon = factor.icon;
                  const tone = getScoreTone(factor.score);

                  return (
                    <div key={factor.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{factor.label}</p>
                                <Badge
                                  variant="outline"
                                  className={cn('rounded-full border text-[11px]', getFactorSignalTone(factor.score))}
                                >
                                  {getFactorSignalLabel(factor.score)}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{factor.description}</p>
                            </div>
                          </div>
                        </div>
                        <span className={cn('shrink-0 text-sm font-bold', tone.label)}>{factor.score}%</span>
                      </div>
                      <div className={cn('mt-3 h-2 rounded-full', tone.track)}>
                        <div className={cn('h-2 rounded-full', tone.fill)} style={{ width: `${factor.score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Sở thích và chất kết nối</h3>
                {interests.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className="max-w-full rounded-full border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        <span className="break-words">{interest}</span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Hồ sơ này chưa chia sẻ thêm sở thích cá nhân. Nếu bạn thấy hợp về khu vực và chi phí, đây là phần nên hỏi đầu tiên khi bắt chuyện.
                  </p>
                )}
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Tóm tắt để quyết định nhanh</h3>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Độ phù hợp</p>
                    <p className={cn('mt-2 text-2xl font-semibold', headlineTone)}>{roommate.compatibility_score}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Độ tin cậy</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{roommate.confidence_score}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Lời khuyên</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {getOverallGuidance(roommate.compatibility_score, roommate.confidence_score)}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
          {renderActionButton(connectionStatus, onClose, onMessageClick, onSendRequest, isRequestLoading)}
          <Button onClick={onClose} variant="outline" className="h-12 rounded-2xl border-slate-200 px-5 font-semibold">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
