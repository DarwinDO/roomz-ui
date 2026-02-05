/**
 * =============================================
 * ROOMZ REALTIME SERVICE
 * =============================================
 * Centralized realtime subscription management for messaging
 * Uses Supabase Realtime Postgres Changes (CDC) and Broadcast
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';

type Message = Tables<'messages'>;
type Conversation = Tables<'conversations'>;

// =============================================
// Types
// =============================================

export interface MessageWithSender extends Message {
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface RealtimeSubscription {
    channel: RealtimeChannel;
    unsubscribe: () => Promise<void>;
}

export interface TypingIndicator {
    userId: string;
    userName: string;
    isTyping: boolean;
    timestamp: number;
}

// =============================================
// Connection Status Management
// =============================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type ConnectionListener = (status: ConnectionStatus) => void;

const connectionListeners = new Set<ConnectionListener>();
let currentStatus: ConnectionStatus = 'disconnected';

export function onConnectionStatusChange(listener: ConnectionListener): () => void {
    connectionListeners.add(listener);
    // Immediately call with current status
    listener(currentStatus);
    return () => connectionListeners.delete(listener);
}

function updateConnectionStatus(status: ConnectionStatus) {
    currentStatus = status;
    connectionListeners.forEach(listener => listener(status));
}

// =============================================
// Message Subscriptions (Postgres Changes)
// =============================================

/**
 * Subscribe to new messages for a specific conversation
 * Uses Postgres Changes (CDC) for reliable delivery
 */
export function subscribeToConversationMessages(
    conversationId: string,
    callbacks: {
        onNewMessage: (message: MessageWithSender) => void;
        onMessageUpdate?: (message: Message) => void;
        onError?: (error: Error) => void;
    }
): RealtimeSubscription {
    const channelName = `messages:conversation:${conversationId}`;


    updateConnectionStatus('connecting');

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            async (payload: RealtimePostgresChangesPayload<Message>) => {


                try {
                    // Fetch sender info
                    const newMessage = payload.new as Message;
                    const { data: sender } = await supabase
                        .from('users')
                        .select('id, full_name, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    callbacks.onNewMessage({
                        ...newMessage,
                        sender: sender || undefined,
                    });
                } catch (err) {
                    console.error('[Realtime] Error enriching message:', err);
                    callbacks.onNewMessage(payload.new as MessageWithSender);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload: RealtimePostgresChangesPayload<Message>) => {

                callbacks.onMessageUpdate?.(payload.new as Message);
            }
        )
        .subscribe((status, err) => {
            switch (status) {
                case 'SUBSCRIBED':

                    updateConnectionStatus('connected');
                    break;
                case 'CHANNEL_ERROR':
                    console.error(`[Realtime] ❌ Channel error:`, err);
                    updateConnectionStatus('error');
                    callbacks.onError?.(new Error(err?.message || 'Channel error'));
                    break;
                case 'TIMED_OUT':
                    console.warn(`[Realtime] ⏱ Subscription timed out`);
                    updateConnectionStatus('error');
                    callbacks.onError?.(new Error('Subscription timed out'));
                    break;
                case 'CLOSED':

                    updateConnectionStatus('disconnected');
                    break;
            }
        });

    return {
        channel,
        unsubscribe: async () => {

            await supabase.removeChannel(channel);
        },
    };
}

/**
 * Subscribe to all messages for a user (global notification)
 * Useful for notification badges and conversation list updates
 */
export function subscribeToUserMessages(
    userId: string,
    callbacks: {
        onNewMessage: (message: Message, conversationId: string) => void;
        onError?: (error: Error) => void;
    }
): RealtimeSubscription {
    const channelName = `messages:user:${userId}`;



    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            async (payload: RealtimePostgresChangesPayload<Message>) => {
                const newMessage = payload.new as Message;

                // Check if this message involves the user
                // We need to check conversation_participants
                try {
                    const { data: participant } = await supabase
                        .from('conversation_participants')
                        .select('conversation_id')
                        .eq('conversation_id', newMessage.conversation_id)
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (participant) {

                        callbacks.onNewMessage(newMessage, newMessage.conversation_id);
                    }
                } catch {
                    // User not in this conversation, ignore
                }
            }
        )
        .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') {
                callbacks.onError?.(new Error(err?.message || 'Channel error'));
            }
        });

    return {
        channel,
        unsubscribe: async () => {
            await supabase.removeChannel(channel);
        },
    };
}

// =============================================
// Conversation Updates (Postgres Changes)
// =============================================

/**
 * Subscribe to conversation list updates
 */
export function subscribeToConversations(
    userId: string,
    callbacks: {
        onConversationUpdate: (conversation: Conversation) => void;
        onNewConversation: (conversationId: string) => void;
    }
): RealtimeSubscription {
    const channelName = `conversations:user:${userId}`;

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'conversations',
            },
            (payload: RealtimePostgresChangesPayload<Conversation>) => {
                callbacks.onConversationUpdate(payload.new as Conversation);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'conversation_participants',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                const participant = payload.new as { conversation_id: string };
                callbacks.onNewConversation(participant.conversation_id);
            }
        )
        .subscribe();

    return {
        channel,
        unsubscribe: async () => {
            await supabase.removeChannel(channel);
        },
    };
}

// =============================================
// Typing Indicators (Broadcast - Ephemeral)
// =============================================

/**
 * Create a typing indicator channel for a conversation
 * Uses Broadcast for low-latency, ephemeral events
 */
export function createTypingChannel(
    conversationId: string,
    userId: string,
    userName: string,
    onTyping: (indicator: TypingIndicator) => void
): {
    sendTyping: (isTyping: boolean) => Promise<void>;
    subscription: RealtimeSubscription;
} {
    const channelName = `typing:${conversationId}`;

    const channel = supabase.channel(channelName, {
        config: {
            broadcast: { ack: false, self: false },
        },
    });

    channel
        .on('broadcast', { event: 'typing' }, (payload) => {
            const indicator = payload.payload as TypingIndicator;
            // Ignore our own typing events
            if (indicator.userId !== userId) {
                onTyping(indicator);
            }
        })
        .subscribe();

    const sendTyping = async (isTyping: boolean) => {
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
                userId,
                userName,
                isTyping,
                timestamp: Date.now(),
            } satisfies TypingIndicator,
        });
    };

    return {
        sendTyping,
        subscription: {
            channel,
            unsubscribe: async () => {
                await supabase.removeChannel(channel);
            },
        },
    };
}

// =============================================
// Presence (Online/Offline Status)
// =============================================

export interface UserPresence {
    userId: string;
    userName: string;
    onlineAt: string;
    status: 'online' | 'away' | 'busy';
}

/**
 * Track user presence in a conversation
 */
export function createPresenceChannel(
    conversationId: string,
    userId: string,
    userName: string,
    callbacks: {
        onSync: (presences: Record<string, UserPresence[]>) => void;
        onJoin: (userId: string, presence: UserPresence) => void;
        onLeave: (userId: string) => void;
    }
): RealtimeSubscription {
    const channelName = `presence:${conversationId}`;

    const channel = supabase.channel(channelName, {
        config: {
            presence: { key: userId },
        },
    });

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<UserPresence>();
            callbacks.onSync(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            if (newPresences[0]) {
                callbacks.onJoin(key, newPresences[0] as unknown as UserPresence);
            }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
            callbacks.onLeave(key);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    userId,
                    userName,
                    onlineAt: new Date().toISOString(),
                    status: 'online',
                } as UserPresence);
            }
        });

    return {
        channel,
        unsubscribe: async () => {
            await channel.untrack();
            await supabase.removeChannel(channel);
        },
    };
}

// =============================================
// Utility Functions
// =============================================

/**
 * Cleanup all realtime channels
 */
export async function cleanupAllChannels(): Promise<void> {
    const channels = supabase.getChannels();


    for (const channel of channels) {
        await supabase.removeChannel(channel);
    }

    updateConnectionStatus('disconnected');
}

/**
 * Get current channel count
 */
export function getActiveChannelCount(): number {
    return supabase.getChannels().length;
}
