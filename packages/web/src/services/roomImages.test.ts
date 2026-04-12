import { describe, expect, test } from 'vitest';
import {
  extractRoomImageStoragePath,
  isManagedRoomImageUrl,
  validateRoomImage,
} from './roomImages';

describe('roomImages', () => {
  test('accepts supported image mime types within size limit', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'room.jpg', {
      type: 'image/jpeg',
    });

    expect(validateRoomImage(file)).toEqual({ isValid: true });
  });

  test('rejects unsupported mime types', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'room.pdf', {
      type: 'application/pdf',
    });

    expect(validateRoomImage(file)).toEqual({
      isValid: false,
      error: 'Chỉ chấp nhận file ảnh JPEG, PNG hoặc WebP',
    });
  });

  test('rejects files larger than 5MB', () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'room.png', {
      type: 'image/png',
    });

    expect(validateRoomImage(file)).toEqual({
      isValid: false,
      error: 'Kích thước ảnh không được vượt quá 5MB',
    });
  });

  test('extractRoomImageStoragePath parses managed storage URLs', () => {
    expect(
      extractRoomImageStoragePath(
        'https://vevnoxlgwisdottaifdn.supabase.co/storage/v1/object/public/room-images/room-1/example.png',
      ),
    ).toBe('room-1/example.png');

    expect(isManagedRoomImageUrl('https://cdn.example.com/external.png')).toBe(false);
  });
});
