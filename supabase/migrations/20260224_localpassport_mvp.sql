-- =============================================================================
-- LocalPassport MVP+ Database Migration
-- Expand partners table + create deals and user_saved_vouchers tables
-- Created: 2026-02-24
-- =============================================================================
-- -----------------------------------------------------------------------------
-- Phase 1: Expand partners table (idempotent - safe to re-run)
-- -----------------------------------------------------------------------------
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS hours TEXT,
    ADD COLUMN IF NOT EXISTS latitude NUMERIC,
    ADD COLUMN IF NOT EXISTS longitude NUMERIC;
-- -----------------------------------------------------------------------------
-- Phase 2: Create deals table (ưu đãi cụ thể từ đối tác)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    discount_value TEXT,
    description TEXT,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for querying active deals by partner
CREATE INDEX IF NOT EXISTS idx_deals_partner_id ON deals(partner_id)
WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active)
WHERE is_active = true;
-- -----------------------------------------------------------------------------
-- Phase 3: Create user_saved_vouchers table
-- TODO: Nếu cần deal sử dụng nhiều lần, đổi sang id UUID PK
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_saved_vouchers (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    qr_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, deal_id)
);
-- Index for querying user's vouchers
CREATE INDEX IF NOT EXISTS idx_user_saved_vouchers_user_id ON user_saved_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_vouchers_deal_id ON user_saved_vouchers(deal_id);
-- -----------------------------------------------------------------------------
-- Phase 4: Enable RLS
-- -----------------------------------------------------------------------------
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_vouchers ENABLE ROW LEVEL SECURITY;
-- -----------------------------------------------------------------------------
-- Phase 5: RLS Policies for deals
-- -----------------------------------------------------------------------------
-- Everyone can read active deals
CREATE POLICY "deals_read_active" ON deals FOR
SELECT USING (is_active = true);
-- Admin can manage all deals
CREATE POLICY "deals_admin_all" ON deals FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- -----------------------------------------------------------------------------
-- Phase 6: RLS Policies for user_saved_vouchers
-- -----------------------------------------------------------------------------
-- Users can read their own vouchers
CREATE POLICY "vouchers_user_select" ON user_saved_vouchers FOR
SELECT USING (user_id = auth.uid());
-- Users can insert their own vouchers
CREATE POLICY "vouchers_user_insert" ON user_saved_vouchers FOR
INSERT WITH CHECK (user_id = auth.uid());
-- Users can delete their own vouchers
CREATE POLICY "vouchers_user_delete" ON user_saved_vouchers FOR DELETE USING (user_id = auth.uid());
-- -----------------------------------------------------------------------------
-- Phase 7: Seed Sample Data (partners + deals)
-- Note: Since partners table is empty, we create both in single transaction
-- -----------------------------------------------------------------------------
-- Insert sample partners
INSERT INTO partners (
        id,
        name,
        category,
        description,
        address,
        phone,
        email,
        hours,
        latitude,
        longitude,
        rating,
        status
    )
VALUES (
        'a1b2c3d4-0001-0001-0001-000000000001',
        'Highlands Coffee Quận 1',
        'coffee',
        'Thương hiệu cà phê Việt Nam với không gian hiện đại, phù hợp học tập và làm việc.',
        '92 Đường Lê Lai, Quận 1, TP.HCM',
        '028 3827 3333',
        'contact@highlandscoffee.com.vn',
        '07:00 - 22:00 hàng ngày',
        10.7865,
        106.6885,
        4.5,
        'active'
    ),
    (
        'a1b2c3d4-0002-0002-0002-000000000002',
        'The Coffee House',
        'coffee',
        'Cà phê specialty với không gian rộng rãi, máy lạnh mạnh, phù hợp sinh viên.',
        '123 Nguyễn Trãi, Quận 1, TP.HCM',
        '028 7300 6680',
        'info@thecoffeehouse.com',
        '07:00 - 21:00 hàng ngày',
        10.7872,
        106.6923,
        4.3,
        'active'
    ),
    (
        'a1b2c3d4-0003-0003-0003-000000000003',
        'CGV Cinemas',
        'entertainment',
        'Rạp chiếu phim hiện đại với nhiều cụm rạp trên khắp TP.HCM.',
        'Lotte Cinema District 7, TP.HCM',
        '1900 6023',
        'support@cgv.vn',
        '10:00 - 24:00 hàng ngày',
        10.7456,
        106.7234,
        4.6,
        'active'
    ),
    (
        'a1b2c3d4-0004-0004-0004-000000000004',
        'Fit24 Fitness',
        'fitness',
        'Phòng tập gym hiện đại với thiết bị nhập khẩu, huấn luyện viên chuyên nghiệp.',
        '56 Phạm Ngọc Thạch, Quận 3, TP.HCM',
        '028 3930 2424',
        'contact@fit24.vn',
        '05:30 - 23:00 hàng ngày',
        10.7825,
        106.6912,
        4.4,
        'active'
    ) ON CONFLICT (id) DO NOTHING;
-- Insert sample deals (linked to partners above)
INSERT INTO deals (
        partner_id,
        title,
        discount_value,
        description,
        valid_until,
        is_active
    )
VALUES (
        'a1b2c3d4-0001-0001-0001-000000000001',
        'Giảm 20% toàn menu',
        '20%',
        'Áp dụng cho tất cả đồ uống tại cửa hàng. Không áp dụng cho ngày lễ.',
        '2026-12-31 23:59:59+00',
        true
    ),
    (
        'a1b2c3d4-0001-0001-0001-000000000001',
        'Buy 1 Get 1 Free',
        'Mua 1 Tặng 1',
        'Áp dụng cho các loại trà trái cây. Chỉ áp dụng từ Thứ 2 - Thứ 5.',
        '2026-06-30 23:59:59+00',
        true
    ),
    (
        'a1b2c3d4-0002-0002-0002-000000000002',
        'Sinh viên giảm 15%',
        '15%',
        'Giảm 15% toàn bill cho sinh viên khi xuất trình thẻ sinh viên.',
        '2026-12-31 23:59:59+00',
        true
    ),
    (
        'a1b2c3d4-0003-0003-0003-000000000003',
        'Thứ 4 Movie Day',
        'Giảm 40%',
        'Giảm 40% giá vé chiếu phim thứ 4 hàng tuần. Áp dụng mọi suất chiếu.',
        '2026-12-31 23:59:59+00',
        true
    ),
    (
        'a1b2c3d4-0004-0004-0004-000000000004',
        'Miễn phí đăng ký thành viên',
        'Miễn phí',
        'Miễn phí phí đăng ký thành viên VIP trọn đời. Tặng 1 buổi tập miễn phí.',
        '2026-09-30 23:59:59+00',
        true
    ) ON CONFLICT DO NOTHING;