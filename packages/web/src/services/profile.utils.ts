export interface UpdateProfileData {
  full_name: string;
  major?: string | null;
  university?: string | null;
  bio?: string | null;
  phone?: string | null;
  graduation_year?: number | null;
  avatar_url?: string | null;
}

export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function validateAvatarFile(
  file: Pick<File, "size" | "type">,
): { isValid: boolean; error?: string } {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return {
      isValid: false,
      error: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP",
    };
  }

  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return {
      isValid: false,
      error: "Ảnh đại diện không được vượt quá 5MB",
    };
  }

  return { isValid: true };
}

export function buildProfileUpdatePayload(data: UpdateProfileData) {
  const updates: Record<string, string | number | null> = {
    full_name: data.full_name,
    major: data.major ?? null,
    university: data.university ?? null,
    bio: data.bio ?? null,
    phone: data.phone ?? null,
    graduation_year: data.graduation_year ?? null,
    updated_at: new Date().toISOString(),
  };

  if (data.avatar_url !== undefined) {
    updates.avatar_url = data.avatar_url;
  }

  return updates;
}
