/**
 * Database Types Generated from Supabase
 * Generated on: 2026-01-14
 * 
 * To regenerate these types, run:
 * npx supabase gen types typescript --project-id vevnoxlgwisdottaifdn > src/lib/database.types.ts
 */

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
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_status: "active" | "suspended" | "pending"
      user_gender: "male" | "female" | "other"
      user_role: "student" | "landlord" | "admin"
      // Add other enums as needed
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
