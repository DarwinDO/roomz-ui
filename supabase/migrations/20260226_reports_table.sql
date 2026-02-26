-- Reports table for user/room reporting system
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_id UUID NOT NULL,
    reported_type TEXT NOT NULL CHECK (reported_type IN ('user', 'room')),
    type TEXT NOT NULL CHECK (
        type IN ('spam', 'fraud', 'inappropriate', 'other')
    ),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'investigating',
            'resolved',
            'dismissed'
        )
    ),
    description TEXT,
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- Admin full access
CREATE POLICY "Admins can manage reports" ON reports FOR ALL TO authenticated USING (public.is_admin());
-- Users can create reports
CREATE POLICY "Users can create reports" ON reports FOR
INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
-- Users can view own reports
CREATE POLICY "Users can view own reports" ON reports FOR
SELECT TO authenticated USING (auth.uid() = reporter_id);