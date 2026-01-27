-- Migration: Add missing features (Bookings, Chat, Reviews, Notifications, Partners)
-- Date: 2026-01-26

-- 1. Create Enums
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
CREATE TYPE notification_type AS ENUM ('booking_request', 'booking_status', 'new_message', 'system', 'verification');

-- 2. Drop existing tables if they exist (to ensure fresh schema match)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;

-- 3. Create Tables

-- BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Denormalized for query optimization
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CHAT: Conversations & Messages
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTNERS
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable ownership
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Flexible text as requested
    specialization TEXT,
    discount TEXT,
    rating NUMERIC(2, 1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    image_url TEXT,
    contact_info JSONB DEFAULT '{}'::jsonb,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REVIEWS (Better Referential Integrity than polymorphic id)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    reviewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure exactly one target is set
    CONSTRAINT check_single_target CHECK (
        (room_id IS NOT NULL)::int +
        (reviewed_user_id IS NOT NULL)::int +
        (partner_id IS NOT NULL)::int = 1
    )
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- BOOKINGS Policies
-- Renter can insert
CREATE POLICY "Renters can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);
-- Renter can view own
CREATE POLICY "Renters can view own bookings" ON bookings FOR SELECT USING (auth.uid() = renter_id);
-- Landlord can view bookings for them
CREATE POLICY "Landlords can view bookings assigned to them" ON bookings FOR SELECT USING (auth.uid() = landlord_id);
-- Landlord can update status
CREATE POLICY "Landlords can update booking status" ON bookings FOR UPDATE USING (auth.uid() = landlord_id);
-- Admins can view all (assuming admin role check function exists, or verify via public.users role)
-- Simplification: If user is admin in public.users
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- CONVERSATIONS & MESSAGES Policies
-- Participants can view conversations
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);
-- Participants can insert messages
CREATE POLICY "Participants can insert messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversation_id AND user_id = auth.uid()) 
    AND sender_id = auth.uid()
);
-- Participants can view messages
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversation_id AND user_id = auth.uid())
);

-- PARTNERS Policies
-- Public read
CREATE POLICY "Public read partners" ON partners FOR SELECT USING (true);
-- Admin write
CREATE POLICY "Admins can insert partners" ON partners FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins or Owners can update partners" ON partners FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')) OR 
    (user_id = auth.uid())
);
-- Owner insert (optional, maybe only admins create, but owner can update?)
-- Let's allow users to register (create) if logic permits, but mostly Admins create. 
-- Plan said: "Admin write only" initially, then "Partners can update own".
-- We'll allow Insert if Admin.

-- REVIEWS Policies
-- Public read
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
-- Authenticated insert
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
-- Users can update/delete own
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- NOTIFICATIONS Policies
-- Users view own
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
-- System triggers insert (usually via Service Role, but allowed for logic)
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true); -- Usually restricted, but needed for client-side triggered notifs if api logic uses user token. Ideally DB triggers handle this.

-- 5. Indexes for Performance
CREATE INDEX idx_bookings_renter ON bookings(renter_id);
CREATE INDEX idx_bookings_landlord ON bookings(landlord_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);

CREATE INDEX idx_reviews_room ON reviews(room_id);
CREATE INDEX idx_reviews_partner ON reviews(partner_id);
CREATE INDEX idx_reviews_user ON reviews(reviewed_user_id);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
