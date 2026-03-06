/**
 * React Query hooks for Partner Image Upload
 */
import { useMutation } from '@tanstack/react-query';
import { uploadPartnerImage, deletePartnerImage, validatePartnerImage } from '@/services/partnerImages';
import { toast } from 'sonner';

/**
 * Hook upload ảnh đối tác
 */
export function useUploadPartnerImage() {
    return useMutation({
        mutationFn: ({ file, partnerId }: { file: File; partnerId: string }) =>
            uploadPartnerImage(file, partnerId),
        onError: (error: Error) => {
            toast.error('Upload ảnh thất bại', {
                description: error.message,
            });
        },
    });
}

/**
 * Hook xóa ảnh đối tác
 */
export function useDeletePartnerImage() {
    return useMutation({
        mutationFn: deletePartnerImage,
        onError: (error: Error) => {
            toast.error('Xóa ảnh thất bại', {
                description: error.message,
            });
        },
    });
}

export { validatePartnerImage };
