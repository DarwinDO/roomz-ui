/**
 * Profile API Service
 * Interact with 'users' table for profile updates
 */
import imageCompression from "browser-image-compression";
import { storage, supabase } from "@/lib/supabase";
import { buildProfileUpdatePayload, type UpdateProfileData, validateAvatarFile } from "./profile.utils";

export type { UpdateProfileData } from "./profile.utils";
export { AVATAR_MAX_SIZE_BYTES, validateAvatarFile } from "./profile.utils";

const avatarCompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 512,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.82,
};

function getAvatarFallbackExtension(fileType: string) {
  switch (fileType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

async function buildAvatarUploadFile(file: File): Promise<File> {
  try {
    const compressedBlob = await imageCompression(file, avatarCompressionOptions);
    return new File([compressedBlob], "avatar.webp", { type: "image/webp" });
  } catch (error) {
    console.error("Error compressing avatar:", error);
    return new File([file], `avatar.${getAvatarFallbackExtension(file.type)}`, {
      type: file.type,
    });
  }
}

/**
 * Upload avatar file to Supabase Storage and return its public URL
 */
export async function uploadAvatarFile(userId: string, file: File): Promise<string> {
  const validation = validateAvatarFile(file);

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const avatarFile = await buildAvatarUploadFile(file);

  try {
    const { url } = await storage.uploadAvatar(userId, avatarFile);
    return `${url}?v=${Date.now()}`;
  } catch (error) {
    console.error("Error uploading avatar:", error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("row-level security")
        || message.includes("permission")
        || message.includes("violates")
      ) {
        throw new Error("Không có quyền tải ảnh đại diện. Vui lòng đăng nhập lại.");
      }

      if (message.includes("bucket") || message.includes("not found")) {
        throw new Error("Bucket ảnh đại diện chưa được cấu hình.");
      }
    }

    throw new Error("Không thể tải ảnh đại diện lên lúc này.");
  }
}

/**
 * Update user profile in database
 */
export async function updateProfile(userId: string, data: UpdateProfileData): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(buildProfileUpdatePayload(data))
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}
