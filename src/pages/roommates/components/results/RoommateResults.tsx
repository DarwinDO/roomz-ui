/**
 * RoommateResults - Display matching results
 * Shows list of potential roommates sorted by compatibility
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Settings,
    Loader2,
    Heart,
    Users,
    Eye,
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useRoommateMatchesQuery,
    useRoommateProfileQuery,
    useRoommateRequestsQuery,
} from '@/hooks/useRoommatesQuery';
import { sendIntroMessage } from '@/services/roommates';
import { useAuth } from '@/contexts/AuthContext';
import { RoommateCard } from './RoommateCard';
import { RoommateResultsSkeleton } from './RoommateCardSkeleton';
import { IntroMessageModal } from './IntroMessageModal';
import { RoommateProfileModal } from '@/components/modals/RoommateProfileModal';
import { LimitsBar } from './LimitsBar';
import { RoommateFilters, type FilterOptions } from './RoommateFilters';
import { CompatibilityBreakdown } from './CompatibilityBreakdown';
import { LimitHitModal } from './LimitHitModal';
import { toast } from 'sonner';

type SortOption = 'compatibility' | 'distance' | 'age';

export function RoommateResults() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile, setStatus } = useRoommateProfileQuery();
    const {
        matches,
        loading: matchesLoading,
        error,
        limits,
        canViewMore,
        recordView,
        refetch,
    } = useRoommateMatchesQuery();
    const {
        sendRequest,
        checkExistingRequest,
        sentRequests,
        receivedRequests,
        loading: requestsLoading,
        refetch: refetchRequests,
        checkConnection,
        checkOutgoingPending,
        checkIncomingPending,
        acceptRequest,
        isAccepting
    } = useRoommateRequestsQuery();

    const [sortBy, setSortBy] = useState<SortOption>('compatibility');
    const [selectedMatch, setSelectedMatch] = useState<typeof matches[0] | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [limitType, setLimitType] = useState<'views' | 'requests'>('views');
    const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
    const [introModalTarget, setIntroModalTarget] = useState<typeof matches[0] | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({
        gender: 'any',
        ageMin: 18,
        ageMax: 40,
        budgetMin: 0,
        budgetMax: 10,
        occupation: 'any',
    });

    // Combined loading state - wait for all data to be ready
    const isLoading = matchesLoading || (requestsLoading && matches.length === 0);

    // Users we've sent intro messages to (used for intro modal check)
    const sentIntroMessages = useMemo(() => {
        return new Set(
            sentRequests
                .filter((r: any) => r.message && r.status === 'pending')
                .map((r: any) => r.receiver_id)
        );
    }, [sentRequests]);

    // Filter and sort matches
    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            if (filters.gender !== 'any' && match.gender !== filters.gender) return false;
            if (match.age && (match.age < filters.ageMin || match.age > filters.ageMax)) return false;
            if (filters.occupation !== 'any' && match.occupation !== filters.occupation) return false;
            return true;
        });
    }, [matches, filters]);

    const sortedMatches = useMemo(() => {
        const sorted = [...filteredMatches];
        switch (sortBy) {
            case 'compatibility':
                return sorted.sort((a, b) => b.compatibility_score - a.compatibility_score);
            case 'age':
                return sorted.sort((a, b) => (a.age || 99) - (b.age || 99));
            default:
                return sorted;
        }
    }, [filteredMatches, sortBy]);

    const handleViewProfile = async (match: typeof matches[0]) => {
        // Check limits for free users
        if (!canViewMore) {
            setLimitType('views');
            setIsLimitModalOpen(true);
            return;
        }

        recordView();
        setSelectedMatch(match);
        setIsProfileModalOpen(true);
    };

    const handleSendRequest = async (userId: string) => {
        // Check if request already exists
        const exists = await checkExistingRequest(userId);
        if (exists) {
            return;
        }

        // Send request - TanStack Query will auto-update sentRequests cache
        // which triggers useMemo to recalculate pendingRequests
        await sendRequest(userId);
    };

    const handleStartChat = (userId: string) => {
        // Navigate to messages with this user
        navigate(`/messages?user=${userId}`);
    };

    const handleOpenIntroModal = (match: typeof matches[0]) => {
        // If already connected, go directly to chat
        if (checkConnection(match.matched_user_id)) {
            handleStartChat(match.matched_user_id);
            return;
        }

        // If already sent intro, show toast
        if (sentIntroMessages.has(match.matched_user_id)) {
            toast.info('Bạn đã gửi tin nhắn giới thiệu cho người này rồi');
            return;
        }

        setIntroModalTarget(match);
        setIsIntroModalOpen(true);
    };

    const handleSendIntroMessage = async (message: string) => {
        if (!introModalTarget || !user?.id) return;

        try {
            await sendIntroMessage(user.id, introModalTarget.matched_user_id, message);
            // Refetch requests to update sentRequests cache
            // useMemo will automatically recalculate pendingRequests and sentIntroMessages
            await refetchRequests();
            toast.success('Đã gửi tin nhắn giới thiệu!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Không thể gửi tin nhắn. Vui lòng thử lại.';
            toast.error(errorMessage);
            throw err;
        }
    };

    // IMPROVED: Show skeleton for matches loading, but allow parallel viewing
    // if requests still loading - we can show matches with a small indicator
    if (isLoading) {
        return (
            <>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">Bạn cùng phòng phù hợp</h1>
                    <p className="text-muted-foreground">Đang tìm kiếm...</p>
                </div>
                <RoommateResultsSkeleton count={4} />
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => refetch()}>Thử lại</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header with Actions */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Bạn cùng phòng phù hợp</h1>
                    <p className="text-muted-foreground">
                        {filteredMatches.length} người phù hợp trong khu vực của bạn
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        title="Làm mới"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/roommates/profile')}
                        title="Cài đặt"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Profile Status Banner */}
            {profile?.status === 'paused' && (
                <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                Profile của bạn đang bị ẩn. Người khác không thể tìm thấy bạn.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus('looking')}
                        >
                            Hiển thị lại
                        </Button>
                    </div>
                </Card>
            )}

            {/* Limits Bar */}
            <LimitsBar limits={limits} />

            {/* Sort & Filter */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compatibility">
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    Độ phù hợp
                                </div>
                            </SelectItem>
                            <SelectItem value="age">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Tuổi
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <RoommateFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        resultCount={filteredMatches.length}
                    />
                </div>
            </div>

            {/* Results Grid */}
            {sortedMatches.length === 0 ? (
                <Card className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Chưa tìm thấy người phù hợp
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Hãy thử mở rộng khu vực tìm kiếm hoặc quay lại sau
                    </p>
                    <Button onClick={() => navigate('/roommates/profile')}>
                        Cập nhật cài đặt
                    </Button>
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
                                        // Need to find request ID for this user effectively
                                        // Since we don't have it in matches, we find it in receivedRequests
                                        const req = receivedRequests.find((r: any) => r.sender_id === match.matched_user_id && r.status === 'pending');
                                        if (req) acceptRequest(req.id);
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

            {/* Profile Modal */}
            {selectedMatch && (
                <RoommateProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    roommate={{
                        name: selectedMatch.full_name,
                        role: selectedMatch.occupation || 'Sinh viên',
                        match: selectedMatch.compatibility_score,
                        age: selectedMatch.age || 0,
                        university: selectedMatch.university || '',
                        major: selectedMatch.major || '',
                        bio: selectedMatch.bio || '',
                    }}
                    onMessageClick={() => handleStartChat(selectedMatch.matched_user_id)}
                />
            )}

            {/* Compatibility Breakdown Modal */}
            {selectedMatch && (
                <CompatibilityBreakdown
                    isOpen={isBreakdownOpen}
                    onClose={() => setIsBreakdownOpen(false)}
                    userA="Bạn"
                    userB={selectedMatch.full_name}
                    totalScore={selectedMatch.compatibility_score}
                    breakdown={{
                        sleep_score: selectedMatch.sleep_score,
                        cleanliness_score: selectedMatch.cleanliness_score,
                        noise_score: selectedMatch.noise_score,
                        guest_score: selectedMatch.guest_score,
                        weekend_score: selectedMatch.weekend_score,
                        budget_score: selectedMatch.budget_score,
                    }}
                />
            )}

            {/* Limit Hit Modal */}
            <LimitHitModal
                isOpen={isLimitModalOpen}
                onClose={() => setIsLimitModalOpen(false)}
                limitType={limitType}
                onUpgrade={() => navigate('/pricing')}
            />

            {/* Intro Message Modal */}
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
