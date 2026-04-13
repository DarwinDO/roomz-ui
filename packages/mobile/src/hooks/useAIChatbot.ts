import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    buildGuestHistory,
    createInitialWorkspaceState,
    romiWorkspaceReducer,
    sendAIChatMessageStream,
    type RomiDisplayMessage,
    type RomiViewerMode,
} from '@roomz/shared/services/ai-chatbot';

export function useAIChatbot() {
    const { user } = useAuth();
    const viewerMode: RomiViewerMode = user ? 'user' : 'guest';
    const [workspaceState, dispatch] = useReducer(
        romiWorkspaceReducer,
        viewerMode,
        createInitialWorkspaceState,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const workspaceRef = useRef(workspaceState);

    useEffect(() => {
        workspaceRef.current = workspaceState;
    }, [workspaceState]);

    useEffect(() => {
        dispatch({ type: 'reset', viewerMode });
        setError(null);
    }, [viewerMode]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        const createdAt = new Date().toISOString();
        const userMessage: RomiDisplayMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: trimmed,
            createdAt,
            journeyState: workspaceRef.current.journeyState,
        };
        const placeholderId = `assistant-${Date.now()}`;

        setError(null);
        setIsLoading(true);
        dispatch({ type: 'user_message', message: userMessage });
        dispatch({ type: 'assistant_placeholder', id: placeholderId, createdAt });

        try {
            for await (const event of sendAIChatMessageStream(supabase, trimmed, {
                sessionId: viewerMode === 'user' ? workspaceRef.current.session?.id || undefined : undefined,
                viewerMode,
                entryPoint: 'launcher',
                pageContext: {
                    route: 'mobile_ai_chatbot',
                    surface: viewerMode === 'guest' ? 'mobile_guest_modal' : 'mobile_modal',
                },
                journeyState: workspaceRef.current.journeyState,
                history: viewerMode === 'guest' ? buildGuestHistory(workspaceRef.current.messages) : undefined,
            })) {
                dispatch({ type: 'stream_event', event, placeholderId, createdAt });

                if (event.type === 'error') {
                    throw new Error(event.message);
                }
            }
        } catch (streamError) {
            const message = streamError instanceof Error
                ? streamError.message
                : 'Đã xảy ra lỗi. Vui lòng thử lại.';
            setError(message);
            dispatch({
                type: 'stream_event',
                event: {
                    type: 'error',
                    code: 'GEMINI_ERROR',
                    message,
                },
                placeholderId,
                createdAt,
            });
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, viewerMode]);

    const startNewChat = useCallback(() => {
        dispatch({ type: 'reset', viewerMode });
        setError(null);
    }, [viewerMode]);

    return {
        workspaceState,
        messages: workspaceState.messages,
        isLoading,
        error,
        viewerMode,
        isAuthenticated: !!user,
        sendMessage,
        startNewChat,
        sessionId: workspaceState.session?.id ?? null,
    };
}
