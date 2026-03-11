/**
 * useRoommatesQuery - TanStack Query hooks for roommate finder
 * 
 * This file provides React Query-based hooks that automatically handle:
 * - Caching & deduplication
 * - Background refetching
 * - Loading/error states
 * - Cache invalidation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FREE_LIMITS } from '@roomz/shared/constants/premium';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
    getRoommateProfile,
    createRoommateProfile,
    updateRoommateProfile,
    updateProfileStatus,
    deleteRoommateProfile,
    getTopMatches,
    saveQuizAnswers,
    getQuizAnswers,
    getAllRequests,
    sendRoommateRequest,
    cancelRoommateRequest,
    respondToRequest,
    acceptRequestAndCreateConversation,
    hasExistingRequest,
    getRoommateFeatureLimits,
    recordRoommateProfileView,
    type RoommateProfile,
    type RoommateProfileInput,
    type RoommateProfileStatus,
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
    limits: (userId: string) => [...roommateKeys.all, 'limits', userId] as const,
};

const ENABLE_ROOMMATE_REQUESTS_REALTIME = true;

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
// useRoommateLimits - Reactive limits tracking
// ============================================

export function useRoommateLimits() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: roommateKeys.limits(user?.id ?? ''),
        queryFn: () => getRoommateFeatureLimits(),
        enabled: !!user?.id,
    });

    const incrementView = useCallback(async () => {
        if (!user?.id) {
            return null;
        }
        const nextLimits = await recordRoommateProfileView();
        queryClient.setQueryData(roommateKeys.limits(user.id), nextLimits);
        return nextLimits;
    }, [user?.id, queryClient]);

    const incrementRequest = useCallback(() => {
        if (!user?.id) return;
        queryClient.invalidateQueries({ queryKey: roommateKeys.limits(user.id) });
    }, [user?.id, queryClient]);

    return {
        limits: query.data ?? {
            views: 0,
            requests: 0,
            viewLimit: FREE_LIMITS.ROOMMATE_VIEWS_PER_DAY,
            requestLimit: FREE_LIMITS.ROOMMATE_REQUESTS_PER_DAY,
        },
        loading: query.isLoading,
        incrementView,
        incrementRequest,
        canViewMore: query.data?.canViewMore ?? true,
        canSendMore: query.data?.canSendMore ?? true,
    };
}

// ============================================
// useRoommateMatchesQuery - Matching
// ============================================

export function useRoommateMatchesQuery() {
    const { user } = useAuth();
    const { limits, canViewMore, canSendMore, incrementView } = useRoommateLimits();

    const query = useQuery({
        queryKey: roommateKeys.matches(user?.id ?? ''),
        queryFn: () => getTopMatches(user!.id),
        enabled: !!user?.id,
    });

    return {
        matches: query.data ?? [],
        loading: query.isLoading,
        error: query.error?.message ?? null,
        refetch: query.refetch,
        isFetching: query.isFetching,

        // Limits tracking (now reactive)
        limits,
        canViewMore,
        canSendMore,
        recordView: incrementView,
    };
}

// ============================================
// useRoommateRequestsQuery - Request Management
// ============================================



export function useRoommateRequestsQuery() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Query: Fetch both received and sent requests
    const query = useQuery({
        queryKey: roommateKeys.requests(user?.id ?? ''),
        queryFn: () => getAllRequests(user!.id),
        enabled: !!user?.id,
    });

    // 🔄 Realtime subscription for request status updates
    // IMPORTANT: Requires enabling Replication for `roommate_requests` table in Supabase Dashboard
    // If Realtime is not available, TanStack Query's refetchOnWindowFocus provides fallback
    useEffect(() => {
        if (!user?.id || !ENABLE_ROOMMATE_REQUESTS_REALTIME) return;

        let isMounted = true;

        // Stable channel name - reuse same channel for same user
        const channelName = `roommate-requests-${user.id}`;

        // Check if channel already exists to prevent duplicates
        const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
        if (existingChannel) {
            if (import.meta.env.DEV) {
                console.log('[useRoommateRequestsQuery] Reusing existing channel');
            }
            channelRef.current = existingChannel;
            return;
        }

        if (import.meta.env.DEV) {
            console.log('[useRoommateRequestsQuery] Setting up realtime subscription');
        }

        channelRef.current = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'roommate_requests',
                },
                (payload) => {
                    if (!isMounted) return;

                    const newData = payload.new as RoommateRequest | undefined;
                    const oldData = payload.old as { id?: string; sender_id?: string; receiver_id?: string } | undefined;

                    // Check if this change affects current user
                    const isRelevant =
                        newData?.sender_id === user.id ||
                        newData?.receiver_id === user.id ||
                        oldData?.sender_id === user.id ||
                        oldData?.receiver_id === user.id;

                    if (!isRelevant) return;

                    if (import.meta.env.DEV) {
                        console.log('[useRoommateRequestsQuery] Relevant request change:', payload.eventType);
                    }

                    if (payload.eventType === 'UPDATE' && newData?.sender_id === user.id) {
                        queryClient.setQueryData(
                            roommateKeys.requests(user.id),
                            (old: { received: RoommateRequest[]; sent: RoommateRequest[] } | undefined) =>
                                old ? {
                                    ...old,
                                    sent: old.sent.map(r =>
                                        r.id === newData.id
                                            ? { ...r, status: newData.status }
                                            : r
                                    )
                                } : old
                        );

                        if (newData.status === 'accepted') {
                            toast.success('Yêu cầu kết nối của bạn đã được chấp nhận! 🎉');
                        }
                    } else if (payload.eventType === 'INSERT' && newData?.receiver_id === user.id) {
                        queryClient.invalidateQueries({ queryKey: roommateKeys.requests(user.id) });
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    if (import.meta.env.DEV) {
                        console.log('[useRoommateRequestsQuery] ✅ Subscribed to request updates');
                    }
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('[useRoommateRequestsQuery] ❌ Channel error:', err);
                }
            });

        return () => {
            isMounted = false;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [user?.id, queryClient]);

    // Mutation: Send request
    const sendMutation = useMutation({
        mutationFn: async ({ receiverId, message }: { receiverId: string; message?: string }) => {
            return sendRoommateRequest(user!.id, receiverId, message);
        },
        onSuccess: (newRequest) => {
            // Add new request to sent list
            queryClient.setQueryData(
                roommateKeys.requests(user!.id),
                (old: { received: RoommateRequest[]; sent: RoommateRequest[] } | undefined) =>
                    old ? { ...old, sent: [newRequest, ...old.sent] } : old
            );
            queryClient.invalidateQueries({ queryKey: roommateKeys.requests(user!.id) });

            queryClient.invalidateQueries({ queryKey: roommateKeys.limits(user!.id) });

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
            queryClient.invalidateQueries({ queryKey: roommateKeys.requests(user!.id) });
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
                        received: old.received.map(r =>
                            r.id === requestId ? { ...r, status: 'accepted' as const, responded_at: new Date().toISOString() } : r
                        )
                    } : old
            );

            // Invalidate to sync with server and update other queries (matches, messages)
            queryClient.invalidateQueries({ queryKey: roommateKeys.requests(user!.id) });
            queryClient.invalidateQueries({ queryKey: roommateKeys.matches(user!.id) });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

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
                        received: old.received.map(r =>
                            r.id === requestId ? { ...r, status: 'declined' as const, responded_at: new Date().toISOString() } : r
                        )
                    } : old
            );
            queryClient.invalidateQueries({ queryKey: roommateKeys.requests(user!.id) });
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
        pendingCount: query.data?.received.filter(r => r.status === 'pending').length ?? 0,

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
        isAccepting: acceptMutation.isPending,
        isDeclining: declineMutation.isPending,

        // Helpers
        checkConnection: (otherUserId: string) => {
            const data = query.data;
            if (!data) return false;
            return (
                data.sent.some(r => r.receiver_id === otherUserId && r.status === 'accepted') ||
                data.received.some(r => r.sender_id === otherUserId && r.status === 'accepted')
            );
        },
        checkOutgoingPending: (otherUserId: string) => {
            const data = query.data;
            if (!data) return false;
            return data.sent.some(r => r.receiver_id === otherUserId && r.status === 'pending');
        },
        checkIncomingPending: (otherUserId: string) => {
            const data = query.data;
            if (!data) return false;
            return data.received.some(r => r.sender_id === otherUserId && r.status === 'pending');
        },
        // Legacy helper for backward compatibility
        checkPending: (otherUserId: string) => {
            const data = query.data;
            if (!data) return false;
            return (
                data.sent.some(r => r.receiver_id === otherUserId && r.status === 'pending') ||
                data.received.some(r => r.sender_id === otherUserId && r.status === 'pending')
            );
        },
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

    const completeSetup = useCallback(async (finalProfileData?: Partial<RoommateProfileInput>): Promise<boolean> => {
        if (!user?.id || !state.locationData) return false;

        try {
            // Save quiz answers first
            if (state.quizAnswers.length > 0) {
                await saveAnswers(state.quizAnswers);
            }

            // Create or update profile
            // Use finalProfileData if provided, otherwise fallback to state (stale)
            const profileData: RoommateProfileInput = {
                ...state.locationData,
                ...(finalProfileData || state.profileData),
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
