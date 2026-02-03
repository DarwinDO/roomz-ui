/**
 * useRoommates Hook
 * React hooks for roommate finder: profile management, matching, and requests
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getRoommateProfile,
    createRoommateProfile,
    updateRoommateProfile,
    updateProfileStatus,
    getTopMatches,
    saveQuizAnswers,
    getQuizAnswers,
    getPendingRequests,
    getSentRequests,
    sendRoommateRequest,
    cancelRoommateRequest,
    respondToRequest,
    acceptRequestAndCreateConversation,
    hasExistingRequest,
    getRemainingLimits,
    canViewMoreProfiles,
    canSendMoreRequests,
    incrementDailyViewCount,
    incrementDailyRequestCount,
    subscribeToRequests,
    subscribeToRequestUpdates,
    type RoommateProfile,
    type RoommateProfileInput,
    type RoommateProfileStatus,
    type RoommateMatch,
    type RoommateRequest,
    type QuizAnswer,
} from '@/services/roommates';
import { toast } from 'sonner';

// ============================================
// useRoommateProfile - Profile Management
// ============================================

interface UseRoommateProfileReturn {
    profile: RoommateProfile | null;
    loading: boolean;
    error: string | null;
    hasProfile: boolean;
    createProfile: (data: RoommateProfileInput) => Promise<RoommateProfile | null>;
    updateProfile: (data: Partial<RoommateProfileInput>) => Promise<RoommateProfile | null>;
    setStatus: (status: RoommateProfileStatus) => Promise<void>;
    deleteProfile: () => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useRoommateProfile(): UseRoommateProfileReturn {
    const { user } = useAuth();
    const [profile, setProfile] = useState<RoommateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getRoommateProfile(user.id);
            setProfile(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
            setError(errorMessage);
            console.error('[useRoommateProfile] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const createProfile = useCallback(async (data: RoommateProfileInput): Promise<RoommateProfile | null> => {
        if (!user?.id) return null;

        try {
            const newProfile = await createRoommateProfile(user.id, data);
            setProfile(newProfile);
            toast.success('Tạo profile thành công!');
            return newProfile;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
            toast.error(errorMessage);
            console.error('[useRoommateProfile] Create error:', err);
            return null;
        }
    }, [user?.id]);

    const updateProfile = useCallback(async (data: Partial<RoommateProfileInput>): Promise<RoommateProfile | null> => {
        if (!user?.id) return null;

        try {
            const updatedProfile = await updateRoommateProfile(user.id, data);
            setProfile(updatedProfile);
            toast.success('Cập nhật profile thành công!');
            return updatedProfile;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
            toast.error(errorMessage);
            console.error('[useRoommateProfile] Update error:', err);
            return null;
        }
    }, [user?.id]);

    const setStatus = useCallback(async (status: RoommateProfileStatus): Promise<void> => {
        if (!user?.id) return;

        try {
            await updateProfileStatus(user.id, status);
            setProfile(prev => prev ? { ...prev, status } : null);

            const statusMessages = {
                looking: 'Profile đã được hiển thị',
                paused: 'Đã tạm dừng tìm kiếm',
                found: 'Chúc mừng bạn đã tìm được bạn cùng phòng!',
            };
            toast.success(statusMessages[status]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
            toast.error(errorMessage);
            console.error('[useRoommateProfile] Status error:', err);
        }
    }, [user?.id]);

    const deleteProfileHandler = useCallback(async (): Promise<boolean> => {
        if (!user?.id) return false;

        try {
            const { deleteRoommateProfile } = await import('@/services/roommates');
            await deleteRoommateProfile(user.id);
            setProfile(null);
            toast.success('Đã xóa profile tìm bạn cùng phòng');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
            toast.error(errorMessage);
            console.error('[useRoommateProfile] Delete error:', err);
            return false;
        }
    }, [user?.id]);

    return {
        profile,
        loading,
        error,
        hasProfile: !!profile,
        createProfile,
        updateProfile,
        setStatus,
        deleteProfile: deleteProfileHandler,
        refetch: fetchProfile,
    };
}

// ============================================
// useRoommateQuiz - Quiz Management
// ============================================

interface UseRoommateQuizReturn {
    answers: QuizAnswer[];
    loading: boolean;
    hasCompletedQuiz: boolean;
    saveAnswers: (answers: QuizAnswer[]) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useRoommateQuiz(): UseRoommateQuizReturn {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnswers = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await getQuizAnswers(user.id);
            setAnswers(data);
        } catch (err) {
            console.error('[useRoommateQuiz] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAnswers();
    }, [fetchAnswers]);

    const saveAnswersHandler = useCallback(async (newAnswers: QuizAnswer[]): Promise<boolean> => {
        if (!user?.id) return false;

        try {
            await saveQuizAnswers(user.id, newAnswers);
            setAnswers(newAnswers);
            toast.success('Đã lưu câu trả lời!');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save answers';
            toast.error(errorMessage);
            console.error('[useRoommateQuiz] Save error:', err);
            return false;
        }
    }, [user?.id]);

    return {
        answers,
        loading,
        hasCompletedQuiz: answers.length >= 5, // Assuming 5 questions minimum
        saveAnswers: saveAnswersHandler,
        refetch: fetchAnswers,
    };
}

// ============================================
// useRoommateMatches - Matching
// ============================================

interface UseRoommateMatchesReturn {
    matches: RoommateMatch[];
    loading: boolean;
    error: string | null;
    limits: {
        views: number;
        requests: number;
        viewLimit: number;
        requestLimit: number;
    };
    canViewMore: boolean;
    canSendMore: boolean;
    recordView: () => void;
    refetch: () => Promise<void>;
}

export function useRoommateMatches(): UseRoommateMatchesReturn {
    const { user } = useAuth();
    const [matches, setMatches] = useState<RoommateMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [limits, setLimits] = useState(getRemainingLimits());

    const fetchMatches = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getTopMatches(user.id);
            setMatches(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch matches';
            setError(errorMessage);
            console.error('[useRoommateMatches] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const recordView = useCallback(() => {
        incrementDailyViewCount();
        setLimits(getRemainingLimits());
    }, []);

    return {
        matches,
        loading,
        error,
        limits,
        canViewMore: canViewMoreProfiles(),
        canSendMore: canSendMoreRequests(),
        recordView,
        refetch: fetchMatches,
    };
}

// ============================================
// useRoommateRequests - Request Management
// ============================================

interface UseRoommateRequestsReturn {
    receivedRequests: RoommateRequest[];
    sentRequests: RoommateRequest[];
    loading: boolean;
    error: string | null;
    pendingCount: number;
    sendRequest: (receiverId: string, message?: string) => Promise<boolean>;
    cancelRequest: (requestId: string) => Promise<boolean>;
    acceptRequest: (requestId: string) => Promise<string | null>;
    declineRequest: (requestId: string) => Promise<boolean>;
    checkExistingRequest: (otherUserId: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useRoommateRequests(): UseRoommateRequestsReturn {
    const { user } = useAuth();
    const [received, setReceived] = useState<RoommateRequest[]>([]);
    const [sent, setSent] = useState<RoommateRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [receivedData, sentData] = await Promise.all([
                getPendingRequests(user.id),
                getSentRequests(user.id),
            ]);
            setReceived(receivedData);
            setSent(sentData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch requests';
            setError(errorMessage);
            console.error('[useRoommateRequests] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!user?.id) return;

        const sub1 = subscribeToRequests(user.id, (newRequest) => {
            setReceived(prev => [newRequest, ...prev]);
            toast.info('Bạn có yêu cầu kết nối mới!');
        });

        const sub2 = subscribeToRequestUpdates(user.id, (updatedRequest) => {
            setSent(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));

            if (updatedRequest.status === 'accepted') {
                toast.success('Yêu cầu của bạn đã được chấp nhận!');
            } else if (updatedRequest.status === 'declined') {
                toast.info('Yêu cầu của bạn đã bị từ chối');
            }
        });

        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
        };
    }, [user?.id]);

    const sendRequest = useCallback(async (receiverId: string, message?: string): Promise<boolean> => {
        if (!user?.id) return false;

        if (!canSendMoreRequests()) {
            toast.error('Bạn đã hết lượt gửi yêu cầu hôm nay. Vui lòng quay lại vào ngày mai.');
            return false;
        }

        try {
            const newRequest = await sendRoommateRequest(user.id, receiverId, message);
            setSent(prev => [newRequest, ...prev]);
            incrementDailyRequestCount();
            toast.success('Đã gửi yêu cầu kết nối!');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send request';
            toast.error(errorMessage);
            console.error('[useRoommateRequests] Send error:', err);
            return false;
        }
    }, [user?.id]);

    const cancelRequest = useCallback(async (requestId: string): Promise<boolean> => {
        try {
            await cancelRoommateRequest(requestId);
            setSent(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelled' as const } : r));
            toast.success('Đã hủy yêu cầu');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel request';
            toast.error(errorMessage);
            console.error('[useRoommateRequests] Cancel error:', err);
            return false;
        }
    }, []);

    const acceptRequest = useCallback(async (requestId: string): Promise<string | null> => {
        if (!user?.id) return null;

        try {
            const conversationId = await acceptRequestAndCreateConversation(requestId, user.id);
            setReceived(prev => prev.filter(r => r.id !== requestId));
            toast.success('Đã chấp nhận yêu cầu! Bạn có thể bắt đầu trò chuyện.');
            return conversationId;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to accept request';
            toast.error(errorMessage);
            console.error('[useRoommateRequests] Accept error:', err);
            return null;
        }
    }, [user?.id]);

    const declineRequest = useCallback(async (requestId: string): Promise<boolean> => {
        try {
            await respondToRequest(requestId, false);
            setReceived(prev => prev.filter(r => r.id !== requestId));
            toast.success('Đã từ chối yêu cầu');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to decline request';
            toast.error(errorMessage);
            console.error('[useRoommateRequests] Decline error:', err);
            return false;
        }
    }, []);

    const checkExistingRequest = useCallback(async (otherUserId: string): Promise<boolean> => {
        if (!user?.id) return false;
        return hasExistingRequest(user.id, otherUserId);
    }, [user?.id]);

    return {
        receivedRequests: received,
        sentRequests: sent,
        loading,
        error,
        pendingCount: received.length,
        sendRequest,
        cancelRequest,
        acceptRequest,
        declineRequest,
        checkExistingRequest,
        refetch: fetchRequests,
    };
}

// ============================================
// Combined Hook for Setup Wizard
// ============================================

export interface SetupWizardState {
    step: 'location' | 'quiz' | 'profile' | 'complete';
    locationData: {
        city: string;
        district: string;
        search_radius_km: number;
        university_based: boolean;
    } | null;
    quizAnswers: QuizAnswer[];
    profileData: Partial<RoommateProfileInput>;
}

interface UseRoommateSetupReturn {
    state: SetupWizardState;
    profile: RoommateProfile | null;
    loading: boolean;
    setLocationData: (data: SetupWizardState['locationData']) => void;
    setQuizAnswers: (answers: QuizAnswer[]) => void;
    setProfileData: (data: Partial<RoommateProfileInput>) => void;
    goToStep: (step: SetupWizardState['step']) => void;
    completeSetup: () => Promise<boolean>;
}

export function useRoommateSetup(): UseRoommateSetupReturn {
    const { user } = useAuth();
    const { profile, loading: profileLoading, createProfile, updateProfile } = useRoommateProfile();
    const { saveAnswers } = useRoommateQuiz();

    const [state, setState] = useState<SetupWizardState>({
        step: 'location',
        locationData: null,
        quizAnswers: [],
        profileData: {},
    });

    // Determine initial step based on existing profile
    useEffect(() => {
        if (!profileLoading && profile) {
            setState(prev => ({ ...prev, step: 'complete' }));
        }
    }, [profile, profileLoading]);

    const setLocationData = useCallback((data: SetupWizardState['locationData']) => {
        setState(prev => ({ ...prev, locationData: data, step: 'quiz' }));
    }, []);

    const setQuizAnswers = useCallback((answers: QuizAnswer[]) => {
        setState(prev => ({ ...prev, quizAnswers: answers, step: 'profile' }));
    }, []);

    const setProfileData = useCallback((data: Partial<RoommateProfileInput>) => {
        setState(prev => ({ ...prev, profileData: data }));
    }, []);

    const goToStep = useCallback((step: SetupWizardState['step']) => {
        setState(prev => ({ ...prev, step }));
    }, []);

    const completeSetup = useCallback(async (): Promise<boolean> => {
        if (!user?.id || !state.locationData) return false;

        try {
            // Save quiz answers first
            if (state.quizAnswers.length > 0) {
                await saveAnswers(state.quizAnswers);
            }

            // Create or update profile
            const profileData: RoommateProfileInput = {
                ...state.locationData,
                ...state.profileData,
            };

            if (profile) {
                await updateProfile(profileData);
            } else {
                await createProfile(profileData);
            }

            setState(prev => ({ ...prev, step: 'complete' }));
            return true;
        } catch (err) {
            console.error('[useRoommateSetup] Complete error:', err);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
            return false;
        }
    }, [user?.id, state, profile, saveAnswers, createProfile, updateProfile]);

    return {
        state,
        profile,
        loading: profileLoading,
        setLocationData,
        setQuizAnswers,
        setProfileData,
        goToStep,
        completeSetup,
    };
}
