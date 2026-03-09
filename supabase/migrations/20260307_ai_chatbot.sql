-- AI chatbot storage tables + RLS
-- Safe to run multiple times

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user
    ON public.ai_chat_sessions (user_id);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session
    ON public.ai_chat_messages (session_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created
    ON public.ai_chat_messages (session_id, created_at);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'ai_chat_sessions'
            AND policyname = 'Users can view own sessions'
    ) THEN
        CREATE POLICY "Users can view own sessions"
            ON public.ai_chat_sessions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'ai_chat_sessions'
            AND policyname = 'Users can create own sessions'
    ) THEN
        CREATE POLICY "Users can create own sessions"
            ON public.ai_chat_sessions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'ai_chat_sessions'
            AND policyname = 'Users can delete own sessions'
    ) THEN
        CREATE POLICY "Users can delete own sessions"
            ON public.ai_chat_sessions
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'ai_chat_messages'
            AND policyname = 'Users can view own messages'
    ) THEN
        CREATE POLICY "Users can view own messages"
            ON public.ai_chat_messages
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.ai_chat_sessions s
                    WHERE s.id = ai_chat_messages.session_id
                        AND s.user_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = 'ai_chat_messages'
            AND policyname = 'Users can insert own messages'
    ) THEN
        CREATE POLICY "Users can insert own messages"
            ON public.ai_chat_messages
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.ai_chat_sessions s
                    WHERE s.id = ai_chat_messages.session_id
                        AND s.user_id = auth.uid()
                )
            );
    END IF;
END $$;
