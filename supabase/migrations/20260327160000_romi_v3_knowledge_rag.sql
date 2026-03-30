-- ROMI v3 sessions + knowledge-only RAG store
-- Safe to run multiple times

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.ai_chat_sessions
    ADD COLUMN IF NOT EXISTS experience_version TEXT,
    ADD COLUMN IF NOT EXISTS journey_state JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.ai_chat_sessions
SET experience_version = COALESCE(experience_version, 'romi_legacy');

ALTER TABLE public.ai_chat_sessions
    ALTER COLUMN experience_version SET DEFAULT 'romi_v3';

ALTER TABLE public.ai_chat_sessions
    ALTER COLUMN experience_version SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_experience_version
    ON public.ai_chat_sessions (experience_version, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.romi_knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    section TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'both',
    summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.romi_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.romi_knowledge_documents(id) ON DELETE CASCADE,
    chunk_id TEXT NOT NULL UNIQUE,
    chunk_index INTEGER NOT NULL,
    section TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'both',
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding extensions.vector(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_romi_knowledge_documents_section
    ON public.romi_knowledge_documents (section);

CREATE INDEX IF NOT EXISTS idx_romi_knowledge_chunks_document
    ON public.romi_knowledge_chunks (document_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_romi_knowledge_chunks_section_audience
    ON public.romi_knowledge_chunks (section, audience);

CREATE INDEX IF NOT EXISTS idx_romi_knowledge_chunks_embedding
    ON public.romi_knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;

ALTER TABLE public.romi_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romi_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.match_romi_knowledge_chunks(
    p_query_embedding TEXT,
    p_match_limit INTEGER DEFAULT 5,
    p_section TEXT DEFAULT NULL,
    p_audience TEXT DEFAULT NULL
)
RETURNS TABLE (
    chunk_id TEXT,
    document_id UUID,
    document_slug TEXT,
    document_title TEXT,
    section TEXT,
    audience TEXT,
    content TEXT,
    summary TEXT,
    similarity DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        c.chunk_id,
        c.document_id,
        d.slug AS document_slug,
        d.title AS document_title,
        c.section,
        c.audience,
        c.content,
        d.summary,
        1 - (c.embedding <=> p_query_embedding::extensions.vector(768)) AS similarity
    FROM public.romi_knowledge_chunks c
    INNER JOIN public.romi_knowledge_documents d ON d.id = c.document_id
    WHERE c.embedding IS NOT NULL
      AND (p_section IS NULL OR c.section = p_section)
      AND (
        p_audience IS NULL
        OR c.audience = 'both'
        OR c.audience = p_audience
      )
    ORDER BY c.embedding <=> p_query_embedding::extensions.vector(768)
    LIMIT GREATEST(COALESCE(p_match_limit, 5), 1);
$$;

GRANT EXECUTE ON FUNCTION public.match_romi_knowledge_chunks(TEXT, INTEGER, TEXT, TEXT)
    TO authenticated, service_role;
