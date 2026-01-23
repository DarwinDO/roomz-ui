/**
 * Admin API Service
 * CRUD operations for admin dashboard
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type AdminRoom = Tables<'rooms'> & {
  landlord?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  images?: Tables<'room_images'>[];
  _count?: {
    favorites: number;
  };
};

export type AdminUser = Tables<'users'>;

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  pendingRooms: number;
  activeRooms: number;
  totalBookings: number;
}

// ============ ROOMS ============

/**
 * Get all rooms for admin (includes pending, all statuses)
 */
export async function getAdminRooms(): Promise<AdminRoom[]> {
  // Debug: Check current session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[Admin Debug] Current user:', session?.user?.email);
  console.log('[Admin Debug] User ID:', session?.user?.id);

  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      landlord:users!landlord_id(id, full_name, email, phone, avatar_url),
      images:room_images(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  console.log('[Admin Debug] Rooms count:', data?.length);
  console.log('[Admin Debug] Error:', error);

  if (error) throw error;
  return (data || []) as AdminRoom[];
}

/**
 * Refresh session to get latest JWT claims
 */
async function refreshSession(): Promise<void> {
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn('[Admin] Failed to refresh session:', error.message);
  }
}

/**
 * Approve a room - sets status to 'active' and is_verified to true
 */
export async function approveRoom(roomId: string): Promise<void> {
  // Refresh session to ensure we have latest JWT claims
  await refreshSession();

  const { data: { session } } = await supabase.auth.getSession();
  console.log('[Admin Debug] Approving room with user:', session?.user?.email);
  console.log('[Admin Debug] App metadata:', session?.user?.app_metadata);

  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'active',
      is_verified: true,
      verification_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', roomId);

  if (error) {
    console.error('[Admin Debug] Approve error:', error);
    throw error;
  }
}

/**
 * Reject a room - sets status to 'inactive'
 */
export async function rejectRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', roomId);

  if (error) throw error;
}

/**
 * Toggle room featured status
 */
export async function toggleRoomFeatured(roomId: string, featured: boolean): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({
      is_verified: featured,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', roomId);

  if (error) throw error;
}

/**
 * Soft delete a room
 */
export async function deleteRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'inactive',
    } as never)
    .eq('id', roomId);

  if (error) throw error;
}

// ============ USERS ============

/**
 * Get all users for admin
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AdminUser[];
}

/**
 * Update user account status
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'pending_verification'
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      account_status: status,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: 'student' | 'landlord' | 'admin'
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      role,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Soft delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      account_status: 'suspended',
    } as never)
    .eq('id', userId);

  if (error) throw error;
}

// ============ STATS ============

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  // Get user counts
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('account_status', 'active')
    .is('deleted_at', null);

  // Get room counts
  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: pendingRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .is('deleted_at', null);

  const { count: activeRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('deleted_at', null);

  // Get booking count
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalRooms: totalRooms || 0,
    pendingRooms: pendingRooms || 0,
    activeRooms: activeRooms || 0,
    totalBookings: totalBookings || 0,
  };
}
