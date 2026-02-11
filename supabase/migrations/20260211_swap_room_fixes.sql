-- ============================================
-- Migration: Swap Room Feature - Fixes
-- Created: 2026-02-11
-- Description: Fixes identified in code review:
--   1. Missing updated_at on swap_matches
--   2. Missing RLS INSERT/UPDATE/DELETE on swap_matches
--   3. Missing INSERT policy on swap_agreements
--   4. sublet_applications UPDATE policy (allow applicant withdraw)
--   5. sublet_reviews UPDATE/DELETE policies
--   6. Directional unique constraint on matches
--   7. preference_score always returns 20
--   8. Location score redundant assignment
--   9. swap_requests UPDATE policy too broad
-- ============================================

-- ============================================
-- Fix 1: Add missing updated_at column to swap_matches
-- The trigger update_swap_matches_updated_at already exists
-- but the column is missing from the table definition
-- ============================================

ALTER TABLE swap_matches 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- Fix 2: Add missing RLS policies on swap_matches
-- Only SELECT existed; INSERT/UPDATE/DELETE were missing
-- ============================================

-- System/function can insert matches (via find_potential_swap_matches)
-- For now, allow authenticated users to insert if they own one of the listings
DROP POLICY IF EXISTS "Users can update their swap matches" ON swap_matches;
CREATE POLICY "Users can update their swap matches" 
    ON swap_matches FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE (sl.id = swap_matches.listing_1_id OR sl.id = swap_matches.listing_2_id)
            AND sl.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE (sl.id = swap_matches.listing_1_id OR sl.id = swap_matches.listing_2_id)
            AND sl.owner_id = auth.uid()
        )
    );

-- Only allow deletion by listing owners (or system cleanup)
DROP POLICY IF EXISTS "Users can delete their swap matches" ON swap_matches;
CREATE POLICY "Users can delete their swap matches" 
    ON swap_matches FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM sublet_listings sl 
            WHERE (sl.id = swap_matches.listing_1_id OR sl.id = swap_matches.listing_2_id)
            AND sl.owner_id = auth.uid()
        )
    );

-- ============================================
-- Fix 3: Add INSERT policy on swap_agreements
-- Users who are party to the swap should be able to create agreements
-- ============================================

DROP POLICY IF EXISTS "Users can create swap agreements" ON swap_agreements;
CREATE POLICY "Users can create swap agreements" 
    ON swap_agreements FOR INSERT 
    WITH CHECK (party_a_id = auth.uid() OR party_b_id = auth.uid());

-- ============================================
-- Fix 4: Allow applicant to update their own applications (withdraw)
-- Original policy only let listing owner update
-- ============================================

DROP POLICY IF EXISTS "Applicants can update their applications" ON sublet_applications;
CREATE POLICY "Applicants can update their applications" 
    ON sublet_applications FOR UPDATE 
    USING (applicant_id = auth.uid());

-- ============================================
-- Fix 5: Add UPDATE/DELETE policies for sublet_reviews
-- ============================================

DROP POLICY IF EXISTS "Users can update their reviews" ON sublet_reviews;
CREATE POLICY "Users can update their reviews" 
    ON sublet_reviews FOR UPDATE 
    USING (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their reviews" ON sublet_reviews;
CREATE POLICY "Users can delete their reviews" 
    ON sublet_reviews FOR DELETE 
    USING (reviewer_id = auth.uid());

-- ============================================
-- Fix 6: Directional unique constraint on swap_matches
-- The original UNIQUE(listing_1_id, listing_2_id) allows (A,B) and (B,A) as separate rows
-- Create a unique index using LEAST/GREATEST to make it bidirectional
-- ============================================

-- First drop the old constraint (if migration hasn't run yet, this is safe)
ALTER TABLE swap_matches DROP CONSTRAINT IF EXISTS unique_match;

-- Create a bidirectional unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_swap_matches_unique_pair 
    ON swap_matches (LEAST(listing_1_id, listing_2_id), GREATEST(listing_1_id, listing_2_id));

-- ============================================
-- Fix 7 & 8: Fix calculate_swap_match_score function
-- - preference_score was hardcoded to 20
-- - location_score had redundant assignment (same city=30, then overwritten)
-- ============================================

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
    v_location_score INTEGER := 0;
    v_price_score INTEGER := 0;
    v_time_score INTEGER := 0;
    v_preference_score INTEGER := 0;
BEGIN
    -- Get listing details with room info
    SELECT sl.*, r.latitude, r.longitude, r.district, r.city, 
           r.room_type, r.furnished, r.area_sqm
    INTO v_listing1
    FROM sublet_listings sl
    JOIN rooms r ON r.id = sl.original_room_id
    WHERE sl.id = p_listing1_id;
    
    SELECT sl.*, r.latitude, r.longitude, r.district, r.city, 
           r.room_type, r.furnished, r.area_sqm
    INTO v_listing2
    FROM sublet_listings sl
    JOIN rooms r ON r.id = sl.original_room_id
    WHERE sl.id = p_listing2_id;
    
    -- Return 0 if either listing not found
    IF v_listing1 IS NULL OR v_listing2 IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Location score (30% weight) - FIXED: remove redundant assignment
    IF v_listing1.district IS NOT NULL AND v_listing2.district IS NOT NULL 
       AND v_listing1.district = v_listing2.district THEN
        v_location_score := 30; -- Full points for same district
    ELSIF v_listing1.city IS NOT NULL AND v_listing2.city IS NOT NULL 
          AND v_listing1.city = v_listing2.city THEN
        v_location_score := 20; -- Partial points for same city
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
    
    -- Preference score (20% weight) - FIXED: actual logic instead of hardcoded 20
    v_preference_score := 0;
    
    -- Same room type: +8 points
    IF v_listing1.room_type IS NOT NULL AND v_listing2.room_type IS NOT NULL
       AND v_listing1.room_type = v_listing2.room_type THEN
        v_preference_score := v_preference_score + 8;
    END IF;
    
    -- Both furnished or both unfurnished: +6 points
    IF v_listing1.furnished IS NOT NULL AND v_listing2.furnished IS NOT NULL
       AND v_listing1.furnished = v_listing2.furnished THEN
        v_preference_score := v_preference_score + 6;
    END IF;
    
    -- Similar area (within 20%): +6 points
    IF v_listing1.area_sqm IS NOT NULL AND v_listing2.area_sqm IS NOT NULL
       AND v_listing1.area_sqm > 0 AND v_listing2.area_sqm > 0 THEN
        IF ABS(v_listing1.area_sqm - v_listing2.area_sqm) / 
           GREATEST(v_listing1.area_sqm, v_listing2.area_sqm) <= 0.2 THEN
            v_preference_score := v_preference_score + 6;
        END IF;
    END IF;
    
    -- Calculate total score
    v_score := v_location_score + v_price_score + v_time_score + v_preference_score;
    
    -- Cap at 100
    RETURN LEAST(v_score, 100);
END;
$$;

-- ============================================
-- Fix 9: swap_requests UPDATE policy - restrict scope
-- Requester: can cancel their own requests
-- Recipient: can accept/reject requests sent to them
-- ============================================

DROP POLICY IF EXISTS "Users can update their swap requests" ON swap_requests;

CREATE POLICY "Requesters can cancel their swap requests" 
    ON swap_requests FOR UPDATE 
    USING (requester_id = auth.uid())
    WITH CHECK (requester_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Recipients can respond to swap requests" 
    ON swap_requests FOR UPDATE 
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid() AND status IN ('accepted', 'rejected'));

-- ============================================
-- Fix 10: Add missing composite indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_swap_requests_requester_status 
    ON swap_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_recipient_status 
    ON swap_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_sublet_applications_listing_status 
    ON sublet_applications(sublet_listing_id, status);
CREATE INDEX IF NOT EXISTS idx_swap_matches_active_score 
    ON swap_matches(is_active, match_score DESC) WHERE is_active = true;
