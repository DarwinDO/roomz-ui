import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
    getMyVerificationStatus,
    submitVerificationRequest,
    type VerificationRequest,
} from '@roomz/shared';

export type DocumentType = 'cccd' | 'passport' | 'student_id';

interface UploadImageResult {
    path: string;
    publicUrl: string;
}

/**
 * Hook for identity verification
 * - Fetches current verification status
 * - Handles image upload to Supabase Storage
 * - Submits verification requests
 */
export function useVerification() {
    const queryClient = useQueryClient();

    const statusQuery = useQuery<VerificationRequest | null, Error>({
        queryKey: ['verification', 'status'],
        queryFn: () => getMyVerificationStatus(supabase),
        staleTime: 60_000,
    });

    const uploadImage = async (
        uri: string,
        userId: string,
        side: 'front' | 'back'
    ): Promise<UploadImageResult> => {
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${userId}_${side}_${Date.now()}.${fileExt}`;
        const filePath = `verifications/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('verifications')
            .upload(filePath, blob, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('verifications')
            .getPublicUrl(filePath);

        return {
            path: filePath,
            publicUrl: urlData.publicUrl,
        };
    };

    const submitMutation = useMutation<void, Error, {
        userId: string;
        documentType: DocumentType;
        frontImageUri: string;
        backImageUri: string;
    }>({
        mutationFn: async ({ userId, documentType, frontImageUri, backImageUri }) => {
            const [frontResult, backResult] = await Promise.all([
                uploadImage(frontImageUri, userId, 'front'),
                uploadImage(backImageUri, userId, 'back'),
            ]);

            await submitVerificationRequest(supabase, userId, documentType, [
                frontResult.publicUrl,
                backResult.publicUrl,
            ]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verification', 'status'] });
        },
    });

    return {
        status: statusQuery.data,
        isLoading: statusQuery.isLoading,
        isError: statusQuery.isError,
        error: statusQuery.error,
        refetch: statusQuery.refetch,
        submit: submitMutation.mutateAsync,
        isSubmitting: submitMutation.isPending,
        submitError: submitMutation.error,
    };
}
