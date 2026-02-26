-- Auto-update updated_at on reports table
CREATE OR REPLACE FUNCTION public.update_reports_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
DROP TRIGGER IF EXISTS set_reports_updated_at ON public.reports;
CREATE TRIGGER set_reports_updated_at BEFORE
UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_reports_updated_at();