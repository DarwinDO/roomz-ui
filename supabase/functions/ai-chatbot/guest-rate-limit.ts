type AdminClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => unknown;
};

const RATE_WINDOW_MS = 60_000;

function toHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function buildGuestFingerprintSource(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'guest';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const acceptLanguage = req.headers.get('accept-language') || 'unknown';
  const origin = req.headers.get('origin') || 'unknown';

  return `${forwardedFor}|${userAgent.slice(0, 160)}|${acceptLanguage.slice(0, 64)}|${origin.slice(0, 120)}`;
}

export async function hashGuestFingerprint(source: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return toHex(new Uint8Array(digest));
}

export async function consumeGuestRateLimit(
  adminClient: AdminClient,
  fingerprintHash: string,
  limit: number,
) {
  const now = new Date();
  const bucketStart = new Date(now);
  bucketStart.setSeconds(0, 0);

  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);
  const { data, error } = await adminClient.rpc('consume_romi_guest_rate_limit', {
    p_fingerprint_hash: fingerprintHash,
    p_bucket_start: bucketStart.toISOString(),
    p_window_start: windowStart.toISOString(),
    p_limit: limit,
  }) as {
    data?: Array<{ allowed?: boolean; hit_count?: number }> | { allowed?: boolean; hit_count?: number } | null;
    error?: { message?: string } | null;
  };

  if (error) {
    console.warn('Guest rate limit lookup failed, allowing request:', error.message);
    return true;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row?.allowed !== false;
}
