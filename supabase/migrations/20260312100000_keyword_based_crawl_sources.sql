ALTER TABLE public.crawl_sources
    ADD COLUMN IF NOT EXISTS source_mode TEXT NOT NULL DEFAULT 'url';

ALTER TABLE public.crawl_sources
    ADD COLUMN IF NOT EXISTS discovery_query TEXT;

ALTER TABLE public.crawl_sources
    ADD COLUMN IF NOT EXISTS discovery_location TEXT;

ALTER TABLE public.crawl_sources
    ADD COLUMN IF NOT EXISTS discovery_country TEXT;

ALTER TABLE public.crawl_sources
    ADD COLUMN IF NOT EXISTS discovery_limit INTEGER;

ALTER TABLE public.crawl_sources
    ALTER COLUMN source_url DROP NOT NULL;

ALTER TABLE public.crawl_sources
    ALTER COLUMN discovery_limit SET DEFAULT 5;

UPDATE public.crawl_sources
SET
    source_mode = COALESCE(source_mode, 'url'),
    discovery_limit = COALESCE(discovery_limit, 5)
WHERE source_mode IS NULL
   OR discovery_limit IS NULL;

ALTER TABLE public.crawl_sources
    DROP CONSTRAINT IF EXISTS crawl_sources_source_mode_check;

ALTER TABLE public.crawl_sources
    ADD CONSTRAINT crawl_sources_source_mode_check
    CHECK (source_mode IN ('url', 'keyword'));

ALTER TABLE public.crawl_sources
    DROP CONSTRAINT IF EXISTS crawl_sources_mode_requirements;

ALTER TABLE public.crawl_sources
    ADD CONSTRAINT crawl_sources_mode_requirements
    CHECK (
        (
            source_mode = 'url'
            AND source_url IS NOT NULL
            AND discovery_query IS NULL
        )
        OR (
            source_mode = 'keyword'
            AND discovery_query IS NOT NULL
            AND btrim(discovery_query) <> ''
        )
    );

DROP INDEX IF EXISTS idx_crawl_sources_provider_entity_url;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crawl_sources_provider_entity_url
    ON public.crawl_sources(provider, entity_type, source_url)
    WHERE source_mode = 'url'
      AND source_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crawl_sources_provider_entity_keyword
    ON public.crawl_sources(
        provider,
        entity_type,
        lower(discovery_query),
        COALESCE(lower(discovery_location), ''),
        COALESCE(upper(discovery_country), '')
    )
    WHERE source_mode = 'keyword'
      AND discovery_query IS NOT NULL;

ALTER TABLE public.crawl_jobs
    DROP CONSTRAINT IF EXISTS crawl_jobs_trigger_type_check;

ALTER TABLE public.crawl_jobs
    ADD CONSTRAINT crawl_jobs_trigger_type_check
    CHECK (trigger_type IN ('source_run', 'file_upload', 'keyword_run'));
