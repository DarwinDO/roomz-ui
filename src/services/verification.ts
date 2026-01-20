/**
 * Verification API Service
 * Upload and manage verification documents via Supabase Storage
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export type VerificationType = Database['public']['Enums']['verification_type'];
export type VerificationStatus = Database['public']['Enums']['verification_status'];

export interface VerificationDocument {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus | null;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  additionalDocuments: string[] | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface VerificationProgress {
  idVerified: boolean;
  photoVerified: boolean;
  landlordVerified: boolean;
  overallStatus: 'not_started' | 'in_progress' | 'verified';
}

const BUCKET_NAME = 'verifications';

/**
 * Upload a verification document to Supabase Storage
 * 
 * IMPORTANT: RLS Policy must exist in Supabase for this to work.
 * Run the SQL in supabase/migrations/001_rpc_functions.sql to create the policies.
 * 
 * File path format: {userId}/{type}/{timestamp}.{ext}
 * This matches the RLS policy: (storage.foldername(name))[1] = auth.uid()
 */
export async function uploadVerificationDocument(
  userId: string,
  file: File,
  type: VerificationType
): Promise<string> {
  // Validate inputs
  if (!userId) {
    throw new Error('User ID is required for uploading verification documents');
  }
  
  if (!file) {
    throw new Error('File is required');
  }

  // Create a unique file path: {userId}/{type}/{timestamp}.{ext}
  // This format is required for RLS policy to work
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const fileName = `${userId}/${type}/${timestamp}.${fileExt}`;

  console.log('[Verification] Uploading file:', fileName);

  // Upload to Supabase Storage
  const { data, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true, // Allow overwriting existing files
      contentType: file.type,
    });

  if (uploadError) {
    console.error('[Verification] Upload error:', uploadError);
    
    // Check for RLS policy error
    if (uploadError.message.includes('row-level security') || 
        uploadError.message.includes('violates') ||
        (uploadError as { statusCode?: string }).statusCode === '403') {
      throw new Error(
        'Không có quyền upload file. Vui lòng liên hệ admin để kiểm tra RLS policies trong Supabase Storage.'
      );
    }
    
    // Check for bucket not found
    if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
      throw new Error(
        `Bucket "${BUCKET_NAME}" không tồn tại. Vui lòng tạo bucket trong Supabase Dashboard > Storage.`
      );
    }
    
    throw uploadError;
  }

  console.log('[Verification] Upload successful:', data?.path);

  // Get signed URL (for private bucket) or public URL
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

  if (signedUrlError) {
    console.warn('[Verification] Could not create signed URL, using public URL');
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  }

  return signedUrlData.signedUrl;
}

/**
 * Upload multiple verification photos (e.g., 360 room photos)
 */
export async function uploadMultiplePhotos(
  userId: string,
  files: File[],
  type: VerificationType = 'room_photos'
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadVerificationDocument(userId, file, type)
  );

  return Promise.all(uploadPromises);
}

/**
 * Submit verification request to database
 */
export async function submitVerificationRequest(
  userId: string,
  type: VerificationType,
  fileUrls: string[]
): Promise<void> {
  // Create verification record with proper schema
  const record = {
    user_id: userId,
    verification_type: type,
    document_front_url: fileUrls[0] || null,
    document_back_url: fileUrls[1] || null,
    additional_documents: fileUrls.length > 2 ? fileUrls.slice(2) : null,
    status: 'pending' as VerificationStatus,
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('verifications')
    .insert(record);

  if (error) {
    // If table doesn't exist, just log
    if (error.code === '42P01') {
      console.warn('verifications table does not exist, skipping database insert');
      return;
    }
    throw error;
  }

  // Update user verification status
  await supabase
    .from('users')
    .update({
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', userId);
}

/**
 * Get user's verification progress
 */
export async function getVerificationProgress(userId: string): Promise<VerificationProgress> {
  const { data, error } = await supabase
    .from('verifications')
    .select('verification_type, status')
    .eq('user_id', userId);

  if (error) {
    // If table doesn't exist, return default
    if (error.code === '42P01') {
      return {
        idVerified: false,
        photoVerified: false,
        landlordVerified: false,
        overallStatus: 'not_started',
      };
    }
    throw error;
  }

  const verifications = data || [];
  
  // Check ID verification (id_card or student_card)
  const idVerified = verifications.some(
    (v) => (v.verification_type === 'id_card' || v.verification_type === 'student_card') && v.status === 'approved'
  );
  // Check photo verification (room_photos)
  const photoVerified = verifications.some(
    (v) => v.verification_type === 'room_photos' && v.status === 'approved'
  );
  // Check landlord/email verification
  const landlordVerified = verifications.some(
    (v) => v.verification_type === 'email' && v.status === 'approved'
  );

  let overallStatus: VerificationProgress['overallStatus'] = 'not_started';
  if (idVerified && photoVerified && landlordVerified) {
    overallStatus = 'verified';
  } else if (verifications.length > 0) {
    overallStatus = 'in_progress';
  }

  return {
    idVerified,
    photoVerified,
    landlordVerified,
    overallStatus,
  };
}

/**
 * Get all verification documents for a user
 */
export async function getUserVerifications(userId: string): Promise<VerificationDocument[]> {
  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return [];
    }
    throw error;
  }

  return (data || []).map((doc) => ({
    id: doc.id,
    userId: doc.user_id,
    type: doc.verification_type,
    status: doc.status,
    documentFrontUrl: doc.document_front_url,
    documentBackUrl: doc.document_back_url,
    additionalDocuments: doc.additional_documents as string[] | null,
    submittedAt: doc.submitted_at,
    reviewedAt: doc.reviewed_at,
    rejectionReason: doc.rejection_reason,
  }));
}

/**
 * Delete a verification document
 */
export async function deleteVerificationDocument(
  documentId: string,
  fileUrl: string
): Promise<void> {
  // Extract file path from URL
  const urlParts = fileUrl.split('/');
  const bucketIndex = urlParts.findIndex((p) => p === BUCKET_NAME || p === 'public');
  if (bucketIndex !== -1) {
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  }

  // Delete from database
  await supabase
    .from('verifications')
    .delete()
    .eq('id', documentId);
}
