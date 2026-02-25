/**
 * TanStack Query Hooks for Profile
 */
import { useMutation } from "@tanstack/react-query";
import { updateProfile, type UpdateProfileData } from "@/services/profile";
import { useAuth } from "@/contexts";
import { toast } from "sonner";

/**
 * Update profile mutation hook
 * Handles profile update with toast notifications and auth refresh
 */
export function useUpdateProfile() {
    const { user, refreshUser } = useAuth();

    return useMutation({
        mutationFn: (data: UpdateProfileData) => {
            if (!user) {
                throw new Error("Not authenticated");
            }
            return updateProfile(user.id, data);
        },
        onSuccess: async () => {
            toast.success("Cập nhật hồ sơ thành công!");
            await refreshUser();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Không thể cập nhật hồ sơ");
        },
    });
}
