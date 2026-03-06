/**
 * Partner Image Upload Service
 * Xử lý upload ảnh đối tác lên Supabase Storage
 */
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'partner-images';

export interface UploadPartnerImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

/**
 * Upload partner image to Supabase Storage
 * 
 * @param file - File ảnh gốc
 * @param partnerId - ID của partner (để đặt tên file)
 * @param options - Options cho compression
 * @returns URL của ảnh đã upload
 */
export async function uploadPartnerImage(
    file: File,
    partnerId: string,
    options: UploadPartnerImageOptions = {}
): Promise<string> {
    const {
        maxWidth = 800,
        maxHeight = 600,
        quality = 0.8,
    } = options;

    // Compress image trước khi upload
    const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: quality,
    });

    // Tạo tên file unique
    const fileExt = 'webp';
    const fileName = `${partnerId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload lên Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error('Error uploading partner image:', uploadError);

        // Detailed error handling
        const errorMsg = uploadError.message || '';
        if (errorMsg.includes('row-level security') || errorMsg.includes('violates') || errorMsg.includes('permission')) {
            throw new Error('Không có quyền upload ảnh. Vui lòng liên hệ admin để kiểm tra Storage policies.');
        }
        if (errorMsg.includes('not found') || errorMsg.includes('Bucket') || errorMsg.includes('does not exist')) {
            throw new Error(`Bucket "${BUCKET_NAME}" không tồn tại. Vui lòng tạo bucket trong Supabase Dashboard.`);
        }
        if (errorMsg.includes('size limit') || errorMsg.includes('too large')) {
            throw new Error('File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
        }
        throw new Error('Không thể upload ảnh. Vui lòng thử lại sau.');
    }

    // Lấy public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return publicUrl;
}

/**
 * Delete partner image from storage
 * 
 * @param imageUrl - URL của ảnh cần xóa
 */
export async function deletePartnerImage(imageUrl: string): Promise<void> {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/partner-images\/(.+)/);

    if (!pathMatch) {
        console.warn('Invalid partner image URL:', imageUrl);
        return;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error('Error deleting partner image:', error);
        throw new Error('Không thể xóa ảnh.');
    }
}

/**
 * Validate image file trước khi upload
 * 
 * @param file - File cần validate
 * @returns Object với isValid và error message
 */
export function validatePartnerImage(file: File): { isValid: boolean; error?: string } {
    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)',
        };
    }

    // Kiểm tra kích thước (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'Kích thước ảnh không được vượt quá 5MB',
        };
    }

    return { isValid: true };
}
