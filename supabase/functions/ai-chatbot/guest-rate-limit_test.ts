import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildGuestFingerprintSource, consumeGuestRateLimit, hashGuestFingerprint } from './guest-rate-limit.ts';

Deno.test('buildGuestFingerprintSource includes the request fingerprint parts without storing raw structure', () => {
  const source = buildGuestFingerprintSource(new Request('https://example.com', {
    headers: {
      'x-forwarded-for': '1.2.3.4, 9.9.9.9',
      'user-agent': 'ROMI test agent',
      'accept-language': 'vi-VN',
      origin: 'https://rommz.vn',
    },
  }));

  assertEquals(source, '1.2.3.4|ROMI test agent|vi-VN|https://rommz.vn');
});

Deno.test('hashGuestFingerprint is deterministic', async () => {
  const first = await hashGuestFingerprint('guest-source');
  const second = await hashGuestFingerprint('guest-source');

  assertEquals(first, second);
  assertEquals(first.length, 64);
});

Deno.test('consumeGuestRateLimit delegates to the durable rpc and reads the allow flag', async () => {
  const calls: Array<{ fn: string; args?: Record<string, unknown> }> = [];
  const allowed = await consumeGuestRateLimit(
    {
      rpc: async (fn, args) => {
        calls.push({ fn, args });
        return {
          data: [{ allowed: false, hit_count: 10 }],
          error: null,
        };
      },
    },
    'fingerprint-hash',
    10,
  );

  assertEquals(allowed, false);
  assertEquals(calls[0]?.fn, 'consume_romi_guest_rate_limit');
  assertEquals(calls[0]?.args?.p_fingerprint_hash, 'fingerprint-hash');
  assertEquals(calls[0]?.args?.p_limit, 10);
});
