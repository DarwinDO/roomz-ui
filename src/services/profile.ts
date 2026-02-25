/**
 * Profile API Service
 * Interact with 'users' table for profile updates
 */
import { supabase } from "@/lib/supabase";

/**
 * Profile update data interface
 */
export interface UpdateProfileData {
    full_name: string;
    major?: string | null;
    university?: string | null;
    bio?: string | null;
    phone?: string | null;
    graduation_year?: number | null;
}

/**
 * Update user profile in database
 */
export async function updateProfile(userId: string, data: UpdateProfileData): Promise<void> {
    const { error } = await supabase
        .from("users")
        .update({
            full_name: data.full_name,
            major: data.major ?? null,
            university: data.university ?? null,
            bio: data.bio ?? null,
            phone: data.phone ?? null,
            graduation_year: data.graduation_year ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}
