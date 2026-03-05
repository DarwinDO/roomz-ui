export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            app_configs: {
                Row: {
                    description: string | null
                    key: string
                    updated_at: string | null
                    value: string
                }
                Insert: {
                    description?: string | null
                    key: string
                    updated_at?: string | null
                    value: string
                }
                Update: {
                    description?: string | null
                    key?: string
                    updated_at?: string | null
                    value?: string
                }
                Relationships: []
            }
            bookings: {
                Row: {
                    booking_date: string
                    created_at: string | null
                    id: string
                    landlord_id: string
                    note: string | null
                    renter_id: string
                    room_id: string
                    status: Database["public"]["Enums"]["booking_status"] | null
                    updated_at: string | null
                }
                Insert: {
                    booking_date: string
                    created_at?: string | null
                    id?: string
                    landlord_id: string
                    note?: string | null
                    renter_id: string
                    room_id: string
                    status?: Database["public"]["Enums"]["booking_status"] | null
                    updated_at?: string | null
                }
                Update: {
                    booking_date?: string
                    created_at?: string | null
                    id?: string
                    landlord_id?: string
                    note?: string | null
                    renter_id?: string
                    room_id?: string
                    status?: Database["public"]["Enums"]["booking_status"] | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "bookings_landlord_id_fkey"
                        columns: ["landlord_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_renter_id_fkey"
                        columns: ["renter_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            community_comments: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    parent_id: string | null
                    post_id: string
                    status: string
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    parent_id?: string | null
                    post_id: string
                    status?: string
                    user_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    parent_id?: string | null
                    post_id?: string
                    status?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "community_comments_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "community_comments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "community_comments_post_id_fkey"
                        columns: ["post_id"]
                        isOneToOne: false
                        referencedRelation: "community_posts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "community_comments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            community_likes: {
                Row: {
                    created_at: string | null
                    post_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    post_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    post_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "community_likes_post_id_fkey"
                        columns: ["post_id"]
                        isOneToOne: false
                        referencedRelation: "community_posts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "community_likes_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            community_posts: {
                Row: {
                    comments_count: number | null
                    content: string
                    created_at: string | null
                    id: string
                    images: string[] | null
                    likes_count: number | null
                    status: string
                    title: string
                    type: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    comments_count?: number | null
                    content: string
                    created_at?: string | null
                    id?: string
                    images?: string[] | null
                    likes_count?: number | null
                    status?: string
                    title: string
                    type: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    comments_count?: number | null
                    content?: string
                    created_at?: string | null
                    id?: string
                    images?: string[] | null
                    likes_count?: number | null
                    status?: string
                    title?: string
                    type?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "community_posts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            community_reports: {
                Row: {
                    created_at: string | null
                    id: string
                    post_id: string
                    reason: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    post_id: string
                    reason: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    post_id?: string
                    reason?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "community_reports_post_id_fkey"
                        columns: ["post_id"]
                        isOneToOne: false
                        referencedRelation: "community_posts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "community_reports_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            compatibility_answers: {
                Row: {
                    answer_value: string
                    created_at: string | null
                    id: string
                    question_id: number
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    answer_value: string
                    created_at?: string | null
                    id?: string
                    question_id: number
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    answer_value?: string
                    created_at?: string | null
                    id?: string
                    question_id?: number
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "compatibility_answers_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            conversation_participants: {
                Row: {
                    conversation_id: string
                    last_read_at: string | null
                    user_id: string
                }
                Insert: {
                    conversation_id: string
                    last_read_at?: string | null
                    user_id: string
                }
                Update: {
                    conversation_id?: string
                    last_read_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "conversation_participants_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "conversation_participants_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            conversations: {
                Row: {
                    created_at: string | null
                    id: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            deals: {
                Row: {
                    created_at: string | null
                    description: string | null
                    discount_value: string | null
                    id: string
                    is_active: boolean | null
                    is_premium_only: boolean | null
                    partner_id: string | null
                    title: string
                    updated_at: string | null
                    valid_until: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    discount_value?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_premium_only?: boolean | null
                    partner_id?: string | null
                    title: string
                    updated_at?: string | null
                    valid_until?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    discount_value?: string | null
                    id?: string
                    is_active?: boolean | null
                    is_premium_only?: boolean | null
                    partner_id?: string | null
                    title?: string
                    updated_at?: string | null
                    valid_until?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "deals_partner_id_fkey"
                        columns: ["partner_id"]
                        isOneToOne: false
                        referencedRelation: "partners"
                        referencedColumns: ["id"]
                    },
                ]
            }
            favorites: {
                Row: {
                    created_at: string | null
                    id: string
                    room_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    room_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    room_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "favorites_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "favorites_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            manual_reviews: {
                Row: {
                    amount: number | null
                    created_at: string | null
                    id: string
                    notes: string | null
                    order_code: string | null
                    raw_payload: Json | null
                    reason: string
                    resolved_at: string | null
                    resolved_by: string | null
                    status: string
                    transaction_id: string | null
                    user_id: string | null
                }
                Insert: {
                    amount?: number | null
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    order_code?: string | null
                    raw_payload?: Json | null
                    reason: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    status?: string
                    transaction_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    amount?: number | null
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    order_code?: string | null
                    raw_payload?: Json | null
                    reason?: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    status?: string
                    transaction_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "manual_reviews_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    content: string
                    conversation_id: string
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    sender_id: string
                    updated_at: string | null
                }
                Insert: {
                    content: string
                    conversation_id: string
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    sender_id: string
                    updated_at?: string | null
                }
                Update: {
                    content?: string
                    conversation_id?: string
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    sender_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    content: string | null
                    created_at: string | null
                    data: Json | null
                    id: string
                    is_read: boolean | null
                    link: string | null
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                    user_id: string
                }
                Insert: {
                    content?: string | null
                    created_at?: string | null
                    data?: Json | null
                    id?: string
                    is_read?: boolean | null
                    link?: string | null
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                    user_id: string
                }
                Update: {
                    content?: string | null
                    created_at?: string | null
                    data?: Json | null
                    id?: string
                    is_read?: boolean | null
                    link?: string | null
                    title?: string
                    type?: Database["public"]["Enums"]["notification_type"]
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            partners: {
                Row: {
                    address: string | null
                    category: string
                    contact_info: Json | null
                    created_at: string | null
                    description: string | null
                    discount: string | null
                    email: string | null
                    hours: string | null
                    id: string
                    image_url: string | null
                    latitude: number | null
                    longitude: number | null
                    name: string
                    phone: string | null
                    rating: number | null
                    review_count: number | null
                    specialization: string | null
                    status: string | null
                    updated_at: string | null
                    user_id: string | null
                    views: number | null
                }
                Insert: {
                    address?: string | null
                    category: string
                    contact_info?: Json | null
                    created_at?: string | null
                    description?: string | null
                    discount?: string | null
                    email?: string | null
                    hours?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    name: string
                    phone?: string | null
                    rating?: number | null
                    review_count?: number | null
                    specialization?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                    views?: number | null
                }
                Update: {
                    address?: string | null
                    category?: string
                    contact_info?: Json | null
                    created_at?: string | null
                    description?: string | null
                    discount?: string | null
                    email?: string | null
                    hours?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    name?: string
                    phone?: string | null
                    rating?: number | null
                    review_count?: number | null
                    specialization?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                    views?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "partners_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payment_cleanup_logs: {
                Row: {
                    created_at: string | null
                    details: Json | null
                    id: string
                    orders_expired: number | null
                    ran_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    details?: Json | null
                    id?: string
                    orders_expired?: number | null
                    ran_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    details?: Json | null
                    id?: string
                    orders_expired?: number | null
                    ran_at?: string | null
                }
                Relationships: []
            }
            payment_orders: {
                Row: {
                    amount: number
                    billing_cycle: string
                    created_at: string | null
                    expires_at: string
                    id: string
                    order_code: string
                    paid_at: string | null
                    payment_provider: string
                    plan: string
                    provider_transaction_id: string | null
                    qr_data: string | null
                    status: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    amount: number
                    billing_cycle?: string
                    created_at?: string | null
                    expires_at: string
                    id?: string
                    order_code: string
                    paid_at?: string | null
                    payment_provider?: string
                    plan?: string
                    provider_transaction_id?: string | null
                    qr_data?: string | null
                    status?: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    amount?: number
                    billing_cycle?: string
                    created_at?: string | null
                    expires_at?: string
                    id?: string
                    order_code?: string
                    paid_at?: string | null
                    payment_provider?: string
                    plan?: string
                    provider_transaction_id?: string | null
                    qr_data?: string | null
                    status?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_orders_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            phone_number_views: {
                Row: {
                    id: string
                    room_id: string
                    user_id: string
                    viewed_at: string | null
                }
                Insert: {
                    id?: string
                    room_id: string
                    user_id: string
                    viewed_at?: string | null
                }
                Update: {
                    id?: string
                    room_id?: string
                    user_id?: string
                    viewed_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "phone_number_views_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "phone_number_views_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            reports: {
                Row: {
                    admin_notes: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    priority: string
                    reported_id: string
                    reported_type: string
                    reporter_id: string
                    resolved_at: string | null
                    resolved_by: string | null
                    status: string
                    type: string
                    updated_at: string | null
                }
                Insert: {
                    admin_notes?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    priority?: string
                    reported_id: string
                    reported_type: string
                    reporter_id: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    status?: string
                    type: string
                    updated_at?: string | null
                }
                Update: {
                    admin_notes?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    priority?: string
                    reported_id?: string
                    reported_type?: string
                    reporter_id?: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    status?: string
                    type?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reports_reporter_id_fkey"
                        columns: ["reporter_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reports_resolved_by_fkey"
                        columns: ["resolved_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            reviews: {
                Row: {
                    comment: string | null
                    created_at: string | null
                    id: string
                    partner_id: string | null
                    rating: number
                    reviewed_user_id: string | null
                    reviewer_id: string
                    room_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    partner_id?: string | null
                    rating: number
                    reviewed_user_id?: string | null
                    reviewer_id: string
                    room_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    partner_id?: string | null
                    rating?: number
                    reviewed_user_id?: string | null
                    reviewer_id?: string
                    room_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_partner_id_fkey"
                        columns: ["partner_id"]
                        isOneToOne: false
                        referencedRelation: "partners"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_reviewed_user_id_fkey"
                        columns: ["reviewed_user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_reviewer_id_fkey"
                        columns: ["reviewer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_amenities: {
                Row: {
                    air_conditioning: boolean | null
                    balcony: boolean | null
                    created_at: string | null
                    dryer: boolean | null
                    elevator: boolean | null
                    fingerprint_lock: boolean | null
                    gym: boolean | null
                    heater: boolean | null
                    id: string
                    kitchen: boolean | null
                    microwave: boolean | null
                    parking: boolean | null
                    refrigerator: boolean | null
                    room_id: string
                    security_camera: boolean | null
                    security_guard: boolean | null
                    swimming_pool: boolean | null
                    tv: boolean | null
                    updated_at: string | null
                    washing_machine: boolean | null
                    wifi: boolean | null
                }
                Insert: {
                    air_conditioning?: boolean | null
                    balcony?: boolean | null
                    created_at?: string | null
                    dryer?: boolean | null
                    elevator?: boolean | null
                    fingerprint_lock?: boolean | null
                    gym?: boolean | null
                    heater?: boolean | null
                    id?: string
                    kitchen?: boolean | null
                    microwave?: boolean | null
                    parking?: boolean | null
                    refrigerator?: boolean | null
                    room_id: string
                    security_camera?: boolean | null
                    security_guard?: boolean | null
                    swimming_pool?: boolean | null
                    tv?: boolean | null
                    updated_at?: string | null
                    washing_machine?: boolean | null
                    wifi?: boolean | null
                }
                Update: {
                    air_conditioning?: boolean | null
                    balcony?: boolean | null
                    created_at?: string | null
                    dryer?: boolean | null
                    elevator?: boolean | null
                    fingerprint_lock?: boolean | null
                    gym?: boolean | null
                    heater?: boolean | null
                    id?: string
                    kitchen?: boolean | null
                    microwave?: boolean | null
                    parking?: boolean | null
                    refrigerator?: boolean | null
                    room_id?: string
                    security_camera?: boolean | null
                    security_guard?: boolean | null
                    swimming_pool?: boolean | null
                    tv?: boolean | null
                    updated_at?: string | null
                    washing_machine?: boolean | null
                    wifi?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "room_amenities_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: true
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_images: {
                Row: {
                    caption: string | null
                    created_at: string | null
                    display_order: number | null
                    id: string
                    image_type: Database["public"]["Enums"]["image_type"] | null
                    image_url: string
                    is_primary: boolean | null
                    room_id: string
                }
                Insert: {
                    caption?: string | null
                    created_at?: string | null
                    display_order?: number | null
                    id?: string
                    image_type?: Database["public"]["Enums"]["image_type"] | null
                    image_url: string
                    is_primary?: boolean | null
                    room_id: string
                }
                Update: {
                    caption?: string | null
                    created_at?: string | null
                    display_order?: number | null
                    id?: string
                    image_type?: Database["public"]["Enums"]["image_type"] | null
                    image_url?: string
                    is_primary?: boolean | null
                    room_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_images_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            roommate_matches: {
                Row: {
                    calculated_at: string | null
                    compatibility_score: number
                    habits_score: number | null
                    id: string
                    lifestyle_score: number | null
                    matched_user_id: string
                    preferences_score: number | null
                    user_id: string
                }
                Insert: {
                    calculated_at?: string | null
                    compatibility_score: number
                    habits_score?: number | null
                    id?: string
                    lifestyle_score?: number | null
                    matched_user_id: string
                    preferences_score?: number | null
                    user_id: string
                }
                Update: {
                    calculated_at?: string | null
                    compatibility_score?: number
                    habits_score?: number | null
                    id?: string
                    lifestyle_score?: number | null
                    matched_user_id?: string
                    preferences_score?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "roommate_matches_matched_user_id_fkey"
                        columns: ["matched_user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "roommate_matches_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            roommate_profiles: {
                Row: {
                    age: number | null
                    bio: string | null
                    budget_max: number | null
                    budget_min: number | null
                    city: string
                    created_at: string | null
                    district: string | null
                    gender: string | null
                    hobbies: string[] | null
                    id: string
                    languages: string[] | null
                    move_in_date: string | null
                    occupation: string | null
                    preferred_gender: string | null
                    room_type_preference: string[] | null
                    search_radius_km: number | null
                    status: Database["public"]["Enums"]["roommate_profile_status"] | null
                    university_based: boolean | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    age?: number | null
                    bio?: string | null
                    budget_max?: number | null
                    budget_min?: number | null
                    city: string
                    created_at?: string | null
                    district?: string | null
                    gender?: string | null
                    hobbies?: string[] | null
                    id?: string
                    languages?: string[] | null
                    move_in_date?: string | null
                    occupation?: string | null
                    preferred_gender?: string | null
                    room_type_preference?: string[] | null
                    search_radius_km?: number | null
                    status?: Database["public"]["Enums"]["roommate_profile_status"] | null
                    university_based?: boolean | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    age?: number | null
                    bio?: string | null
                    budget_max?: number | null
                    budget_min?: number | null
                    city?: string
                    created_at?: string | null
                    district?: string | null
                    gender?: string | null
                    hobbies?: string[] | null
                    id?: string
                    languages?: string[] | null
                    move_in_date?: string | null
                    occupation?: string | null
                    preferred_gender?: string | null
                    room_type_preference?: string[] | null
                    search_radius_km?: number | null
                    status?: Database["public"]["Enums"]["roommate_profile_status"] | null
                    university_based?: boolean | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "roommate_profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            roommate_requests: {
                Row: {
                    created_at: string | null
                    expires_at: string | null
                    id: string
                    message: string | null
                    receiver_id: string
                    responded_at: string | null
                    sender_id: string
                    status: Database["public"]["Enums"]["roommate_request_status"] | null
                }
                Insert: {
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    message?: string | null
                    receiver_id: string
                    responded_at?: string | null
                    sender_id: string
                    status?: Database["public"]["Enums"]["roommate_request_status"] | null
                }
                Update: {
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    message?: string | null
                    receiver_id?: string
                    responded_at?: string | null
                    sender_id?: string
                    status?: Database["public"]["Enums"]["roommate_request_status"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "roommate_requests_receiver_id_fkey"
                        columns: ["receiver_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "roommate_requests_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rooms: {
                Row: {
                    address: string
                    area_sqm: number | null
                    available_from: string | null
                    bathroom_count: number | null
                    bedroom_count: number | null
                    city: string | null
                    created_at: string | null
                    deleted_at: string | null
                    deposit_amount: number | null
                    description: string | null
                    district: string | null
                    electricity_cost: string | null
                    favorite_count: number | null
                    furnished: boolean | null
                    furniture_details: Json | null
                    gender_restriction:
                    | Database["public"]["Enums"]["gender_restriction"]
                    | null
                    has_360_photos: boolean | null
                    id: string
                    is_available: boolean | null
                    is_verified: boolean | null
                    landlord_id: string
                    latitude: number | null
                    longitude: number | null
                    max_occupants: number | null
                    min_lease_term: number | null
                    pet_allowed: boolean | null
                    price_per_month: number
                    rejection_reason: string | null
                    room_type: Database["public"]["Enums"]["room_type"]
                    smoking_allowed: boolean | null
                    status: Database["public"]["Enums"]["room_status"] | null
                    title: string
                    updated_at: string | null
                    utilities_included: boolean | null
                    verification_date: string | null
                    view_count: number | null
                    water_cost: string | null
                }
                Insert: {
                    address: string
                    area_sqm?: number | null
                    available_from?: string | null
                    bathroom_count?: number | null
                    bedroom_count?: number | null
                    city?: string | null
                    created_at?: string | null
                    deleted_at?: string | null
                    deposit_amount?: number | null
                    description?: string | null
                    district?: string | null
                    electricity_cost?: string | null
                    favorite_count?: number | null
                    furnished?: boolean | null
                    furniture_details?: Json | null
                    gender_restriction?:
                    | Database["public"]["Enums"]["gender_restriction"]
                    | null
                    has_360_photos?: boolean | null
                    id?: string
                    is_available?: boolean | null
                    is_verified?: boolean | null
                    landlord_id: string
                    latitude?: number | null
                    longitude?: number | null
                    max_occupants?: number | null
                    min_lease_term?: number | null
                    pet_allowed?: boolean | null
                    price_per_month: number
                    rejection_reason?: string | null
                    room_type: Database["public"]["Enums"]["room_type"]
                    smoking_allowed?: boolean | null
                    status?: Database["public"]["Enums"]["room_status"] | null
                    title: string
                    updated_at?: string | null
                    utilities_included?: boolean | null
                    verification_date?: string | null
                    view_count?: number | null
                    water_cost?: string | null
                }
                Update: {
                    address?: string
                    area_sqm?: number | null
                    available_from?: string | null
                    bathroom_count?: number | null
                    bedroom_count?: number | null
                    city?: string | null
                    created_at?: string | null
                    deleted_at?: string | null
                    deposit_amount?: number | null
                    description?: string | null
                    district?: string | null
                    electricity_cost?: string | null
                    favorite_count?: number | null
                    furnished?: boolean | null
                    furniture_details?: Json | null
                    gender_restriction?:
                    | Database["public"]["Enums"]["gender_restriction"]
                    | null
                    has_360_photos?: boolean | null
                    id?: string
                    is_available?: boolean | null
                    is_verified?: boolean | null
                    landlord_id?: string
                    latitude?: number | null
                    longitude?: number | null
                    max_occupants?: number | null
                    min_lease_term?: number | null
                    pet_allowed?: boolean | null
                    price_per_month?: number
                    rejection_reason?: string | null
                    room_type?: Database["public"]["Enums"]["room_type"]
                    smoking_allowed?: boolean | null
                    status?: Database["public"]["Enums"]["room_status"] | null
                    title?: string
                    updated_at?: string | null
                    utilities_included?: boolean | null
                    verification_date?: string | null
                    view_count?: number | null
                    water_cost?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "rooms_landlord_id_fkey"
                        columns: ["landlord_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            service_leads: {
                Row: {
                    admin_notes: string | null
                    assigned_at: string | null
                    assigned_by: string | null
                    created_at: string | null
                    details: Json
                    estimated_price: number | null
                    id: string
                    partner_id: string | null
                    preferred_date: string | null
                    rejection_reason: string | null
                    service_type: string
                    status: string | null
                    updated_at: string | null
                    user_id: string
                    user_rating: number | null
                    user_review: string | null
                }
                Insert: {
                    admin_notes?: string | null
                    assigned_at?: string | null
                    assigned_by?: string | null
                    created_at?: string | null
                    details?: Json
                    estimated_price?: number | null
                    id?: string
                    partner_id?: string | null
                    preferred_date?: string | null
                    rejection_reason?: string | null
                    service_type: string
                    status?: string | null
                    updated_at?: string | null
                    user_id: string
                    user_rating?: number | null
                    user_review?: string | null
                }
                Update: {
                    admin_notes?: string | null
                    assigned_at?: string | null
                    assigned_by?: string | null
                    created_at?: string | null
                    details?: Json
                    estimated_price?: number | null
                    id?: string
                    partner_id?: string | null
                    preferred_date?: string | null
                    rejection_reason?: string | null
                    service_type?: string
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string
                    user_rating?: number | null
                    user_review?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "service_leads_assigned_by_users_fkey"
                        columns: ["assigned_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_leads_partner_id_fkey"
                        columns: ["partner_id"]
                        isOneToOne: false
                        referencedRelation: "partners"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_leads_user_id_users_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sublet_applications: {
                Row: {
                    applicant_id: string
                    created_at: string | null
                    documents: Json | null
                    id: string
                    message: string | null
                    preferred_move_in_date: string
                    rejection_reason: string | null
                    review_notes: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    status: string | null
                    sublet_listing_id: string
                    updated_at: string | null
                }
                Insert: {
                    applicant_id: string
                    created_at?: string | null
                    documents?: Json | null
                    id?: string
                    message?: string | null
                    preferred_move_in_date: string
                    rejection_reason?: string | null
                    review_notes?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: string | null
                    sublet_listing_id: string
                    updated_at?: string | null
                }
                Update: {
                    applicant_id?: string
                    created_at?: string | null
                    documents?: Json | null
                    id?: string
                    message?: string | null
                    preferred_move_in_date?: string
                    rejection_reason?: string | null
                    review_notes?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: string | null
                    sublet_listing_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "sublet_applications_applicant_id_fkey"
                        columns: ["applicant_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sublet_applications_reviewed_by_fkey"
                        columns: ["reviewed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sublet_applications_sublet_listing_id_fkey"
                        columns: ["sublet_listing_id"]
                        isOneToOne: false
                        referencedRelation: "sublet_listings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sublet_listings: {
                Row: {
                    application_count: number | null
                    created_at: string | null
                    deposit_required: number | null
                    description: string | null
                    end_date: string
                    id: string
                    original_price: number
                    original_room_id: string
                    owner_id: string
                    published_at: string | null
                    requirements: string[] | null
                    start_date: string
                    status: string | null
                    sublet_price: number
                    updated_at: string | null
                    view_count: number | null
                }
                Insert: {
                    application_count?: number | null
                    created_at?: string | null
                    deposit_required?: number | null
                    description?: string | null
                    end_date: string
                    id?: string
                    original_price: number
                    original_room_id: string
                    owner_id: string
                    published_at?: string | null
                    requirements?: string[] | null
                    start_date: string
                    status?: string | null
                    sublet_price: number
                    updated_at?: string | null
                    view_count?: number | null
                }
                Update: {
                    application_count?: number | null
                    created_at?: string | null
                    deposit_required?: number | null
                    description?: string | null
                    end_date?: string
                    id?: string
                    original_price?: number
                    original_room_id?: string
                    owner_id?: string
                    published_at?: string | null
                    requirements?: string[] | null
                    start_date?: string
                    status?: string | null
                    sublet_price?: number
                    updated_at?: string | null
                    view_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "sublet_listings_original_room_id_fkey"
                        columns: ["original_room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sublet_listings_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subscriptions: {
                Row: {
                    amount_paid: number | null
                    cancel_at_period_end: boolean | null
                    created_at: string | null
                    current_period_end: string | null
                    current_period_start: string | null
                    id: string
                    payment_method: string | null
                    payment_provider: string | null
                    payment_provider_customer_id: string | null
                    payment_provider_transaction_id: string | null
                    plan: string
                    promo_applied: boolean | null
                    status: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    amount_paid?: number | null
                    cancel_at_period_end?: boolean | null
                    created_at?: string | null
                    current_period_end?: string | null
                    current_period_start?: string | null
                    id?: string
                    payment_method?: string | null
                    payment_provider?: string | null
                    payment_provider_customer_id?: string | null
                    payment_provider_transaction_id?: string | null
                    plan?: string
                    promo_applied?: boolean | null
                    status?: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    amount_paid?: number | null
                    cancel_at_period_end?: boolean | null
                    created_at?: string | null
                    current_period_end?: string | null
                    current_period_start?: string | null
                    id?: string
                    payment_method?: string | null
                    payment_provider?: string | null
                    payment_provider_customer_id?: string | null
                    payment_provider_transaction_id?: string | null
                    plan?: string
                    promo_applied?: boolean | null
                    status?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            swap_requests: {
                Row: {
                    created_at: string | null
                    id: string
                    message: string | null
                    proposed_end_date: string
                    proposed_start_date: string
                    recipient_id: string
                    recipient_listing_id: string
                    rejection_reason: string | null
                    requester_id: string
                    requester_listing_id: string
                    responded_at: string | null
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    proposed_end_date: string
                    proposed_start_date: string
                    recipient_id: string
                    recipient_listing_id: string
                    rejection_reason?: string | null
                    requester_id: string
                    requester_listing_id: string
                    responded_at?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    proposed_end_date?: string
                    proposed_start_date?: string
                    recipient_id?: string
                    recipient_listing_id?: string
                    rejection_reason?: string | null
                    requester_id?: string
                    requester_listing_id?: string
                    responded_at?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "swap_requests_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "swap_requests_recipient_listing_id_fkey"
                        columns: ["recipient_listing_id"]
                        isOneToOne: false
                        referencedRelation: "sublet_listings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "swap_requests_requester_id_fkey"
                        columns: ["requester_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "swap_requests_requester_listing_id_fkey"
                        columns: ["requester_listing_id"]
                        isOneToOne: false
                        referencedRelation: "sublet_listings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_preferences: {
                Row: {
                    budget_max: number | null
                    budget_min: number | null
                    cleanliness_level:
                    | Database["public"]["Enums"]["cleanliness_level"]
                    | null
                    cooking: boolean | null
                    created_at: string | null
                    guest_frequency: Database["public"]["Enums"]["guest_frequency"] | null
                    id: string
                    noise_tolerance: Database["public"]["Enums"]["noise_tolerance"] | null
                    pets: boolean | null
                    preferred_locations: Json | null
                    sleep_schedule: Database["public"]["Enums"]["sleep_schedule"] | null
                    smoking: boolean | null
                    updated_at: string | null
                    user_id: string
                    weekend_activity:
                    | Database["public"]["Enums"]["weekend_activity"]
                    | null
                }
                Insert: {
                    budget_max?: number | null
                    budget_min?: number | null
                    cleanliness_level?:
                    | Database["public"]["Enums"]["cleanliness_level"]
                    | null
                    cooking?: boolean | null
                    created_at?: string | null
                    guest_frequency?:
                    | Database["public"]["Enums"]["guest_frequency"]
                    | null
                    id?: string
                    noise_tolerance?:
                    | Database["public"]["Enums"]["noise_tolerance"]
                    | null
                    pets?: boolean | null
                    preferred_locations?: Json | null
                    sleep_schedule?: Database["public"]["Enums"]["sleep_schedule"] | null
                    smoking?: boolean | null
                    updated_at?: string | null
                    user_id: string
                    weekend_activity?:
                    | Database["public"]["Enums"]["weekend_activity"]
                    | null
                }
                Update: {
                    budget_max?: number | null
                    budget_min?: number | null
                    cleanliness_level?:
                    | Database["public"]["Enums"]["cleanliness_level"]
                    | null
                    cooking?: boolean | null
                    created_at?: string | null
                    guest_frequency?:
                    | Database["public"]["Enums"]["guest_frequency"]
                    | null
                    id?: string
                    noise_tolerance?:
                    | Database["public"]["Enums"]["noise_tolerance"]
                    | null
                    pets?: boolean | null
                    preferred_locations?: Json | null
                    sleep_schedule?: Database["public"]["Enums"]["sleep_schedule"] | null
                    smoking?: boolean | null
                    updated_at?: string | null
                    user_id?: string
                    weekend_activity?:
                    | Database["public"]["Enums"]["weekend_activity"]
                    | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_preferences_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_push_tokens: {
                Row: {
                    created_at: string
                    device_id: string
                    id: string
                    platform: string
                    token: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    device_id: string
                    id?: string
                    platform: string
                    token: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    device_id?: string
                    id?: string
                    platform?: string
                    token?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            user_saved_vouchers: {
                Row: {
                    created_at: string | null
                    deal_id: string
                    qr_data: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    deal_id: string
                    qr_data: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    deal_id?: string
                    qr_data?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_saved_vouchers_deal_id_fkey"
                        columns: ["deal_id"]
                        isOneToOne: false
                        referencedRelation: "deals"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    account_status: Database["public"]["Enums"]["account_status"] | null
                    avatar_url: string | null
                    bio: string | null
                    created_at: string | null
                    date_of_birth: string | null
                    deleted_at: string | null
                    email: string
                    email_verified: boolean | null
                    full_name: string
                    gender: Database["public"]["Enums"]["user_gender"] | null
                    graduation_year: number | null
                    id: string
                    id_card_verified: boolean | null
                    is_premium: boolean | null
                    last_login_at: string | null
                    last_seen: string | null
                    major: string | null
                    password_hash: string
                    phone: string | null
                    phone_verified: boolean | null
                    preferences: Json | null
                    premium_until: string | null
                    rejection_reason: string | null
                    role: Database["public"]["Enums"]["user_role"] | null
                    student_card_verified: boolean | null
                    student_id: string | null
                    trust_score: number | null
                    university: string | null
                    updated_at: string | null
                }
                Insert: {
                    account_status?: Database["public"]["Enums"]["account_status"] | null
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    deleted_at?: string | null
                    email: string
                    email_verified?: boolean | null
                    full_name: string
                    gender?: Database["public"]["Enums"]["user_gender"] | null
                    graduation_year?: number | null
                    id?: string
                    id_card_verified?: boolean | null
                    is_premium?: boolean | null
                    last_login_at?: string | null
                    last_seen?: string | null
                    major?: string | null
                    password_hash: string
                    phone?: string | null
                    phone_verified?: boolean | null
                    preferences?: Json | null
                    premium_until?: string | null
                    rejection_reason?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    student_card_verified?: boolean | null
                    student_id?: string | null
                    trust_score?: number | null
                    university?: string | null
                    updated_at?: string | null
                }
                Update: {
                    account_status?: Database["public"]["Enums"]["account_status"] | null
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    deleted_at?: string | null
                    email?: string
                    email_verified?: boolean | null
                    full_name?: string
                    gender?: Database["public"]["Enums"]["user_gender"] | null
                    graduation_year?: number | null
                    id?: string
                    id_card_verified?: boolean | null
                    is_premium?: boolean | null
                    last_login_at?: string | null
                    last_seen?: string | null
                    major?: string | null
                    password_hash?: string
                    phone?: string | null
                    phone_verified?: boolean | null
                    preferences?: Json | null
                    premium_until?: string | null
                    rejection_reason?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    student_card_verified?: boolean | null
                    student_id?: string | null
                    trust_score?: number | null
                    university?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            verification_requests: {
                Row: {
                    back_image_path: string
                    document_type: string
                    front_image_path: string
                    id: string
                    rejection_reason: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    status: string
                    submitted_at: string
                    user_id: string
                }
                Insert: {
                    back_image_path: string
                    document_type?: string
                    front_image_path: string
                    id?: string
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: string
                    submitted_at?: string
                    user_id: string
                }
                Update: {
                    back_image_path?: string
                    document_type?: string
                    front_image_path?: string
                    id?: string
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: string
                    submitted_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "verification_requests_reviewed_by_fkey"
                        columns: ["reviewed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "verification_requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            verifications: {
                Row: {
                    additional_documents: Json | null
                    admin_notes: string | null
                    date_of_birth_on_doc: string | null
                    document_back_url: string | null
                    document_front_url: string | null
                    document_number: string | null
                    expires_at: string | null
                    full_name_on_doc: string | null
                    id: string
                    rejection_reason: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    status: Database["public"]["Enums"]["verification_status"] | null
                    submitted_at: string | null
                    user_id: string
                    verification_type: Database["public"]["Enums"]["verification_type"]
                }
                Insert: {
                    additional_documents?: Json | null
                    admin_notes?: string | null
                    date_of_birth_on_doc?: string | null
                    document_back_url?: string | null
                    document_front_url?: string | null
                    document_number?: string | null
                    expires_at?: string | null
                    full_name_on_doc?: string | null
                    id?: string
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: Database["public"]["Enums"]["verification_status"] | null
                    submitted_at?: string | null
                    user_id: string
                    verification_type: Database["public"]["Enums"]["verification_type"]
                }
                Update: {
                    additional_documents?: Json | null
                    admin_notes?: string | null
                    date_of_birth_on_doc?: string | null
                    document_back_url?: string | null
                    document_front_url?: string | null
                    document_number?: string | null
                    expires_at?: string | null
                    full_name_on_doc?: string | null
                    id?: string
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: Database["public"]["Enums"]["verification_status"] | null
                    submitted_at?: string | null
                    user_id?: string
                    verification_type?: Database["public"]["Enums"]["verification_type"]
                }
                Relationships: [
                    {
                        foreignKeyName: "verifications_reviewed_by_fkey"
                        columns: ["reviewed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "verifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            webhook_audit_logs: {
                Row: {
                    amount: number | null
                    created_at: string | null
                    error_message: string | null
                    event_type: string | null
                    id: string
                    idempotency_key: string | null
                    order_code: string | null
                    processed_at: string | null
                    processing_duration_ms: number | null
                    processing_result: Json | null
                    provider: string
                    received_at: string | null
                    request_body: Json | null
                    request_headers: Json | null
                    request_ip: unknown
                    request_method: string | null
                    signature_provided: boolean | null
                    signature_valid: boolean | null
                    status: string
                    transaction_id: string | null
                    user_id: string | null
                    webhook_id: string | null
                }
                Insert: {
                    amount?: number | null
                    created_at?: string | null
                    error_message?: string | null
                    event_type?: string | null
                    id?: string
                    idempotency_key?: string | null
                    order_code?: string | null
                    processed_at?: string | null
                    processing_duration_ms?: number | null
                    processing_result?: Json | null
                    provider?: string
                    received_at?: string | null
                    request_body?: Json | null
                    request_headers?: Json | null
                    request_ip?: unknown
                    request_method?: string | null
                    signature_provided?: boolean | null
                    signature_valid?: boolean | null
                    status?: string
                    transaction_id?: string | null
                    user_id?: string | null
                    webhook_id?: string | null
                }
                Update: {
                    amount?: number | null
                    created_at?: string | null
                    error_message?: string | null
                    event_type?: string | null
                    id?: string
                    idempotency_key?: string | null
                    order_code?: string | null
                    processed_at?: string | null
                    processing_duration_ms?: number | null
                    processing_result?: Json | null
                    provider?: string
                    received_at?: string | null
                    request_body?: Json | null
                    request_headers?: Json | null
                    request_ip?: unknown
                    request_method?: string | null
                    signature_provided?: boolean | null
                    signature_valid?: boolean | null
                    status?: string
                    transaction_id?: string | null
                    user_id?: string | null
                    webhook_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "webhook_audit_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            promo_status: {
                Row: {
                    claimed_slots: number | null
                    total_slots: number | null
                }
                Relationships: []
            }
        }
        Functions: {
            calculate_compatibility_score: {
                Args: { p_user1_id: string; p_user2_id: string }
                Returns: {
                    age_score: number
                    budget_score: number
                    cleanliness_score: number
                    guest_score: number
                    hobby_score: number
                    noise_score: number
                    sleep_score: number
                    total_score: number
                    weekend_score: number
                }[]
            }
            calculate_swap_match_score: {
                Args: { p_listing1_id: string; p_listing2_id: string }
                Returns: number
            }
            claim_promo_slot: { Args: { p_user_id: string }; Returns: Json }
            claim_promo_slot_counter: { Args: { p_user_id: string }; Returns: Json }
            cleanup_expired_payment_orders: { Args: never; Returns: number }
            cleanup_expired_payment_orders_with_logging: {
                Args: never
                Returns: number
            }
            custom_access_token_hook: { Args: { event: Json }; Returns: Json }
            decrement_favorite_count: {
                Args: { p_room_id: string }
                Returns: undefined
            }
            expire_subscriptions: { Args: never; Returns: undefined }
            find_potential_swap_matches: {
                Args: { p_limit?: number; p_listing_id: string }
                Returns: {
                    listing_id: string
                    match_id: string
                    match_reasons: string[]
                    match_score: number
                }[]
            }
            get_admin_stats: { Args: never; Returns: Json }
            get_or_create_conversation: {
                Args: { user1_id: string; user2_id: string }
                Returns: string
            }
            get_potential_matches: {
                Args: { p_user_id: string }
                Returns: {
                    listing_id: string
                    match_score: number
                    matched_listing: Json
                    matched_listing_id: string
                }[]
            }
            get_recent_admin_activities: { Args: { p_limit?: number }; Returns: Json }
            get_room_contact: {
                Args: { p_room_id: string }
                Returns: {
                    is_masked: boolean
                    phone: string
                }[]
            }
            get_room_type_distribution: { Args: never; Returns: Json }
            get_roommate_matches: {
                Args: { p_limit?: number; p_user_id: string }
                Returns: {
                    age: number
                    age_score: number
                    avatar_url: string
                    bio: string
                    budget_score: number
                    city: string
                    cleanliness_score: number
                    compatibility_score: number
                    district: string
                    full_name: string
                    gender: string
                    guest_score: number
                    hobbies: string[]
                    hobby_score: number
                    last_seen: string
                    major: string
                    matched_user_id: string
                    noise_score: number
                    occupation: string
                    sleep_score: number
                    university: string
                    weekend_score: number
                }[]
            }
            get_user_conversation_ids: {
                Args: { p_user_id: string }
                Returns: string[]
            }
            get_user_growth_stats: { Args: never; Returns: Json }
            get_user_role: { Args: { user_id: string }; Returns: string }
            increment_favorite_count: {
                Args: { p_room_id: string }
                Returns: undefined
            }
            increment_sublet_view_count: {
                Args: { p_sublet_id: string }
                Returns: undefined
            }
            increment_view_count: { Args: { p_room_id: string }; Returns: undefined }
            is_admin: { Args: never; Returns: boolean }
            map_quiz_value: { Args: { p_val: string }; Returns: number }
            process_payment_order: {
                Args: {
                    p_amount: number
                    p_order_code: string
                    p_payload?: Json
                    p_transaction_id: string
                }
                Returns: Json
            }
            resolve_payment_review: {
                Args: {
                    p_admin_user_id: string
                    p_resolution: string
                    p_review_id: string
                }
                Returns: undefined
            }
            search_rooms: {
                Args: {
                    p_amenities?: string[]
                    p_district?: string
                    p_furnished?: boolean
                    p_is_verified?: boolean
                    p_max_price?: number
                    p_min_price?: number
                    p_page?: number
                    p_page_size?: number
                    p_pet_allowed?: boolean
                    p_room_types?: string[]
                    p_search_query?: string
                    p_sort_by?: string
                }
                Returns: {
                    address: string
                    area_sqm: number
                    available_from: string
                    bathroom_count: number
                    bedroom_count: number
                    city: string
                    created_at: string
                    deleted_at: string
                    deposit_amount: number
                    description: string
                    district: string
                    favorite_count: number
                    furnished: boolean
                    gender_restriction: string
                    has_360_photos: boolean
                    id: string
                    is_available: boolean
                    is_verified: boolean
                    landlord_avatar: string
                    landlord_email: string
                    landlord_id: string
                    landlord_name: string
                    landlord_phone: string
                    landlord_trust_score: number
                    latitude: number
                    longitude: number
                    max_occupants: number
                    min_lease_term: number
                    pet_allowed: boolean
                    price_per_month: number
                    primary_image_url: string
                    room_type: string
                    search_rank: number
                    status: string
                    title: string
                    total_count: number
                    updated_at: string
                    view_count: number
                }[]
            }
            show_limit: { Args: never; Returns: number }
            show_trgm: { Args: { "": string }; Returns: string[] }
        }
        Enums: {
            account_status:
            | "active"
            | "suspended"
            | "pending"
            | "pending_landlord"
            | "rejected"
            booking_status: "pending" | "confirmed" | "cancelled" | "completed"
            cleanliness_level: "organized" | "moderate" | "relaxed"
            gender_restriction: "none" | "male_only" | "female_only"
            guest_frequency: "rarely" | "sometimes" | "frequently"
            image_type: "photo" | "360" | "video"
            message_type: "text" | "image" | "file"
            noise_tolerance: "quiet" | "moderate" | "noisy"
            notification_type:
            | "booking_request"
            | "booking_status"
            | "new_message"
            | "system"
            | "verification"
            | "roommate_request"
            | "sublet_request"
            | "sublet_approved"
            | "swap_match"
            | "swap_request"
            | "swap_confirmed"
            review_type: "room" | "landlord" | "tenant" | "roommate"
            room_status:
            | "draft"
            | "pending"
            | "active"
            | "rented"
            | "inactive"
            | "rejected"
            room_type: "private" | "shared" | "studio" | "entire"
            roommate_profile_status: "looking" | "paused" | "found"
            roommate_request_status:
            | "pending"
            | "accepted"
            | "declined"
            | "cancelled"
            | "expired"
            sleep_schedule: "early" | "late" | "flexible"
            user_gender: "male" | "female" | "other"
            user_role: "student" | "landlord" | "admin"
            verification_status:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_resubmit"
            verification_type:
            | "id_card"
            | "student_card"
            | "email"
            | "phone"
            | "room_photos"
            weekend_activity: "home" | "out" | "mix"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            account_status: [
                "active",
                "suspended",
                "pending",
                "pending_landlord",
                "rejected",
            ],
            booking_status: ["pending", "confirmed", "cancelled", "completed"],
            cleanliness_level: ["organized", "moderate", "relaxed"],
            gender_restriction: ["none", "male_only", "female_only"],
            guest_frequency: ["rarely", "sometimes", "frequently"],
            image_type: ["photo", "360", "video"],
            message_type: ["text", "image", "file"],
            noise_tolerance: ["quiet", "moderate", "noisy"],
            notification_type: [
                "booking_request",
                "booking_status",
                "new_message",
                "system",
                "verification",
                "roommate_request",
                "sublet_request",
                "sublet_approved",
                "swap_match",
                "swap_request",
                "swap_confirmed",
            ],
            review_type: ["room", "landlord", "tenant", "roommate"],
            room_status: [
                "draft",
                "pending",
                "active",
                "rented",
                "inactive",
                "rejected",
            ],
            room_type: ["private", "shared", "studio", "entire"],
            roommate_profile_status: ["looking", "paused", "found"],
            roommate_request_status: [
                "pending",
                "accepted",
                "declined",
                "cancelled",
                "expired",
            ],
            sleep_schedule: ["early", "late", "flexible"],
            user_gender: ["male", "female", "other"],
            user_role: ["student", "landlord", "admin"],
            verification_status: [
                "pending",
                "approved",
                "rejected",
                "needs_resubmit",
            ],
            verification_type: [
                "id_card",
                "student_card",
                "email",
                "phone",
                "room_photos",
            ],
            weekend_activity: ["home", "out", "mix"],
        },
    },
} as const
