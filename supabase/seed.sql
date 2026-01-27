-- Seed Data for Testing
-- Date: 2026-01-26

-- 1. Create/Ensure Test Users (Idempotent check ideally, but we'll assume basic users exist or create placeholders if needed. 
-- Ideally we use existing users. Let's try to select some IDs.)

-- We'll use a DO block to fetch some IDs to link data to.
DO $$
DECLARE
    v_renter_id UUID;
    v_landlord_id UUID;
    v_room_id UUID;
    v_partner_id UUID;
    v_conversation_id UUID;
BEGIN
    -- Get or Create Renter (Student)
    SELECT id INTO v_renter_id FROM users WHERE role = 'student' LIMIT 1;
    IF v_renter_id IS NULL THEN
        -- Fallback: Create one if none exists (though UI usually has one)
        -- We won't insert users here to avoid Auth conflict, assume they exist or use current user in real testing.
        -- But for seed script to run standalone, we might need to skip if empty.
        RAISE NOTICE 'No student user found, skipping renter-related seed.';
    END IF;

    -- Get or Create Landlord
    SELECT id INTO v_landlord_id FROM users WHERE role = 'landlord' LIMIT 1;
    
    -- Get Room
    SELECT id INTO v_room_id FROM rooms WHERE landlord_id = v_landlord_id LIMIT 1;

    -- SEED PARTNERS (Independent)
    INSERT INTO partners (name, category, specialization, discount, rating, review_count, status, image_url, contact_info)
    VALUES 
    ('NhanhMove Express', 'moving', 'Chuyển nhà trọn gói', 'Giảm 15% cho sinh viên', 4.9, 342, 'active', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', '{"phone": "0901234567", "email": "contact@nhanhmove.com", "address": "123 Main St"}'::jsonb),
    ('SạchPlus', 'cleaning', 'Vệ sinh công nghiệp', 'Giảm 10% lần đầu', 4.8, 267, 'active', 'https://images.unsplash.com/photo-1581578731117-104f8a746950?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', '{"phone": "0909998887", "email": "info@sachplus.vn"}'::jsonb),
    ('GymFit Student', 'gym', 'Phòng tập thể hình', 'Chỉ 200k/tháng', 4.7, 150, 'active', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', '{"phone": "0912345678"}'::jsonb)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_partner_id;

    -- SEED BOOKINGS (If we have users and room)
    IF v_renter_id IS NOT NULL AND v_landlord_id IS NOT NULL AND v_room_id IS NOT NULL THEN
        INSERT INTO bookings (room_id, renter_id, landlord_id, booking_date, status, note)
        VALUES 
        (v_room_id, v_renter_id, v_landlord_id, NOW() + INTERVAL '2 days', 'pending', 'Em muốn xem phòng vào chiều thứ 5 ạ.'),
        (v_room_id, v_renter_id, v_landlord_id, NOW() - INTERVAL '5 days', 'completed', 'Đã xem xong, phòng đẹp.')
        ON CONFLICT DO NOTHING;
        
        -- SEED NOTIFICATIONS
        INSERT INTO notifications (user_id, type, title, content, is_read)
        VALUES 
        (v_renter_id, 'booking_status', 'Booking Confirmed', 'Lịch xem phòng của bạn đã được xác nhận.', false),
        (v_landlord_id, 'booking_request', 'New Booking Request', 'Có yêu cầu xem phòng mới từ sinh viên.', false);

        -- SEED CONVERSATION
        INSERT INTO conversations (created_at) VALUES (DEFAULT) RETURNING id INTO v_conversation_id;
        
        IF v_conversation_id IS NOT NULL THEN
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (v_conversation_id, v_renter_id), (v_conversation_id, v_landlord_id);
            
            INSERT INTO messages (conversation_id, sender_id, content) -- is_read default false
            VALUES 
            (v_conversation_id, v_renter_id, 'Chào anh/chị, phòng còn trống không ạ?'),
            (v_conversation_id, v_landlord_id, 'Chào em, phòng vẫn còn nhé. Em muốn qua xem lúc nào?');
        END IF;

        -- SEED REVIEWS
        INSERT INTO reviews (reviewer_id, room_id, rating, comment)
        VALUES (v_renter_id, v_room_id, 5, 'Phòng sạch đẹp, chủ nhà thân thiện.');

        -- Seed Partner Review (using same user)
        IF v_partner_id IS NOT NULL THEN
            INSERT INTO reviews (reviewer_id, partner_id, rating, comment)
            VALUES (v_renter_id, v_partner_id, 4, 'Dịch vụ tốt, giá hợp lý.');
        END IF;

    END IF;
END $$;
