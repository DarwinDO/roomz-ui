/**
 * ROMI Avatar config — nguồn duy nhất cho ảnh avatar của ROMI.
 *
 * Cách dùng khi có ảnh:
 *   1. Đặt file vào: packages/web/src/assets/logo/romi-avatar.png
 *   2. Bỏ comment 2 dòng import/const bên dưới
 *   3. Xóa dòng `export const ROMI_AVATAR: string | null = null;`
 */

import romiAvatarSrc from "@/assets/logo/romi-avatar.png";
export const ROMI_AVATAR: string | null = romiAvatarSrc;
// export const ROMI_AVATAR: string | null = null;
