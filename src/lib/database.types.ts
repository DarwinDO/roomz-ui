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
          }
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
          {
            foreignKeyName: "compatibility_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
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
          }
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
            foreignKeyName: "favorites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "v_rooms_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
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
          }
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
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
          }
        ]
      }
      partners: {
        Row: {
          category: string
          contact_info: Json | null
          created_at: string | null
          discount: string | null
          id: string
          image_url: string | null
          name: string
          rating: number | null
          review_count: number | null
          specialization: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          category: string
          contact_info?: Json | null
          created_at?: string | null
          discount?: string | null
          id?: string
          image_url?: string | null
          name: string
          rating?: number | null
          review_count?: number | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          category?: string
          contact_info?: Json | null
          created_at?: string | null
          discount?: string | null
          id?: string
          image_url?: string | null
          name?: string
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
          }
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
          }
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
          {
            foreignKeyName: "room_amenities_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "v_rooms_full"
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
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "v_rooms_full"
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
            foreignKeyName: "roommate_matches_matched_user_id_fkey"
            columns: ["matched_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommate_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommate_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
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
          pet_allowed: boolean | null
          price_per_month: number
          room_type: Database["public"]["Enums"]["room_type"]
          smoking_allowed: boolean | null
          status: Database["public"]["Enums"]["room_status"] | null
          title: string
          updated_at: string | null
          utilities_included: boolean | null
          verification_date: string | null
          view_count: number | null
          water_cost: string | null
          rejection_reason: string | null
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
          pet_allowed?: boolean | null
          price_per_month: number
          room_type: Database["public"]["Enums"]["room_type"]
          smoking_allowed?: boolean | null
          status?: Database["public"]["Enums"]["room_status"] | null
          title: string
          updated_at?: string | null
          utilities_included?: boolean | null
          verification_date?: string | null
          view_count?: number | null
          water_cost?: string | null
          rejection_reason?: string | null
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
          pet_allowed?: boolean | null
          price_per_month?: number
          room_type?: Database["public"]["Enums"]["room_type"]
          smoking_allowed?: boolean | null
          status?: Database["public"]["Enums"]["room_status"] | null
          title?: string
          updated_at?: string | null
          utilities_included?: boolean | null
          verification_date?: string | null
          view_count?: number | null
          water_cost?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
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
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
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
          major: string | null
          password_hash: string
          phone: string | null
          phone_verified: boolean | null
          preferences: Json | null
          premium_until: string | null
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
          major?: string | null
          password_hash: string
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          premium_until?: string | null
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
          major?: string | null
          password_hash?: string
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          premium_until?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          student_card_verified?: boolean | null
          student_id?: string | null
          trust_score?: number | null
          university?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_rooms_full: {
        Row: {
          address: string | null
          area_sqm: number | null
          available_from: string | null
          average_rating: number | null
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
          favorite_count_actual: number | null
          furnished: boolean | null
          furniture_details: Json | null
          gender_restriction:
          | Database["public"]["Enums"]["gender_restriction"]
          | null
          has_360_photos: boolean | null
          id: string | null
          image_count: number | null
          is_available: boolean | null
          is_verified: boolean | null
          landlord_email: string | null
          landlord_id: string | null
          landlord_name: string | null
          landlord_phone: string | null
          landlord_trust_score: number | null
          latitude: number | null
          longitude: number | null
          max_occupants: number | null
          pet_allowed: boolean | null
          price_per_month: number | null
          review_count: number | null
          room_type: Database["public"]["Enums"]["room_type"] | null
          smoking_allowed: boolean | null
          status: Database["public"]["Enums"]["room_status"] | null
          title: string | null
          updated_at: string | null
          utilities_included: boolean | null
          verification_date: string | null
          view_count: number | null
          water_cost: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "v_users_verification_status"
            referencedColumns: ["id"]
          },
        ]
      }
      v_users_verification_status: {
        Row: {
          average_rating: number | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string | null
          id_card_verified: boolean | null
          pending_verifications: number | null
          phone_verified: boolean | null
          review_count: number | null
          student_card_verified: boolean | null
          trust_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_status: "active" | "suspended" | "pending" | "pending_landlord"
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
      review_type: "room" | "landlord" | "tenant" | "roommate"
      room_status: "draft" | "pending" | "active" | "rented" | "inactive" | "rejected"
      room_type: "private" | "shared" | "studio" | "entire"
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
      account_status: ["active", "suspended", "pending", "pending_landlord"],
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
      ],
      review_type: ["room", "landlord", "tenant", "roommate"],
      room_status: ["draft", "pending", "active", "rented", "inactive", "rejected"],
      room_type: ["private", "shared", "studio", "entire"],
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
