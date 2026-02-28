/**
 * Analytics API Service (Shared)
 * Track user and system analytics events
 * Platform agnostic - can be used from any platform
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type AnalyticsEventName =
    | 'page_view'
    | 'room_view'
    | 'room_contact_view'
    | 'room_favorite'
    | 'room_share'
    | 'booking_created'
    | 'search_performed'
    | 'filter_applied'
    | 'signup_completed'
    | 'subscription_started'
    | 'subscription_renewed'
    | 'subscription_cancelled';

export interface AnalyticsEvent {
    id?: string;
    event_name: AnalyticsEventName;
    user_id: string | null;
    session_id: string | null;
    properties: Record<string, unknown>;
    timestamp: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Track an analytics event
 */
export async function trackEvent(
    supabase: SupabaseClient,
    event: Omit<AnalyticsEvent, 'id' | 'timestamp'>
): Promise<void> {
    const { error } = await supabase
        .from('analytics_events')
        .insert({
            event_name: event.event_name,
            user_id: event.user_id,
            session_id: event.session_id,
            properties: event.properties,
            timestamp: new Date().toISOString(),
        });

    if (error) {
        // Don't throw - analytics should not break the app
        console.warn('Failed to track event:', error.message);
    }
}

/**
 * Track page view
 */
export async function trackPageView(
    supabase: SupabaseClient,
    userId: string | null,
    sessionId: string | null,
    pageName: string,
    properties?: Record<string, unknown>
): Promise<void> {
    await trackEvent(supabase, {
        event_name: 'page_view',
        user_id: userId,
        session_id: sessionId,
        properties: {
            page_name: pageName,
            ...properties,
        },
    });
}

/**
 * Track room view
 */
export async function trackRoomView(
    supabase: SupabaseClient,
    userId: string | null,
    sessionId: string | null,
    roomId: string,
    roomTitle: string,
    price: number
): Promise<void> {
    await trackEvent(supabase, {
        event_name: 'room_view',
        user_id: userId,
        session_id: sessionId,
        properties: {
            room_id: roomId,
            room_title: roomTitle,
            price,
        },
    });
}

/**
 * Track search
 */
export async function trackSearch(
    supabase: SupabaseClient,
    userId: string | null,
    sessionId: string | null,
    query: string,
    filters: Record<string, unknown>,
    resultCount: number
): Promise<void> {
    await trackEvent(supabase, {
        event_name: 'search_performed',
        user_id: userId,
        session_id: sessionId,
        properties: {
            search_query: query,
            filters,
            result_count: resultCount,
        },
    });
}

/**
 * Track booking creation
 */
export async function trackBooking(
    supabase: SupabaseClient,
    userId: string | null,
    sessionId: string | null,
    bookingId: string,
    bookingType: 'viewing' | 'moving' | 'deposit',
    roomId: string,
    price: number
): Promise<void> {
    await trackEvent(supabase, {
        event_name: 'booking_created',
        user_id: userId,
        session_id: sessionId,
        properties: {
            booking_id: bookingId,
            booking_type: bookingType,
            room_id: roomId,
            price,
        },
    });
}

/**
 * Track subscription event
 */
export async function trackSubscription(
    supabase: SupabaseClient,
    userId: string,
    eventType: 'subscription_started' | 'subscription_renewed' | 'subscription_cancelled',
    planId: string,
    amount: number
): Promise<void> {
    await trackEvent(supabase, {
        event_name: eventType,
        user_id: userId,
        session_id: null,
        properties: {
            plan_id: planId,
            amount,
        },
    });
}
