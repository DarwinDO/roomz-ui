/**
 * Swap Notification Service
 * Integration with existing notification system
 * Sends notifications for swap-related events
 */

import { supabase } from '@/lib/supabase';

export type SwapNotificationSubType =
    | 'swap_request_received'
    | 'swap_request_accepted'
    | 'swap_request_rejected'
    | 'swap_match_found'
    | 'sublet_application_received'
    | 'sublet_application_approved'
    | 'sublet_application_rejected';

interface NotificationPayload {
    user_id: string;
    type: SwapNotificationSubType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Send notification to a user
 * Uses 'system' type with sub_type in metadata
 */
export async function sendSwapNotification(payload: NotificationPayload): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
        user_id: payload.user_id,
        type: 'system',
        title: payload.title,
        content: payload.message,
        link: payload.link,
        metadata: {
            sub_type: payload.type,
            ...(payload.metadata || {}),
        },
        is_read: false,
    });

    if (error) {
        console.error('[SwapNotification] Failed to send:', error);
        throw error;
    }
}

/**
 * Notify recipient when they receive a swap request
 */
export async function notifySwapRequestReceived(
    recipientId: string,
    requesterName: string,
    requestId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: recipientId,
        type: 'swap_request_received',
        title: 'Yêu cầu hoán đổi mới',
        message: `${requesterName} đã gửi yêu cầu hoán đổi phòng với bạn`,
        link: `/swap-requests`,
        metadata: { request_id: requestId },
    });
}

/**
 * Notify requester when their swap request is accepted
 */
export async function notifySwapRequestAccepted(
    requesterId: string,
    recipientName: string,
    requestId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: requesterId,
        type: 'swap_request_accepted',
        title: 'Yêu cầu được chấp nhận',
        message: `${recipientName} đã chấp nhận yêu cầu hoán đổi phòng của bạn`,
        link: `/swap-requests`,
        metadata: { request_id: requestId },
    });
}

/**
 * Notify requester when their swap request is rejected
 */
export async function notifySwapRequestRejected(
    requesterId: string,
    recipientName: string,
    requestId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: requesterId,
        type: 'swap_request_rejected',
        title: 'Yêu cầu bị từ chối',
        message: `${recipientName} đã từ chối yêu cầu hoán đổi phòng của bạn`,
        link: `/swap-requests`,
        metadata: { request_id: requestId },
    });
}

/**
 * Notify user when a new swap match is found
 */
export async function notifySwapMatchFound(
    userId: string,
    matchScore: number,
    matchId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: userId,
        type: 'swap_match_found',
        title: 'Phòng phù hợp mới',
        message: `Chúng tôi tìm thấy một phòng phù hợp ${matchScore}% với bạn`,
        link: `/swap-matches`,
        metadata: { match_id: matchId, match_score: matchScore },
    });
}

/**
 * Notify sublet owner when they receive an application
 */
export async function notifySubletApplicationReceived(
    ownerId: string,
    applicantName: string,
    subletTitle: string,
    applicationId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: ownerId,
        type: 'sublet_application_received',
        title: 'Đơn đăng ký mới',
        message: `${applicantName} đã đăng ký thuê phòng "${subletTitle}"`,
        link: `/my-sublets`,
        metadata: { application_id: applicationId },
    });
}

/**
 * Notify applicant when their application is approved
 */
export async function notifySubletApplicationApproved(
    applicantId: string,
    subletTitle: string,
    applicationId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: applicantId,
        type: 'sublet_application_approved',
        title: 'Đơn đăng ký được chấp nhận',
        message: `Chúc mừng! Đơn đăng ký thuê phòng "${subletTitle}" của bạn đã được chấp nhận`,
        link: `/swap-requests`,
        metadata: { application_id: applicationId },
    });
}

/**
 * Notify applicant when their application is rejected
 */
export async function notifySubletApplicationRejected(
    applicantId: string,
    subletTitle: string,
    applicationId: string
): Promise<void> {
    await sendSwapNotification({
        user_id: applicantId,
        type: 'sublet_application_rejected',
        title: 'Đơn đăng ký bị từ chối',
        message: `Đơn đăng ký thuê phòng "${subletTitle}" của bạn đã bị từ chối`,
        link: `/swap`,
        metadata: { application_id: applicationId },
    });
}
