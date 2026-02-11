-- ============================================
-- Migration: Swap Room Feature
-- Created: 2026-02-11
-- Description: Full schema for Swap Room functionality
-- ============================================

-- ============================================
-- Step 1: Add new enum values to notification_type
-- ============================================
DO $$
BEGIN
    -- Check if values exist before adding
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sublet_request' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE 'sublet_request';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sublet_approved' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE 'sublet_approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'swap_match' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE 'swap_match';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'swap_request' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE 'swap_request';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'swap_confirmed' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE 'swap_confirmed';
    END IF;
END $$;

-- ============================================
-- Step 2: Create sublet_listings table
-- ============================================
CREATE TABLE IF NOT EXISTS sublet_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Thờ gian cho thuê
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Giá cả
    original_price DECIMAL(10,2) NOT NULL,
    sublet_price DECIMAL(10,2) NOT NULL,
    deposit_required DECIMAL(10,2) DEFAULT 0,
    
    -- Mô tả và yêu cầu
    description TEXT,
    requirements TEXT[] DEFAULT '{}',
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('draft', 'pending', 'active', 'booked', 'completed', 'cancelled')),
    
    -- Thống kê
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Validation constraints
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_price CHECK (sublet_price > 0),
    CONSTRAINT max_duration CHECK (end_date <= start_date + INTERVAL '6 months'),
    CONSTRAINT price_increase_limit CHECK (sublet_price <= original_price * 1.2)
);

-- Indexes for sublet_listings
CREATE INDEX IF NOT EXISTS idx_sublet_listings_status ON sublet_listings(status);
CREATE INDEX IF NOT EXISTS idx_sublet_listings_owner ON sublet_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_sublet_listings_dates ON sublet_listings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sublet_listings_price ON sublet_listings(sublet_price);
CREATE INDEX IF NOT EXISTS idx_sublet_listings_created ON sublet_listings(created_at DESC);

-- ============================================
-- Step 3: Create swap_requests table
-- ============================================
CREATE TABLE IF NOT EXISTS swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ngườ gửi yêu cầu
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    
    -- Ngườ nhận yêu cầu
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    
    -- Nội dung
    message TEXT,
    proposed_start_date DATE NOT NULL,
    proposed_end_date DATE NOT NULL,
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating', 'confirmed', 'completed', 'cancelled')),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Metadata
    rejection_reason TEXT,
    cancellation_reason TEXT,
    
    -- Constraints
    CONSTRAINT different_users CHECK (requester_id != recipient_id),
    CONSTRAINT different_listings CHECK (requester_listing_id != recipient_listing_id)
);

-- Indexes for swap_requests
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_recipient ON swap_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_expires ON swap_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_swap_requests_created ON swap_requests(created_at DESC);

-- ============================================
-- Step 4: Create swap_matches table
-- ============================================
CREATE TABLE IF NOT EXISTS swap_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    listing_1_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    listing_2_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    
    -- Điểm tương đồng (0-100)
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    
    -- Chi tiết điểm
    location_score INTEGER CHECK (location_score >= 0 AND location_score <= 100),
    price_score INTEGER CHECK (price_score >= 0 AND price_score <= 100),
    time_score INTEGER CHECK (time_score >= 0 AND time_score <= 100),
    preference_score INTEGER CHECK (preference_score >= 0 AND preference_score <= 100),
    
    -- Lý do match
    match_reasons TEXT[] DEFAULT '{}',
    
    -- Trạng thái
    is_active BOOLEAN DEFAULT true,
    shown_to_user1 BOOLEAN DEFAULT false,
    shown_to_user2 BOOLEAN DEFAULT false,
    user1_swiped BOOLEAN,
    user2_swiped BOOLEAN,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT different_match_listings CHECK (listing_1_id != listing_2_id),
    CONSTRAINT unique_match UNIQUE (listing_1_id, listing_2_id)
);

-- Indexes for swap_matches
CREATE INDEX IF NOT EXISTS idx_swap_matches_score ON swap_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_swap_matches_listing1 ON swap_matches(listing_1_id);
CREATE INDEX IF NOT EXISTS idx_swap_matches_listing2 ON swap_matches(listing_2_id);
CREATE INDEX IF NOT EXISTS idx_swap_matches_active ON swap_matches(is_active, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_swap_matches_expires ON swap_matches(expires_at);

-- ============================================
-- Step 5: Create sublet_applications table
-- ============================================
CREATE TABLE IF NOT EXISTS sublet_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    sublet_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Thông tin đăng ký
    message TEXT,
    preferred_move_in_date DATE NOT NULL,
    preferred_move_out_date DATE,
    
    -- Tài liệu
    documents JSONB DEFAULT '[]',
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn', 'expired')),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
    
    -- Constraints
    CONSTRAINT unique_application UNIQUE (sublet_listing_id, applicant_id)
);

-- Indexes for sublet_applications
CREATE INDEX IF NOT EXISTS idx_sublet_applications_listing ON sublet_applications(sublet_listing_id);
CREATE INDEX IF NOT EXISTS idx_sublet_applications_applicant ON sublet_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_sublet_applications_status ON sublet_applications(status);
CREATE INDEX IF NOT EXISTS idx_sublet_applications_expires ON sublet_applications(expires_at);

-- ============================================
-- Step 6: Create swap_agreements table
-- ============================================
CREATE TABLE IF NOT EXISTS swap_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Bên A
    party_a_id UUID NOT NULL REFERENCES users(id),
    party_a_listing_id UUID NOT NULL REFERENCES sublet_listings(id),
    party_a_signed_at TIMESTAMP WITH TIME ZONE,
    party_a_signature_url TEXT,
    
    -- Bên B
    party_b_id UUID NOT NULL REFERENCES users(id),
    party_b_listing_id UUID NOT NULL REFERENCES sublet_listings(id),
    party_b_signed_at TIMESTAMP WITH TIME ZONE,
    party_b_signature_url TEXT,
    
    -- Điều khoản
    terms JSONB NOT NULL DEFAULT '{}',
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_signatures', 'active', 'completed', 'terminated')),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Phí
    platform_fee DECIMAL(10,2),
    fee_paid_by UUID REFERENCES users(id),
    fee_paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for swap_agreements
CREATE INDEX IF NOT EXISTS idx_swap_agreements_request ON swap_agreements(swap_request_id);
CREATE INDEX IF NOT EXISTS idx_swap_agreements_party_a ON swap_agreements(party_a_id);
CREATE INDEX IF NOT EXISTS idx_swap_agreements_party_b ON swap_agreements(party_b_id);
CREATE INDEX IF NOT EXISTS idx_swap_agreements_status ON swap_agreements(status);

-- ============================================
-- Step 7: Create sublet_reviews table
-- ============================================
CREATE TABLE IF NOT EXISTS sublet_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    sublet_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Đánh giá
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    
    -- Nội dung
    comment TEXT,
    would_recommend BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_review UNIQUE (sublet_listing_id, reviewer_id),
    CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

-- Indexes for sublet_reviews
CREATE INDEX IF NOT EXISTS idx_sublet_reviews_listing ON sublet_reviews(sublet_listing_id);
CREATE INDEX IF NOT EXISTS idx_sublet_reviews_reviewee ON sublet_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_sublet_reviews_reviewer ON sublet_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_sublet_reviews_rating ON sublet_reviews(overall_rating);

-- ============================================
-- Step 8: Enable RLS and create policies
-- ============================================

-- sublet_listings RLS
ALTER TABLE sublet_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sublet listings are viewable by everyone" ON sublet_listings;
CREATE POLICY "Sublet listings are viewable by everyone" 
    ON sublet_listings FOR SELECT 
    USING (status = 'active' OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own sublet listings" ON sublet_listings;
CREATE POLICY "Users can create their own sublet listings" 
    ON sublet_listings FOR INSERT 
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own sublet listings" ON sublet_listings;
CREATE POLICY "Users can update their own sublet listings" 
    ON sublet_listings FOR UPDATE 
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own sublet listings" ON sublet_listings;
CREATE POLICY "Users can delete their own sublet listings" 
    ON sublet_listings FOR DELETE 
    USING (owner_id = auth.uid());

-- swap_requests RLS
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own swap requests" ON swap_requests;
CREATE POLICY "Users can view their own swap requests" 
    ON swap_requests FOR SELECT 
    USING (requester_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can create swap requests" ON swap_requests;
CREATE POLICY "Users can create swap requests" 
    ON swap_requests FOR INSERT 
    WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their swap requests" ON swap_requests;
CREATE POLICY "Users can update their swap requests" 
    ON swap_requests FOR UPDATE 
    USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- swap_matches RLS
ALTER TABLE swap_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their swap matches" ON swap_matches;
CREATE POLICY "Users can view their swap matches" 
    ON swap_matches FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE sl.id = swap_matches.listing_1_id 
            AND sl.owner_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE sl.id = swap_matches.listing_2_id 
            AND sl.owner_id = auth.uid()
        )
    );

-- sublet_applications RLS
ALTER TABLE sublet_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view applications" ON sublet_applications;
CREATE POLICY "Users can view applications" 
    ON sublet_applications FOR SELECT 
    USING (
        applicant_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE sl.id = sublet_applications.sublet_listing_id 
            AND sl.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create applications" ON sublet_applications;
CREATE POLICY "Users can create applications" 
    ON sublet_applications FOR INSERT 
    WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Listing owners can update applications" ON sublet_applications;
CREATE POLICY "Listing owners can update applications" 
    ON sublet_applications FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE sl.id = sublet_applications.sublet_listing_id 
            AND sl.owner_id = auth.uid()
        )
    );

-- swap_agreements RLS
ALTER TABLE swap_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their agreements" ON swap_agreements;
CREATE POLICY "Users can view their agreements" 
    ON swap_agreements FOR SELECT 
    USING (party_a_id = auth.uid() OR party_b_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their agreements" ON swap_agreements;
CREATE POLICY "Users can update their agreements" 
    ON swap_agreements FOR UPDATE 
    USING (party_a_id = auth.uid() OR party_b_id = auth.uid());

-- sublet_reviews RLS
ALTER TABLE sublet_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON sublet_reviews;
CREATE POLICY "Reviews are viewable by everyone" 
    ON sublet_reviews FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can create their reviews" ON sublet_reviews;
CREATE POLICY "Users can create their reviews" 
    ON sublet_reviews FOR INSERT 
    WITH CHECK (reviewer_id = auth.uid());

-- ============================================
-- Step 9: Create helper functions
-- ============================================

-- Function to calculate swap match score
CREATE OR REPLACE FUNCTION calculate_swap_match_score(
    p_listing1_id UUID,
    p_listing2_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_score INTEGER := 0;
    v_listing1 RECORD;
    v_listing2 RECORD;
    v_room1 RECORD;
    v_room2 RECORD;
    v_location_score INTEGER := 0;
    v_price_score INTEGER := 0;
    v_time_score INTEGER := 0;
    v_preference_score INTEGER := 0;
BEGIN
    -- Get listing details
    SELECT sl.*, r.latitude, r.longitude, r.district, r.city
    INTO v_listing1
    FROM sublet_listings sl
    JOIN rooms r ON r.id = sl.original_room_id
    WHERE sl.id = p_listing1_id;
    
    SELECT sl.*, r.latitude, r.longitude, r.district, r.city
    INTO v_listing2
    FROM sublet_listings sl
    JOIN rooms r ON r.id = sl.original_room_id
    WHERE sl.id = p_listing2_id;
    
    -- Return 0 if either listing not found
    IF v_listing1 IS NULL OR v_listing2 IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Location score (30% weight) - based on district/city match
    IF v_listing1.city = v_listing2.city THEN
        v_location_score := 30;
        IF v_listing1.district = v_listing2.district THEN
            v_location_score := 30; -- Full points for same district
        ELSE
            v_location_score := 20; -- Partial points for same city
        END IF;
    ELSE
        v_location_score := 10; -- Minimal points for different city
    END IF;
    
    -- Price score (25% weight) - lower difference = higher score
    DECLARE
        v_price_diff DECIMAL;
        v_max_price DECIMAL;
    BEGIN
        v_max_price := GREATEST(v_listing1.sublet_price, v_listing2.sublet_price);
        IF v_max_price > 0 THEN
            v_price_diff := ABS(v_listing1.sublet_price - v_listing2.sublet_price) / v_max_price;
            v_price_score := GREATEST(0, 25 - (v_price_diff * 25)::INTEGER);
        END IF;
    END;
    
    -- Time overlap score (25% weight)
    DECLARE
        v_overlap_start DATE;
        v_overlap_end DATE;
        v_overlap_days INTEGER;
        v_duration1 INTEGER;
        v_duration2 INTEGER;
        v_max_overlap INTEGER;
    BEGIN
        v_overlap_start := GREATEST(v_listing1.start_date, v_listing2.start_date);
        v_overlap_end := LEAST(v_listing1.end_date, v_listing2.end_date);
        
        IF v_overlap_end >= v_overlap_start THEN
            v_overlap_days := v_overlap_end - v_overlap_start;
            v_duration1 := v_listing1.end_date - v_listing1.start_date;
            v_duration2 := v_listing2.end_date - v_listing2.start_date;
            v_max_overlap := LEAST(v_duration1, v_duration2);
            
            IF v_max_overlap > 0 THEN
                v_time_score := (v_overlap_days::FLOAT / v_max_overlap * 25)::INTEGER;
            END IF;
        END IF;
    END;
    
    -- Preference score (20% weight) - based on similar requirements
    v_preference_score := 20; -- Default good score
    
    -- Calculate total score
    v_score := v_location_score + v_price_score + v_time_score + v_preference_score;
    
    -- Cap at 100
    RETURN LEAST(v_score, 100);
END;
$$;

-- Function to find potential swap matches
CREATE OR REPLACE FUNCTION find_potential_swap_matches(
    p_listing_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    match_id UUID,
    listing_id UUID,
    match_score INTEGER,
    match_reasons TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        CASE 
            WHEN sm.listing_1_id = p_listing_id THEN sm.listing_2_id
            ELSE sm.listing_1_id
        END,
        sm.match_score,
        sm.match_reasons
    FROM swap_matches sm
    WHERE (sm.listing_1_id = p_listing_id OR sm.listing_2_id = p_listing_id)
        AND sm.is_active = true
        AND sm.match_score >= 60
    ORDER BY sm.match_score DESC
    LIMIT p_limit;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_sublet_view_count(p_sublet_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sublet_listings
    SET view_count = view_count + 1
    WHERE id = p_sublet_id;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_sublet_listings_updated_at ON sublet_listings;
CREATE TRIGGER update_sublet_listings_updated_at
    BEFORE UPDATE ON sublet_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_swap_requests_updated_at ON swap_requests;
CREATE TRIGGER update_swap_requests_updated_at
    BEFORE UPDATE ON swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_swap_matches_updated_at ON swap_matches;
CREATE TRIGGER update_swap_matches_updated_at
    BEFORE UPDATE ON swap_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sublet_applications_updated_at ON sublet_applications;
CREATE TRIGGER update_sublet_applications_updated_at
    BEFORE UPDATE ON sublet_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sublet_reviews_updated_at ON sublet_reviews;
CREATE TRIGGER update_sublet_reviews_updated_at
    BEFORE UPDATE ON sublet_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 10: Create view for active sublets with room details
-- ============================================
CREATE OR REPLACE VIEW active_sublet_listings_view AS
SELECT 
    sl.*,
    r.title as room_title,
    r.address,
    r.district,
    r.city,
    r.area_sqm,
    r.bedroom_count,
    r.bathroom_count,
    r.furnished,
    r.latitude,
    r.longitude,
    r.room_type,
    u.full_name as owner_name,
    u.avatar_url as owner_avatar,
    u.is_verified as owner_verified,
    (
        SELECT json_agg(
            json_build_object(
                'image_url', ri.image_url,
                'is_primary', ri.is_primary,
                'display_order', ri.display_order
            )
        )
        FROM room_images ri
        WHERE ri.room_id = sl.original_room_id
    ) as images
FROM sublet_listings sl
JOIN rooms r ON r.id = sl.original_room_id
JOIN users u ON u.id = sl.owner_id
WHERE sl.status = 'active';

-- Comment describing the migration
COMMENT ON TABLE sublet_listings IS 'Tin đăng cho thuê lại phòng';
COMMENT ON TABLE swap_requests IS 'Yêu cầu hoán đổi phòng';
COMMENT ON TABLE swap_matches IS 'Gợi ý match hoán đổi';
COMMENT ON TABLE sublet_applications IS 'Đơn đăng ký thuê phòng sublet';
COMMENT ON TABLE swap_agreements IS 'Hợp đồng hoán đổi đã ký kết';
COMMENT ON TABLE sublet_reviews IS 'Đánh giá sau khi kết thúc sublet';
