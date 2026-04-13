-- ============================================
-- Sync community post like/comment counters
-- Date: 2026-04-12
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_likes_post_id
ON public.community_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id_status
ON public.community_comments(post_id, status);

CREATE OR REPLACE FUNCTION public.refresh_community_post_counters(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF p_post_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.community_posts
    SET likes_count = (
            SELECT COUNT(*)
            FROM public.community_likes
            WHERE post_id = p_post_id
        ),
        comments_count = (
            SELECT COUNT(*)
            FROM public.community_comments
            WHERE post_id = p_post_id
              AND status = 'active'
        )
    WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_community_post_counters_from_likes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM public.refresh_community_post_counters(COALESCE(NEW.post_id, OLD.post_id));
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_community_post_counters_from_comments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id THEN
        PERFORM public.refresh_community_post_counters(OLD.post_id);
    END IF;

    PERFORM public.refresh_community_post_counters(COALESCE(NEW.post_id, OLD.post_id));
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_likes_count
ON public.community_likes;

DROP FUNCTION IF EXISTS public.update_likes_count();

DROP TRIGGER IF EXISTS sync_community_post_counters_from_likes
ON public.community_likes;

CREATE TRIGGER sync_community_post_counters_from_likes
AFTER INSERT OR DELETE
ON public.community_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_community_post_counters_from_likes();

DROP TRIGGER IF EXISTS trigger_update_comments_count
ON public.community_comments;

DROP FUNCTION IF EXISTS public.update_comments_count();

DROP TRIGGER IF EXISTS sync_community_post_counters_from_comments
ON public.community_comments;

CREATE TRIGGER sync_community_post_counters_from_comments
AFTER INSERT OR DELETE OR UPDATE OF post_id, status
ON public.community_comments
FOR EACH ROW
EXECUTE FUNCTION public.sync_community_post_counters_from_comments();

WITH recomputed AS (
    SELECT
        post.id,
        (
            SELECT COUNT(*)
            FROM public.community_likes
            WHERE post_id = post.id
        ) AS likes_count,
        (
            SELECT COUNT(*)
            FROM public.community_comments
            WHERE post_id = post.id
              AND status = 'active'
        ) AS comments_count
    FROM public.community_posts AS post
)
UPDATE public.community_posts AS post
SET likes_count = recomputed.likes_count,
    comments_count = recomputed.comments_count
FROM recomputed
WHERE post.id = recomputed.id
  AND (
      COALESCE(post.likes_count, 0) IS DISTINCT FROM recomputed.likes_count
      OR COALESCE(post.comments_count, 0) IS DISTINCT FROM recomputed.comments_count
  );
