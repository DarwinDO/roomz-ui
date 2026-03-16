/**
 * ============================================
 * ROMMZ FRONTEND - SUPABASE CLIENT
 * ============================================
 */

import { createClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert } from '@roomz/shared/services/database.types';

const env = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env ?? {};

// Supabase configuration
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Storage helpers
export const storage = {
  /**
   * Upload image to room-images bucket
   */
  async uploadRoomImage(roomId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${roomId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(fileName, file);

    if (error) throw error;

    return {
      path: data.path,
      url: supabase.storage.from('room-images').getPublicUrl(data.path).data.publicUrl,
    };
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(fileName, file, {
        upsert: true, // Replace existing avatar
      });

    if (error) throw error;

    return {
      path: data.path,
      url: supabase.storage.from('user-avatars').getPublicUrl(data.path).data.publicUrl,
    };
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  /**
   * Delete file
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};

// Auth helpers
export const auth = {
  /**
   * Sign up new user
   */
  async signUp(email: string, password: string, userData: Record<string, unknown> = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Send a one-time email code for passwordless sign-in
   */
  async sendEmailOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Verify a one-time email code and create a session
   */
  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Record<string, unknown>) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },
};

// Database helpers
export const db = {
  /**
   * Get all active rooms
   */
  async getRooms(
    filters: {
      district?: Tables<'rooms'>['district'];
      maxPrice?: number;
      roomType?: Tables<'rooms'>['room_type'];
    } = {}
  ) {
    let query = supabase
      .from('rooms')
      .select(`
        *,
        landlord:users!landlord_id(*),
        images:room_images(*),
        amenities:room_amenities(*)
      `)
      .eq('status', 'active')
      .is('deleted_at', null);

    // Apply filters
    if (filters.district) {
      query = query.eq('district', filters.district);
    }
    if (filters.maxPrice) {
      query = query.lte('price_per_month', filters.maxPrice);
    }
    if (filters.roomType) {
      query = query.eq('room_type', filters.roomType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get room by ID
   */
  async getRoomById(id: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        landlord:users!landlord_id(*),
        images:room_images(*),
        amenities:room_amenities(*),
        reviews:reviews(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new room
   */
  async createRoom(roomData: TablesInsert<'rooms'>) {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get user's messages
   */
  async getMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Send message
   */
  async sendMessage(messageData: TablesInsert<'messages'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(userId: string, roomId: string) {
    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return { favorited: false };
    } else {
      // Add favorite
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, room_id: roomId });

      if (error) throw error;
      return { favorited: true };
    }
  },
};

// Realtime subscriptions
export const realtime = {
  /**
   * Subscribe to new messages
   */
  subscribeToMessages(userId: string, callback: (message: Tables<'messages'>) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Tables<'messages'>);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to room updates
   */
  subscribeToRoom(roomId: string, callback: (room: Tables<'rooms'>) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          callback(payload.new as Tables<'rooms'>);
        }
      )
      .subscribe();
  },
};

export default supabase;
