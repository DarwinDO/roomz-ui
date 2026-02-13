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
 * Reject a room - sets status to 'inactive' with rejection reason
 */
export async function rejectRoom(roomId: string, reason?: string): Promise<void> {
  const updateData: Record<string, unknown> = {
    status: 'inactive',
    is_verified: false,
    updated_at: new Date().toISOString(),
  };

  if (reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await supabase
    .from('rooms')
    .update(updateData as never)
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

// ============ LANDLORD APPLICATIONS ============

/**
 * Approve a landlord application - sets role to landlord and status to active
 */
export async function approveLandlordApplication(userId: string): Promise<void> {
  await refreshSession();

  const { error } = await supabase
    .from('users')
    .update({
      role: 'landlord',
      account_status: 'active',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', userId);

  if (error) {
    console.error('[Admin] Failed to approve landlord:', error);
    throw error;
  }
}

/**
 * Reject a landlord application - sets status back to active (normal user)
 * Optionally with a rejection reason
 */
export async function rejectLandlordApplication(userId: string, reason?: string): Promise<void> {
  await refreshSession();

  const updateData: Record<string, unknown> = {
    account_status: 'active',
    updated_at: new Date().toISOString(),
  };

  if (reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData as never)
    .eq('id', userId);

  if (error) {
    console.error('[Admin] Failed to reject landlord application:', error);
    throw error;
  }
}

/**
 * Reject user verification with reason
 */
export async function rejectUserVerification(userId: string, reason: string): Promise<void> {
  await refreshSession();

  const { error } = await supabase
    .from('users')
    .update({
      account_status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', userId);

  if (error) {
    console.error('[Admin] Failed to reject user verification:', error);
    throw error;
  }
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

// ============ SERVICE LEADS ============

export interface AdminServiceLead {
  id: string;
  user_id: string;
  partner_id: string | null;
  service_type: string;
  status: string;
  details: Record<string, unknown>;
  preferred_date: string | null;
  estimated_price: number | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  user_rating: number | null;
  user_review: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; full_name: string; email: string; phone: string | null; avatar_url: string | null; };
  partner?: { id: string; name: string; category: string; specialization: string | null; rating: number | null; };
}

export interface ServiceLeadStats {
  total: number;
  submitted: number;
  assigned: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface ServiceLeadFilters {
  status?: string;
  service_type?: string;
  search?: string;
}

/**
 * Get all service leads for admin (with user and partner joins)
 */
export async function getAdminServiceLeads(filters?: ServiceLeadFilters): Promise<AdminServiceLead[]> {
  let query = supabase
    .from('service_leads')
    .select('*, user:users!service_leads_user_id_users_fkey(id, full_name, email, phone, avatar_url), partner:partners(id, name, category, specialization, rating)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.service_type && filters.service_type !== 'all') {
    query = query.eq('service_type', filters.service_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching admin service leads:', error);
    throw error;
  }

  let leads = data || [];

  // Client-side search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    leads = leads.filter(lead =>
      lead.user?.full_name?.toLowerCase().includes(searchLower) ||
      lead.user?.email?.toLowerCase().includes(searchLower) ||
      lead.partner?.name?.toLowerCase().includes(searchLower)
    );
  }

  return leads as unknown as AdminServiceLead[];
}

/**
 * Get single service lead by ID for admin
 */
export async function getAdminServiceLeadById(id: string): Promise<AdminServiceLead | null> {
  const { data, error } = await supabase
    .from('service_leads')
    .select('*, user:users!service_leads_user_id_users_fkey(id, full_name, email, phone, avatar_url), partner:partners(id, name, category, specialization, rating)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching admin service lead:', error);
    return null;
  }

  return data as unknown as AdminServiceLead;
}

/**
 * Assign partner to a service lead
 */
export async function assignPartnerToLead(leadId: string, partnerId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('service_leads')
    .update({
      partner_id: partnerId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      assigned_by: user.id,
    })
    .eq('id', leadId);

  if (error) {
    console.error('Error assigning partner to lead:', error);
    throw error;
  }
}

/**
 * Update service lead status
 */
export async function updateServiceLeadStatus(
  leadId: string,
  status: string,
  reason?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
  };

  if (status === 'rejected' && reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await supabase
    .from('service_leads')
    .update(updateData)
    .eq('id', leadId);

  if (error) {
    console.error('Error updating service lead status:', error);
    throw error;
  }
}

/**
 * Append admin note to service lead
 */
export async function appendAdminNote(leadId: string, note: string, adminName: string): Promise<void> {
  // Get current lead to append note
  const { data: lead, error: fetchError } = await supabase
    .from('service_leads')
    .select('admin_notes')
    .eq('id', leadId)
    .single();

  if (fetchError) {
    console.error('Error fetching lead for note:', fetchError);
    throw fetchError;
  }

  const timestamp = new Date().toLocaleString('vi-VN');
  const existingNotes = lead?.admin_notes || '';
  const newNotes = existingNotes
    ? `${existingNotes}\n---\n[${timestamp} - ${adminName}]: ${note}`
    : `[${timestamp} - ${adminName}]: ${note}`;

  const { error } = await supabase
    .from('service_leads')
    .update({ admin_notes: newNotes })
    .eq('id', leadId);

  if (error) {
    console.error('Error appending admin note:', error);
    throw error;
  }
}

/**
 * Get service lead statistics using count queries (efficient)
 */
export async function getServiceLeadStats(): Promise<ServiceLeadStats> {
  const counts = await Promise.all([
    supabase.from('service_leads').select('*', { count: 'exact', head: true }),
    supabase.from('service_leads').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('service_leads').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
    supabase.from('service_leads').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('service_leads').select('*', { count: 'exact', head: true }).in('status', ['completed', 'rated']),
    supabase.from('service_leads').select('*', { count: 'exact', head: true }).in('status', ['cancelled', 'rejected']),
  ]);

  return {
    total: counts[0].count || 0,
    submitted: counts[1].count || 0,
    assigned: counts[2].count || 0,
    confirmed: counts[3].count || 0,
    completed: counts[4].count || 0,
    cancelled: counts[5].count || 0,
  };
}
