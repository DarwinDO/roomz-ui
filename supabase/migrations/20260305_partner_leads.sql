-- =============================================================================
-- Partner Leads Table Migration
-- Bảng lưu thông tin đăng ký đối tác từ form "Trở thành đối tác"
-- Created: 2026-03-05
-- =============================================================================
-- -----------------------------------------------------------------------------
-- Phase 1: Create partner_leads table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_area TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'contacted', 'approved', 'rejected')
    ),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- -----------------------------------------------------------------------------
-- Phase 2: Create indexes
-- -----------------------------------------------------------------------------
-- Index for querying by email (unique check)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_leads_email ON partner_leads(email);
-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_partner_leads_status ON partner_leads(status)
WHERE status = 'pending';
-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_partner_leads_created_at ON partner_leads(created_at DESC);
-- -----------------------------------------------------------------------------
-- Phase 3: Enable RLS
-- -----------------------------------------------------------------------------
ALTER TABLE partner_leads ENABLE ROW LEVEL SECURITY;
-- -----------------------------------------------------------------------------
-- Phase 4: RLS Policies
-- -----------------------------------------------------------------------------
-- Anonymous users can insert new leads (for the signup form)
CREATE POLICY "partner_leads_insert_anonymous" ON partner_leads FOR
INSERT WITH CHECK (true);
-- Only admins can view all leads
CREATE POLICY "partner_leads_admin_select" ON partner_leads FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
-- Only admins can update leads
CREATE POLICY "partner_leads_admin_update" ON partner_leads FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
-- Only admins can delete leads
CREATE POLICY "partner_leads_admin_delete" ON partner_leads FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- -----------------------------------------------------------------------------
-- Phase 5: Create updated_at trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_partner_leads_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS partner_leads_updated_at_trigger ON partner_leads;
CREATE TRIGGER partner_leads_updated_at_trigger BEFORE
UPDATE ON partner_leads FOR EACH ROW EXECUTE FUNCTION update_partner_leads_updated_at();
