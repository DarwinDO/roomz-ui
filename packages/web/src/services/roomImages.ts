/**
 * Room Images Upload Service
 * Upload and manage room images via Supabase Storage
 */

import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'room-images';

/**
 * Upload a single room image to Supabase Storage
 * File path format: {userId}/{timestamp}.{ext}
 */
export async function uploadRoomImage(
  userId: string,
  file: File
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!file) {
    throw new Error('File is required');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ chấp nhận file ảnh');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Kích thước file tối đa 5MB');
  }

  // Create unique file path
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const fileName = `${userId}/${timestamp}-${randomId}.${fileExt}`;

  if (import.meta.env.DEV) {
    console.log('[RoomImages] Uploading:', fileName);
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('[RoomImages] Upload error:', error);

    if (error.message.includes('row-level security') || error.message.includes('violates')) {
      throw new Error(
        'Không có quyền upload ảnh. Vui lòng liên hệ admin để kiểm tra Storage policies.'
      );
    }

    if (error.message.includes('not found') || error.message.includes('Bucket')) {
      throw new Error(
        `Bucket "${BUCKET_NAME}" không tồn tại. Vui lòng tạo bucket trong Dashboard.`
      );
    }

    throw error;
  }

  if (import.meta.env.DEV) {
    console.log('[RoomImages] Upload successful:', data?.path);
  }

  // Get public URL (bucket is public)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Upload multiple room images
 * Uses Promise.allSettled to handle partial failures gracefully
 */
export async function uploadMultipleRoomImages(
  userId: string,
  files: File[]
): Promise<string[]> {
  const results = await Promise.allSettled(
    files.map((file) => uploadRoomImage(userId, file))
  );

  const successUrls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successUrls.push(result.value);
    } else {
      errors.push(`File ${index + 1}: ${result.reason?.message || 'Upload failed'}`);
    }
  });

  // Log errors but don't fail if at least some succeeded
  if (errors.length > 0) {
    console.warn('[RoomImages] Some uploads failed:', errors);
  }

  // If all failed, throw error
  if (successUrls.length === 0 && files.length > 0) {
    throw new Error(`Không thể tải ảnh lên: ${errors[0]}`);
  }

  return successUrls;
}

/**
 * Delete a room image
 */
export async function deleteRoomImage(imageUrl: string): Promise<void> {
  // Extract file path from URL
  const urlParts = imageUrl.split('/');
  const bucketIndex = urlParts.findIndex((p) => p === BUCKET_NAME);

  if (bucketIndex !== -1) {
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error('[RoomImages] Delete error:', error);
      throw error;
    }
  }
}
