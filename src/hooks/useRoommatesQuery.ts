/**
 * useRoommatesQuery - TanStack Query hooks for roommate finder
 * 
 * This file provides React Query-based hooks that automatically handle:
 * - Caching & deduplication
 * - Background refetching
 * - Loading/error states
 * - Cache invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    getRoommateProfile,
    createRoommateProfile,
    updateRoommateProfile,
    updateProfileStatus,
    deleteRoommateProfile,
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
    canSendMoreRequests,
    incrementDailyRequestCount,
    type RoommateProfile,
    type RoommateProfileInput,
    type RoommateProfileStatus,
    type RoommateMatch,
    type RoommateRequest,
    type QuizAnswer,
} from '@/services/roommates';

// ============================================
// Query Keys - Centralized for consistency
// ============================================

export const roommateKeys = {
    all: ['roommate'] as const,
    profile: (userId: string) => [...roommateKeys.all, 'profile', userId] as const,
    quiz: (userId: string) => [...roommateKeys.all, 'quiz', userId] as const,
    matches: (userId: string) => [...roommateKeys.all, 'matches', userId] as const,
    requests: (userId: string) => [...roommateKeys.all, 'requests', userId] as const,
};

// ============================================
// useRoommateProfileQuery - Profile Management
// ============================================

export function useRoommateProfileQuery() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Query: Fetch profile
    const query = useQuery({
        queryKey: roommateKeys.profile(user?.id ?? ''),
        queryFn: () => getRoommateProfile(user!.id),
        enabled: !!user?.id, // Only run if user is logged in
    });

    // Mutation: Create profile
    const createMutation = useMutation({
        mutationFn: (data: RoommateProfileInput) => createRoommateProfile(user!.id, data),
        onSuccess: (newProfile) => {
            // Update cache immediately
            queryClient.setQueryData(roommateKeys.profile(user!.id), newProfile);
            toast.success('Tạo profile thành công!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể tạo profile');
        },
    });

    // Mutation: Update profile
    const updateMutation = useMutation({
        mutationFn: (data: Partial<RoommateProfileInput>) => updateRoommateProfile(user!.id, data),
        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(roommateKeys.profile(user!.id), updatedProfile);
            toast.success('Cập nhật profile thành công!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể cập nhật profile');
        },
    });

    // Mutation: Update status
    const statusMutation = useMutation({
        mutationFn: (status: RoommateProfileStatus) => updateProfileStatus(user!.id, status),
        onSuccess: (_, status) => {
            // Optimistically update the profile in cache
            queryClient.setQueryData(
                roommateKeys.profile(user!.id),
                (old: RoommateProfile | undefined) => old ? { ...old, status } : old
            );
            const statusMessages = {
                looking: 'Profile đã được hiển thị',
                paused: 'Đã tạm dừng tìm kiếm',
                found: 'Chúc mừng bạn đã tìm được bạn cùng phòng!',
            };
            toast.success(statusMessages[status]);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể cập nhật trạng thái');
        },
    });

    // Mutation: Delete profile
    const deleteMutation = useMutation({
        mutationFn: () => deleteRoommateProfile(user!.id),
        onSuccess: () => {
            queryClient.setQueryData(roommateKeys.profile(user!.id), null);
            // Also invalidate matches since profile is gone
            queryClient.invalidateQueries({ queryKey: roommateKeys.matches(user!.id) });
            toast.success('Đã xóa profile tìm bạn cùng phòng');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể xóa profile');
        },
    });

    return {
        // Query data
        profile: query.data ?? null,
        loading: query.isLoading,
        error: query.error?.message ?? null,
        hasProfile: !!query.data,

        // Mutations
        createProfile: createMutation.mutateAsync,
        updateProfile: updateMutation.mutateAsync,
        setStatus: statusMutation.mutateAsync,
        deleteProfile: deleteMutation.mutateAsync,

        // Manual refetch if needed
        refetch: query.refetch,

        // Mutation states for UI feedback
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
    };
}

// ============================================
// useRoommateQuizQuery - Quiz Management
// ============================================

export function useRoommateQuizQuery() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: roommateKeys.quiz(user?.id ?? ''),
        queryFn: () => getQuizAnswers(user!.id),
        enabled: !!user?.id,
    });

    const saveMutation = useMutation({
        mutationFn: (answers: QuizAnswer[]) => saveQuizAnswers(user!.id, answers),
        onSuccess: (_, answers) => {
            queryClient.setQueryData(roommateKeys.quiz(user!.id), answers);
            toast.success('Đã lưu câu trả lời!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể lưu câu trả lời');
        },
    });

    return {
        answers: query.data ?? [],
        loading: query.isLoading,
        hasCompletedQuiz: (query.data?.length ?? 0) >= 5,
        saveAnswers: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
        refetch: query.refetch,
    };
}

// ============================================
// useRoommateMatchesQuery - Matching
// ============================================

import {
    getRemainingLimits,
    canViewMoreProfiles,
    canSendMoreRequests as canSendMoreRequestsFn,
    incrementDailyViewCount,
} from '@/services/roommates';

export function useRoommateMatchesQuery() {
    const { user } = useAuth();
    const [limits, setLimits] = useState(getRemainingLimits());

    const query = useQuery({
        queryKey: roommateKeys.matches(user?.id ?? ''),
        queryFn: () => getTopMatches(user!.id),
        enabled: !!user?.id,
    });

    const recordView = useCallback(() => {
        incrementDailyViewCount();
        setLimits(getRemainingLimits());
    }, []);

    return {
        matches: query.data ?? [],
        loading: query.isLoading,
        error: query.error?.message ?? null,
        refetch: query.refetch,
        isFetching: query.isFetching, // True when refetching in background

        // Limits tracking
        limits,
        canViewMore: canViewMoreProfiles(),
        canSendMore: canSendMoreRequestsFn(),
        recordView,
    };
}

// ============================================
// useRoommateRequestsQuery - Request Management
// ============================================

export function useRoommateRequestsQuery() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Query: Fetch both received and sent requests
    const query = useQuery({
        queryKey: roommateKeys.requests(user?.id ?? ''),
        queryFn: async () => {
            const [received, sent] = await Promise.all([
                getPendingRequests(user!.id),
                getSentRequests(user!.id),
            ]);
            return { received, sent };
        },
        enabled: !!user?.id,
    });

    // Mutation: Send request
    const sendMutation = useMutation({
        mutationFn: async ({ receiverId, message }: { receiverId: string; message?: string }) => {
            if (!canSendMoreRequests()) {
                throw new Error('Bạn đã hết lượt gửi yêu cầu hôm nay. Vui lòng quay lại vào ngày mai.');
            }
            return sendRoommateRequest(user!.id, receiverId, message);
        },
        onSuccess: (newRequest) => {
            // Add new request to sent list
            queryClient.setQueryData(
                roommateKeys.requests(user!.id),
                (old: { received: RoommateRequest[]; sent: RoommateRequest[] } | undefined) =>
                    old ? { ...old, sent: [newRequest, ...old.sent] } : old
            );
            incrementDailyRequestCount();
            toast.success('Đã gửi yêu cầu kết nối!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể gửi yêu cầu');
        },
    });

    // Mutation: Cancel request
    const cancelMutation = useMutation({
        mutationFn: cancelRoommateRequest,
        onSuccess: (_, requestId) => {
            queryClient.setQueryData(
                roommateKeys.requests(user!.id),
                (old: { received: RoommateRequest[]; sent: RoommateRequest[] } | undefined) =>
                    old ? {
                        ...old,
                        sent: old.sent.map(r =>
                            r.id === requestId ? { ...r, status: 'cancelled' as const } : r
                        )
                    } : old
            );
            toast.success('Đã hủy yêu cầu');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể hủy yêu cầu');
        },
    });

    // Mutation: Accept request
    const acceptMutation = useMutation({
        mutationFn: (requestId: string) => acceptRequestAndCreateConversation(requestId, user!.id),
        onSuccess: (_, requestId) => {
            queryClient.setQueryData(
                roommateKeys.requests(user!.id),
                (old: { received: RoommateRequest[]; sent: RoommateRequest[] } | undefined) =>
                    old ? {
                        ...old,
                        received: old.received.filter(r => r.id !== requestId)
                    } : old
            );
            toast.success('Đã chấp nhận yêu cầu! Bạn có thể bắt đầu trò chuyện.');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể chấp nhận yêu cầu');
        },
    });

    // Mutation: Decline request
    const declineMutation = useMutation({
        mutationFn: (requestId: string) => respondToRequest(requestId, false),
        onSuccess: (_, requestId) => {
            queryClient.setQueryData(
                roommateKeys.requests(user!.id),
                (old: { received: RoommateRequest[]; sent: RoommateRequest[] } | undefined) =>
                    old ? {
                        ...old,
                        received: old.received.filter(r => r.id !== requestId)
                    } : old
            );
            toast.success('Đã từ chối yêu cầu');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể từ chối yêu cầu');
        },
    });

    return {
        receivedRequests: query.data?.received ?? [],
        sentRequests: query.data?.sent ?? [],
        loading: query.isLoading,
        error: query.error?.message ?? null,
        pendingCount: query.data?.received.length ?? 0,

        // Mutations
        sendRequest: (receiverId: string, message?: string) =>
            sendMutation.mutateAsync({ receiverId, message }),
        cancelRequest: cancelMutation.mutateAsync,
        acceptRequest: acceptMutation.mutateAsync,
        declineRequest: declineMutation.mutateAsync,

        // Check existing request
        checkExistingRequest: (otherUserId: string) =>
            hasExistingRequest(user!.id, otherUserId),

        // Refetch
        refetch: query.refetch,

        // Mutation states
        isSending: sendMutation.isPending,
        isCancelling: cancelMutation.isPending,
    };
}

// ============================================
// useRoommateSetupQuery - Setup Wizard (Combined)
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

import { useState, useEffect, useCallback } from 'react';

export function useRoommateSetupQuery() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { profile, loading: profileLoading, createProfile, updateProfile } = useRoommateProfileQuery();
    const { saveAnswers } = useRoommateQuizQuery();

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

            // ✨ KEY FIX: Invalidate profile query so all components get fresh data
            await queryClient.invalidateQueries({
                queryKey: roommateKeys.profile(user.id)
            });

            setState(prev => ({ ...prev, step: 'complete' }));
            return true;
        } catch (err) {
            console.error('[useRoommateSetupQuery] Complete error:', err);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
            return false;
        }
    }, [user?.id, state, profile, saveAnswers, createProfile, updateProfile, queryClient]);

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

// ============================================
// Helper: Invalidate all roommate data
// ============================================

export function useInvalidateRoommateData() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useCallback(() => {
        if (user?.id) {
            queryClient.invalidateQueries({ queryKey: roommateKeys.all });
        }
    }, [user?.id, queryClient]);
}
