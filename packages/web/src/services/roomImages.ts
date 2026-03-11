/**
 * Room Images Upload Service
 * Upload and manage room images via Supabase Storage.
 */

import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'room-images';
const MAX_ROOM_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const STORAGE_PATH_SEGMENT = `/${BUCKET_NAME}/`;

export function validateRoomImage(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Chỉ chấp nhận file ảnh JPEG, PNG hoặc WebP',
    };
  }

  if (file.size > MAX_ROOM_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'Kích thước ảnh không được vượt quá 5MB',
    };
  }

  return { isValid: true };
}

export function extractRoomImageStoragePath(imageUrl: string): string | null {
  try {
    const parsedUrl = new URL(imageUrl);
    const bucketIndex = parsedUrl.pathname.indexOf(STORAGE_PATH_SEGMENT);
    if (bucketIndex === -1) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(bucketIndex + STORAGE_PATH_SEGMENT.length));
  } catch {
    return null;
  }
}

export function isManagedRoomImageUrl(imageUrl: string): boolean {
  return extractRoomImageStoragePath(imageUrl) !== null;
}

/**
 * Upload a single room image to Supabase Storage.
 * File path format: {entityId}/{timestamp}-{random}.{ext}
 */
export async function uploadRoomImage(entityId: string, file: File): Promise<string> {
  if (!entityId) {
    throw new Error('Entity ID is required');
  }

  if (!file) {
    throw new Error('File is required');
  }

  const validation = validateRoomImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error ?? 'File ảnh không hợp lệ');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 8);
  const fileName = `${entityId}/${timestamp}-${randomId}.${fileExt}`;

  if (import.meta.env.DEV) {
    console.log('[RoomImages] Uploading:', fileName);
  }

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    console.error('[RoomImages] Upload error:', error);

    if (error.message.includes('row-level security') || error.message.includes('violates')) {
      throw new Error('Không có quyền upload ảnh. Vui lòng kiểm tra Storage policies.');
    }

    if (error.message.includes('not found') || error.message.includes('Bucket')) {
      throw new Error(`Bucket "${BUCKET_NAME}" không tồn tại. Vui lòng tạo bucket trong Dashboard.`);
    }

    throw error;
  }

  if (import.meta.env.DEV) {
    console.log('[RoomImages] Upload successful:', data?.path);
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return urlData.publicUrl;
}

/**
 * Upload multiple room images.
 * Uses Promise.allSettled to handle partial failures gracefully.
 */
export async function uploadMultipleRoomImages(entityId: string, files: File[]): Promise<string[]> {
  const results = await Promise.allSettled(files.map((file) => uploadRoomImage(entityId, file)));

  const successUrls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successUrls.push(result.value);
    } else {
      errors.push(`File ${index + 1}: ${result.reason?.message || 'Upload failed'}`);
    }
  });

  if (errors.length > 0) {
    console.warn('[RoomImages] Some uploads failed:', errors);
  }

  if (successUrls.length === 0 && files.length > 0) {
    throw new Error(`Không thể tải ảnh lên: ${errors[0]}`);
  }

  return successUrls;
}

/**
 * Delete one room image by URL.
 */
export async function deleteRoomImage(imageUrl: string): Promise<void> {
  const filePath = extractRoomImageStoragePath(imageUrl);
  if (!filePath) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) {
    console.error('[RoomImages] Delete error:', error);
    throw error;
  }
}

/**
 * Delete multiple storage-backed room images.
 */
export async function deleteRoomImages(imageUrls: string[]): Promise<void> {
  const filePaths = Array.from(
    new Set(
      imageUrls
        .map((imageUrl) => extractRoomImageStoragePath(imageUrl))
        .filter((filePath): filePath is string => Boolean(filePath)),
    ),
  );

  if (filePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);
  if (error) {
    console.error('[RoomImages] Bulk delete error:', error);
    throw error;
  }
}
