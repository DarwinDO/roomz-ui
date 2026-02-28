/**
 * Community Images Upload Service
 * Upload and manage community post images via Supabase Storage
 * with client-side compression
 */

import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'community-images';

// Compression options for WebP conversion
const compressionOptions = {
    maxSizeMB: 2, // Max 2MB after compression
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    fileType: 'image/webp' as const, // Convert to WebP
};

/**
 * Compress an image file
 * Returns compressed file as Blob
 */
async function compressImage(file: File): Promise<Blob> {
    try {
        const compressedBlob = await imageCompression(file, compressionOptions);
        return compressedBlob;
    } catch (error) {
        console.error('[CommunityImages] Compression error:', error);
        throw new Error('Không thể nén ảnh. Vui lòng thử ảnh khác.');
    }
}

/**
 * Upload a single community image to Supabase Storage
 * File path format: {userId}/{timestamp}-{randomId}.webp
 */
export async function uploadCommunityImage(
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

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Kích thước file tối đa 10MB');
    }

    // Compress image first
    let compressedBlob: Blob;
    try {
        compressedBlob = await compressImage(file);
    } catch {
        // If compression fails, try with original file
        compressedBlob = file;
    }

    // Create unique file path (always WebP)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId}/${timestamp}-${randomId}.webp`;

    console.log('[CommunityImages] Uploading:', fileName, 'Original size:', file.size, 'Compressed:', compressedBlob.size);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, compressedBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp',
        });

    if (error) {
        console.error('[CommunityImages] Upload error:', error);

        if (error.message.includes('row-level security') || error.message.includes('violates')) {
            throw new Error('Không có quyền upload ảnh. Vui lòng đăng nhập lại.');
        }

        if (error.message.includes('not found') || error.message.includes('Bucket')) {
            throw new Error(`Bucket "${BUCKET_NAME}" không tồn tại. Vui liên hệ admin.`);
        }

        throw error;
    }

    console.log('[CommunityImages] Upload successful:', data?.path);

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

/**
 * Upload multiple community images
 * Max 3 images per post, max 2MB each after compression
 * Uses Promise.allSettled to handle partial failures gracefully
 */
export async function uploadMultipleCommunityImages(
    userId: string,
    files: File[]
): Promise<string[]> {
    // Limit to max 3 images
    const filesToUpload = files.slice(0, 3);

    if (filesToUpload.length === 0) {
        return [];
    }

    const results = await Promise.allSettled(
        filesToUpload.map((file) => uploadCommunityImage(userId, file))
    );

    const successUrls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successUrls.push(result.value);
        } else {
            errors.push(`Ảnh ${index + 1}: ${result.reason?.message || 'Upload failed'}`);
        }
    });

    // Log errors but don't fail if at least some succeeded
    if (errors.length > 0) {
        console.warn('[CommunityImages] Some uploads failed:', errors);
    }

    // If all failed, throw error
    if (successUrls.length === 0 && filesToUpload.length > 0) {
        throw new Error(`Không thể tải ảnh lên: ${errors[0]}`);
    }

    return successUrls;
}

/**
 * Delete a community image
 */
export async function deleteCommunityImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex((p) => p === BUCKET_NAME);

    if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

        if (error) {
            console.error('[CommunityImages] Delete error:', error);
            throw error;
        }
    }
}
