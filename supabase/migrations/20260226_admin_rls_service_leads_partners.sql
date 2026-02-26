-- =====================================================
-- Admin RLS Policies for service_leads and partners tables
-- =====================================================
-- Extends admin access to service leads and partners management
-- 8. Allow admin to SELECT all service_leads
DROP POLICY IF EXISTS "Admins can view all service_leads" ON public.service_leads;
CREATE POLICY "Admins can view all service_leads" ON public.service_leads FOR
SELECT TO authenticated USING (public.is_admin());
-- 9. Allow admin to INSERT service_leads
DROP POLICY IF EXISTS "Admins can insert service_leads" ON public.service_leads;
CREATE POLICY "Admins can insert service_leads" ON public.service_leads FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
-- 10. Allow admin to UPDATE service_leads
DROP POLICY IF EXISTS "Admins can update service_leads" ON public.service_leads;
CREATE POLICY "Admins can update service_leads" ON public.service_leads FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 11. Allow admin to DELETE service_leads
DROP POLICY IF EXISTS "Admins can delete service_leads" ON public.service_leads;
CREATE POLICY "Admins can delete service_leads" ON public.service_leads FOR DELETE TO authenticated USING (public.is_admin());
-- 12. Allow admin to SELECT all partners
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partners;
CREATE POLICY "Admins can view all partners" ON public.partners FOR
SELECT TO authenticated USING (public.is_admin());
-- 13. Allow admin to INSERT partners
DROP POLICY IF EXISTS "Admins can insert partners" ON public.partners;
CREATE POLICY "Admins can insert partners" ON public.partners FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
-- 14. Allow admin to UPDATE partners
DROP POLICY IF EXISTS "Admins can update partners" ON public.partners;
CREATE POLICY "Admins can update partners" ON public.partners FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 15. Allow admin to DELETE partners
DROP POLICY IF EXISTS "Admins can delete partners" ON public.partners;
CREATE POLICY "Admins can delete partners" ON public.partners FOR DELETE TO authenticated USING (public.is_admin());
-- 16. Allow admin to SELECT all deals (related to partners)
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;
CREATE POLICY "Admins can view all deals" ON public.deals FOR
SELECT TO authenticated USING (public.is_admin());
-- 17. Allow admin to INSERT deals
DROP POLICY IF EXISTS "Admins can insert deals" ON public.deals;
CREATE POLICY "Admins can insert deals" ON public.deals FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
-- 18. Allow admin to UPDATE deals
DROP POLICY IF EXISTS "Admins can update deals" ON public.deals;
CREATE POLICY "Admins can update deals" ON public.deals FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 19. Allow admin to DELETE deals
DROP POLICY IF EXISTS "Admins can delete deals" ON public.deals;
CREATE POLICY "Admins can delete deals" ON public.deals FOR DELETE TO authenticated USING (public.is_admin());