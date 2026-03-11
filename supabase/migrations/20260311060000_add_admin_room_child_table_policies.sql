DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'room_images'
      AND policyname = 'Admins can manage all room images'
  ) THEN
    CREATE POLICY "Admins can manage all room images"
      ON public.room_images
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'room_amenities'
      AND policyname = 'Admins can manage all room amenities'
  ) THEN
    CREATE POLICY "Admins can manage all room amenities"
      ON public.room_amenities
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END
$$;
