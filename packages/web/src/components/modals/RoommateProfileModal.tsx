import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Cake, CheckCircle2, Clock, GraduationCap, MapPin, MessageCircle, Send, Sparkles } from 'lucide-react';
import type { RoommateMatch } from '@/services/roommates';
import { cn } from '@/lib/utils';
import {
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
  const interests = roommate.hobbies || [];
  const overviewRows = [
    {
      label: 'Công việc',
      value: formatOccupation(roommate.occupation),
      icon: Briefcase,
    },
    {
      label: 'Khu vực',
      value: [roommate.district, roommate.city].filter(Boolean).join(', ') || 'Chưa cập nhật',
      icon: MapPin,
    },
    {
      label: 'Trường / ngành',
      value: roommate.university || roommate.major || 'Chưa cập nhật',
      icon: GraduationCap,
    },
    {
      label: 'Độ tuổi',
      value: roommate.age ? `${roommate.age} tuổi` : 'Chưa cập nhật',
      icon: Cake,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[94vh] w-[min(96vw,1120px)] overflow-hidden rounded-[32px] border border-slate-200 bg-[#fcfcfb] p-0 shadow-2xl sm:max-w-[1120px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Hồ sơ {roommate.full_name}</DialogTitle>
          <DialogDescription>Xem hồ sơ và mức độ tương thích của người này</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(94vh-92px)] overflow-y-auto">
          <div className="grid gap-6 border-b border-slate-200 px-6 py-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_50%,#fff8ef_100%)] p-6 shadow-sm">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Avatar className="h-24 w-24 rounded-[28px] border-4 border-white shadow-lg">
                    <AvatarImage src={roommate.avatar_url || ''} alt={roommate.full_name} className="object-cover" />
                    <AvatarFallback className="rounded-[24px] bg-primary/10 text-2xl font-bold uppercase text-primary">
                      {roommate.full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('') || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
                        {getMatchScopeLabel(roommate.match_scope)}
                      </Badge>
                      <Badge className={cn('rounded-full border', getConfidenceTone(roommate.confidence_score))}>
                        {getConfidenceLabel(roommate.confidence_score)}
                      </Badge>
                    </div>
                    <h2 className="break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.6rem]">
                      {roommate.full_name}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      {roommate.bio ||
                        'Người dùng này đang tìm một người ở chung có nhịp sống tương thích và kỳ vọng rõ ràng về chi phí, vị trí và cách sống chung.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {lastSeenText}
                  </div>
                  {roommate.city && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {roommate.city}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Hồ sơ nổi bật
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {overviewRows.map((row) => {
                        const Icon = row.icon;

                        return (
                          <div key={row.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  {row.label}
                                </p>
                                <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-900">
                                  {row.value}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-950/[0.03] p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Lưu ý trước khi bắt chuyện
                    </p>
                    <p className={cn('mt-3 text-2xl font-semibold leading-tight', headlineTone)}>
                      {getMatchSummary(roommate.compatibility_score)}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {getOverallGuidance(roommate.compatibility_score, roommate.confidence_score)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
                        Độ phù hợp {roommate.compatibility_score}%
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
                        Độ tin cậy {roommate.confidence_score}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-[#f8f4ec] p-5 shadow-sm">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Compatibility
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className={cn('text-6xl font-black leading-none', headlineTone)}>
                      {roommate.compatibility_score}
                      <span className="text-2xl align-top">%</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Độ phù hợp tổng thể</p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Confidence</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{roommate.confidence_score}%</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {topSignals.map((signal) => {
                    const tone = getScoreTone(signal.score);

                    return (
                      <div key={signal.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">{signal.label}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{signal.description}</p>
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
              </div>
            </section>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">Nếp sống hằng ngày</h3>
                </div>

                <div className="space-y-4">
                  {lifestyleFactors.map((factor) => {
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

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">Yếu tố thực tế khi ở chung</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {practicalFactors.map((factor) => {
                    const Icon = factor.icon;
                    const tone = getScoreTone(factor.score);

                    return (
                      <div key={factor.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">{factor.label}</p>
                              <span className={cn('text-sm font-bold', tone.label)}>{factor.score}%</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className={cn('rounded-full border text-[11px]', getFactorSignalTone(factor.score))}
                              >
                                {getFactorSignalLabel(factor.score)}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{factor.description}</p>
                          </div>
                        </div>
                        <div className={cn('mt-3 h-2 rounded-full', tone.track)}>
                          <div className={cn('h-2 rounded-full', tone.fill)} style={{ width: `${factor.score}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Thông tin nhanh</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {overviewRows.map((row) => {
                    const Icon = row.icon;

                    return (
                      <div key={row.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-start sm:gap-4">
                          <span className="inline-flex items-start gap-2 text-slate-500">
                            <Icon className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="leading-6">{row.label}</span>
                          </span>
                          <span className="min-w-0 break-words text-left font-medium leading-6 text-slate-900 sm:text-right">
                            {row.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Sở thích</h3>
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
                    Người dùng này chưa chia sẻ thêm sở thích cá nhân. Bạn nên hỏi kỹ hơn sau khi bắt đầu trò chuyện.
                  </p>
                )}
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