import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Heart, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  useRoommateMatchesQuery,
  useRoommateProfileQuery,
  useRoommateRequestsQuery,
} from '@/hooks/useRoommatesQuery';
import { usePremiumLimits } from '@/hooks/usePremiumLimits';
import { sendIntroMessage, type RoommateMatch } from '@/services/roommates';
import { trackFeatureEvent } from '@/services/analyticsTracking';
import { RoommateProfileModal } from '@/components/modals/RoommateProfileModal';
import { IntroMessageModal } from './IntroMessageModal';
import { LimitHitModal } from './LimitHitModal';
import { LimitsBar } from './LimitsBar';
import { RoommateCard } from './RoommateCard';
import { RoommateFilters, type FilterOptions } from './RoommateFilters';
import { RoommateResultsSkeleton } from './RoommateCardSkeleton';

type SortOption = 'compatibility' | 'age';

export function RoommateResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, setStatus } = useRoommateProfileQuery();
  const { matches, loading: matchesLoading, error, limits, canViewMore, recordView, refetch } = useRoommateMatchesQuery();
  const {
    sentRequests,
    receivedRequests,
    loading: requestsLoading,
    refetch: refetchRequests,
    checkConnection,
    checkOutgoingPending,
    checkIncomingPending,
    acceptRequest,
    isAccepting,
  } = useRoommateRequestsQuery();
  const { isPremium } = usePremiumLimits();

  const [sortBy, setSortBy] = useState<SortOption>('compatibility');
  const [selectedMatch, setSelectedMatch] = useState<RoommateMatch | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitType, setLimitType] = useState<'views' | 'requests'>('views');
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [introModalTarget, setIntroModalTarget] = useState<RoommateMatch | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    gender: 'any',
    ageMin: 18,
    ageMax: 40,
    budgetMin: 0,
    budgetMax: 10,
    occupation: 'any',
  });

  const isLoading = matchesLoading || (requestsLoading && matches.length === 0);

  const sentIntroMessages = useMemo(
    () =>
      new Set(
        sentRequests
          .filter((request) => request.message && request.status === 'pending')
          .map((request) => request.receiver_id),
      ),
    [sentRequests],
  );

  const filteredMatches = useMemo(
    () =>
      matches.filter((match) => {
        if (filters.gender !== 'any' && match.gender !== filters.gender) return false;
        if (match.age && (match.age < filters.ageMin || match.age > filters.ageMax)) return false;
        if (filters.occupation !== 'any' && match.occupation !== filters.occupation) return false;
        return true;
      }),
    [filters, matches],
  );

  const sortedMatches = useMemo(() => {
    const nextMatches = [...filteredMatches];

    if (sortBy === 'age') {
      return nextMatches.sort((left, right) => (left.age || 99) - (right.age || 99));
    }

    return nextMatches.sort((left, right) => {
      if (right.compatibility_score !== left.compatibility_score) {
        return right.compatibility_score - left.compatibility_score;
      }
      return right.confidence_score - left.confidence_score;
    });
  }, [filteredMatches, sortBy]);

  const fallbackCount = filteredMatches.filter((match) => match.match_scope === 'outside_priority_area').length;
  const lowConfidenceCount = filteredMatches.filter((match) => match.confidence_score < 60).length;

  const handleViewProfile = (match: RoommateMatch) => {
    if (!canViewMore) {
      setLimitType('views');
      setIsLimitModalOpen(true);
      return;
    }

    recordView();
    setSelectedMatch(match);
    setIsProfileModalOpen(true);
    void trackFeatureEvent('roommate_profile_viewed', user?.id ?? null, {
      matched_user_id: match.matched_user_id,
      compatibility_score: match.compatibility_score,
      confidence_score: match.confidence_score,
      match_scope: match.match_scope,
    });
  };

  const handleStartChat = (userId: string) => {
    navigate(`/messages?user=${userId}`);
  };

  const handleOpenIntroModal = (match: RoommateMatch) => {
    if (checkConnection(match.matched_user_id)) {
      handleStartChat(match.matched_user_id);
      return;
    }

    if (sentIntroMessages.has(match.matched_user_id)) {
      toast.info('Bạn đã gửi tin nhắn giới thiệu cho người này rồi');
      return;
    }

    setIntroModalTarget(match);
    setIsIntroModalOpen(true);
  };

  const handleSendIntroMessage = async (message: string) => {
    if (!introModalTarget || !user?.id) {
      return;
    }

    try {
      await sendIntroMessage(user.id, introModalTarget.matched_user_id, message);
      void trackFeatureEvent('roommate_intro_sent', user.id, {
        matched_user_id: introModalTarget.matched_user_id,
        message_length: message.trim().length,
        compatibility_score: introModalTarget.compatibility_score,
      });
      await refetchRequests();
      toast.success('Đã gửi tin nhắn giới thiệu');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Không thể gửi tin nhắn. Vui lòng thử lại.';
      toast.error(messageText);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold">Bạn cùng phòng phù hợp</h1>
          <p className="text-muted-foreground">Đang tìm các gợi ý ưu tiên theo khu vực và dữ liệu của bạn...</p>
        </div>
        <RoommateResultsSkeleton count={4} />
      </>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Bạn cùng phòng phù hợp</h1>
          <p className="text-muted-foreground">
            {filteredMatches.length} gợi ý được ưu tiên theo khu vực của bạn và mở rộng nếu pool quá nhỏ.
          </p>
        </div>

        <Button variant="outline" size="icon" onClick={() => navigate('/roommates/profile')} title="Cập nhật tiêu chí tìm kiếm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {profile?.status === 'paused' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">Profile của bạn đang ẩn. Người khác sẽ không tìm thấy bạn cho đến khi bật lại.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setStatus('looking')}>
              Hiện lại
            </Button>
          </div>
        </Card>
      )}

      <LimitsBar limits={limits} isPremium={isPremium} onUpgrade={() => navigate('/payment')} />

      {(fallbackCount > 0 || lowConfidenceCount > 0) && (
        <Card className="mb-6 border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1 text-sm text-slate-700">
            {fallbackCount > 0 && <p>{fallbackCount} gợi ý đang nằm ngoài khu vực ưu tiên để tránh màn hình rỗng.</p>}
            {lowConfidenceCount > 0 && <p>{lowConfidenceCount} gợi ý có độ tin cậy dữ liệu thấp. Hoàn thiện thêm budget, district và ngày chuyển vào để kết quả sát hơn.</p>}
          </div>
        </Card>
      )}

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Độ phù hợp
                </div>
              </SelectItem>
              <SelectItem value="age">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tuổi
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <RoommateFilters filters={filters} onFiltersChange={setFilters} resultCount={filteredMatches.length} />
        </div>
      </div>

      {sortedMatches.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Chưa có gợi ý nào phù hợp</h3>
          <p className="mb-4 text-muted-foreground">
            Hệ thống đã ưu tiên tìm trong khu vực của bạn trước. Hãy mở rộng tiêu chí budget, giới tính ưu tiên hoặc cập nhật district để nhận thêm gợi ý.
          </p>
          <Button onClick={() => navigate('/roommates/profile')}>Cập nhật tiêu chí</Button>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="grid gap-4">
            {sortedMatches.map((match, index) => (
              <motion.div
                key={match.matched_user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoommateCard
                  match={match}
                  onViewProfile={() => handleViewProfile(match)}
                  onSendRequest={() => handleOpenIntroModal(match)}
                  onMessage={() => handleStartChat(match.matched_user_id)}
                  hasPendingRequest={checkOutgoingPending(match.matched_user_id)}
                  isIncomingPending={checkIncomingPending(match.matched_user_id)}
                  onAccept={() => {
                    const request = receivedRequests.find(
                      (entry) => entry.sender_id === match.matched_user_id && entry.status === 'pending',
                    );
                    if (request) {
                      void acceptRequest(request.id);
                    }
                  }}
                  isAccepting={isAccepting}
                  canSendRequest={limits.requests > 0}
                  isConnected={checkConnection(match.matched_user_id)}
                  hasIntroMessage={sentIntroMessages.has(match.matched_user_id)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {selectedMatch && (
        <RoommateProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          roommate={selectedMatch}
          onMessageClick={() => handleStartChat(selectedMatch.matched_user_id)}
          onSendRequest={() => {
            setIsProfileModalOpen(false);
            handleOpenIntroModal(selectedMatch);
          }}
          connectionStatus={
            checkConnection(selectedMatch.matched_user_id)
              ? 'connected'
              : checkOutgoingPending(selectedMatch.matched_user_id)
                ? 'pending_sent'
                : checkIncomingPending(selectedMatch.matched_user_id)
                  ? 'pending_received'
                  : 'none'
          }
          isRequestLoading={requestsLoading}
        />
      )}

      <LimitHitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        limitType={limitType}
        onUpgrade={() => navigate('/payment')}
      />

      <IntroMessageModal
        open={isIntroModalOpen}
        onClose={() => {
          setIsIntroModalOpen(false);
          setIntroModalTarget(null);
        }}
        match={introModalTarget}
        onSend={handleSendIntroMessage}
      />
    </>
  );
}
