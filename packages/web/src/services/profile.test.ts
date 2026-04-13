import { describe, expect, test } from "vitest";
import {
  AVATAR_MAX_SIZE_BYTES,
  buildProfileUpdatePayload,
  validateAvatarFile,
} from "./profile.utils";

describe("profile helpers", () => {
  test("accepts supported avatar image types within the size limit", () => {
    const result = validateAvatarFile({
      size: AVATAR_MAX_SIZE_BYTES,
      type: "image/png",
    } as Pick<File, "size" | "type">);

    expect(result).toEqual({ isValid: true });
  });

  test("rejects unsupported avatar file types", () => {
    const result = validateAvatarFile({
      size: 1024,
      type: "application/pdf",
    } as Pick<File, "size" | "type">);

    expect(result).toEqual({
      isValid: false,
      error: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP",
    });
  });

  test("rejects avatar files larger than 5MB", () => {
    const result = validateAvatarFile({
      size: AVATAR_MAX_SIZE_BYTES + 1,
      type: "image/jpeg",
    } as Pick<File, "size" | "type">);

    expect(result).toEqual({
      isValid: false,
      error: "Ảnh đại diện không được vượt quá 5MB",
    });
  });

  test("includes avatar_url in the persisted profile payload when provided", () => {
    const payload = buildProfileUpdatePayload({
      full_name: "Nguyen Van A",
      avatar_url: "https://cdn.roomz.vn/avatar.webp?v=123",
    });

    expect(payload).toMatchObject({
      full_name: "Nguyen Van A",
      avatar_url: "https://cdn.roomz.vn/avatar.webp?v=123",
      major: null,
      university: null,
      bio: null,
      phone: null,
      graduation_year: null,
    });
    expect(payload).toHaveProperty("updated_at");
  });
});
