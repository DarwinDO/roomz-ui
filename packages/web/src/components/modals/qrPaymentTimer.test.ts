import { describe, expect, test } from 'vitest';
import { getRemainingSeconds } from './qrPaymentTimer';

describe('getRemainingSeconds', () => {
  test('returns remaining seconds based on the server expiration time', async () => {
    const now = new Date('2026-03-10T10:00:00.000Z').getTime();
    const expiresAt = '2026-03-10T10:01:30.000Z';

    expect(getRemainingSeconds(expiresAt, now)).toBe(90);
  });

  test('returns zero for invalid or elapsed expiration timestamps', async () => {
    const now = new Date('2026-03-10T10:00:00.000Z').getTime();

    expect(getRemainingSeconds('not-a-date', now)).toBe(0);
    expect(getRemainingSeconds('2026-03-10T09:59:59.000Z', now)).toBe(0);
  });
});
