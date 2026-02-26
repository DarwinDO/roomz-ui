-- Remove duplicate admin policies from overlapping Phase 1 + LocalPassport migrations
-- NOTE: Individual CRUD policies are more explicit
-- deals: remove old ALL policy
DROP POLICY IF EXISTS "deals_admin_all" ON public.deals;
-- service_leads: remove old duplicates (keep the Phase 1 versions)
DROP POLICY IF EXISTS "Admin can view all service leads" ON public.service_leads;
DROP POLICY IF EXISTS "Admin can update all service leads" ON public.service_leads;
-- partners: remove old duplicate UPDATE
DROP POLICY IF EXISTS "Admins or Owners can update partners" ON public.partners;