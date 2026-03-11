CREATE TABLE IF NOT EXISTS public.crawl_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('partner', 'location')),
    provider TEXT NOT NULL DEFAULT 'firecrawl' CHECK (provider IN ('firecrawl')),
    name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_domain TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_run_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crawl_sources_provider_entity_url
    ON public.crawl_sources(provider, entity_type, source_url);

CREATE INDEX IF NOT EXISTS idx_crawl_sources_entity_active
    ON public.crawl_sources(entity_type, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.crawl_sources(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('partner', 'location')),
    provider TEXT NOT NULL CHECK (provider IN ('firecrawl', 'admin_upload')),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('source_run', 'file_upload')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'partial')),
    source_name TEXT NOT NULL,
    source_url TEXT,
    provider_job_id TEXT,
    file_name TEXT,
    total_count INTEGER NOT NULL DEFAULT 0 CHECK (total_count >= 0),
    inserted_count INTEGER NOT NULL DEFAULT 0 CHECK (inserted_count >= 0),
    ready_count INTEGER NOT NULL DEFAULT 0 CHECK (ready_count >= 0),
    duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
    error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
    skipped_count INTEGER NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message TEXT,
    log JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_entity_created
    ON public.crawl_jobs(entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status_created
    ON public.crawl_jobs(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_crawl_sources_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_crawl_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crawl_sources_updated_at_trigger ON public.crawl_sources;
CREATE TRIGGER crawl_sources_updated_at_trigger
BEFORE UPDATE ON public.crawl_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_crawl_sources_updated_at();

DROP TRIGGER IF EXISTS crawl_jobs_updated_at_trigger ON public.crawl_jobs;
CREATE TRIGGER crawl_jobs_updated_at_trigger
BEFORE UPDATE ON public.crawl_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_crawl_jobs_updated_at();

ALTER TABLE public.crawl_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view crawl sources" ON public.crawl_sources;
CREATE POLICY "Admins can view crawl sources"
ON public.crawl_sources
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert crawl sources" ON public.crawl_sources;
CREATE POLICY "Admins can insert crawl sources"
ON public.crawl_sources
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update crawl sources" ON public.crawl_sources;
CREATE POLICY "Admins can update crawl sources"
ON public.crawl_sources
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete crawl sources" ON public.crawl_sources;
CREATE POLICY "Admins can delete crawl sources"
ON public.crawl_sources
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view crawl jobs" ON public.crawl_jobs;
CREATE POLICY "Admins can view crawl jobs"
ON public.crawl_jobs
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert crawl jobs" ON public.crawl_jobs;
CREATE POLICY "Admins can insert crawl jobs"
ON public.crawl_jobs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update crawl jobs" ON public.crawl_jobs;
CREATE POLICY "Admins can update crawl jobs"
ON public.crawl_jobs
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete crawl jobs" ON public.crawl_jobs;
CREATE POLICY "Admins can delete crawl jobs"
ON public.crawl_jobs
FOR DELETE
TO authenticated
USING (public.is_admin());
