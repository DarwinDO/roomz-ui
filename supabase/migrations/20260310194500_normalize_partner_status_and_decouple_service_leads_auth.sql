BEGIN;

-- Keep partner lifecycle aligned with the current product workflow.
UPDATE public.partners
SET status = 'inactive'
WHERE status NOT IN ('active', 'inactive');

ALTER TABLE public.partners
    DROP CONSTRAINT IF EXISTS partners_status_check;

ALTER TABLE public.partners
    ADD CONSTRAINT partners_status_check
    CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));

-- Service leads are app-domain records and should only depend on public.users.
ALTER TABLE public.service_leads
    DROP CONSTRAINT IF EXISTS service_leads_user_id_fkey;

ALTER TABLE public.service_leads
    DROP CONSTRAINT IF EXISTS service_leads_assigned_by_fkey;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.service_leads'::regclass
          AND conname = 'service_leads_user_id_users_fkey'
    ) THEN
        ALTER TABLE public.service_leads
            ADD CONSTRAINT service_leads_user_id_users_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.service_leads'::regclass
          AND conname = 'service_leads_assigned_by_users_fkey'
    ) THEN
        ALTER TABLE public.service_leads
            ADD CONSTRAINT service_leads_assigned_by_users_fkey
            FOREIGN KEY (assigned_by) REFERENCES public.users(id);
    END IF;
END;
$$;

COMMIT;
