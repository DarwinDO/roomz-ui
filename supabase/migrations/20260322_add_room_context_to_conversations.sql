BEGIN;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_title_snapshot TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_room_id ON public.conversations(room_id);

DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user1_id UUID,
  user2_id UUID,
  room_id UUID DEFAULT NULL,
  room_title_snapshot TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_id UUID;
  lock_key TEXT;
BEGIN
  IF user1_id IS NULL OR user2_id IS NULL THEN
    RAISE EXCEPTION 'user ids are required';
  END IF;

  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'conversation requires two different participants';
  END IF;

  lock_key :=
    CASE
      WHEN user1_id::TEXT < user2_id::TEXT THEN user1_id::TEXT || ':' || user2_id::TEXT
      ELSE user2_id::TEXT || ':' || user1_id::TEXT
    END
    || ':' || COALESCE(room_id::TEXT, 'no-room');

  PERFORM pg_advisory_xact_lock(hashtextextended(lock_key, 0));

  SELECT c.id
  INTO conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1
    ON cp1.conversation_id = c.id
   AND cp1.user_id = user1_id
  JOIN public.conversation_participants cp2
    ON cp2.conversation_id = c.id
   AND cp2.user_id = user2_id
  WHERE c.room_id IS NOT DISTINCT FROM get_or_create_conversation.room_id
  LIMIT 1;

  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (room_id, room_title_snapshot)
    VALUES (room_id, room_title_snapshot)
    RETURNING id INTO conversation_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (conversation_id, user1_id),
      (conversation_id, user2_id)
    ON CONFLICT DO NOTHING;
  ELSIF room_title_snapshot IS NOT NULL THEN
    UPDATE public.conversations
    SET room_title_snapshot = COALESCE(public.conversations.room_title_snapshot, room_title_snapshot),
        updated_at = NOW()
    WHERE id = conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, TEXT) TO service_role;

COMMIT;
