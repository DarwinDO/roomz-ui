-- ============================================
-- Add Missing FK Indexes for Performance
-- Date: 2026-03-10
-- ============================================

-- Only add FK indexes that are still missing in production.

-- Community posts
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);

-- Community comments
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);

-- Service leads
CREATE INDEX IF NOT EXISTS idx_service_leads_user_id ON service_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_service_leads_partner_id ON service_leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_service_leads_assigned_by ON service_leads(assigned_by);

-- Sublet listings
CREATE INDEX IF NOT EXISTS idx_sublet_listings_original_room_id ON sublet_listings(original_room_id);

-- Swap requests
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester_listing_id ON swap_requests(requester_listing_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_recipient_listing_id ON swap_requests(recipient_listing_id);
