export function getRemainingSeconds(expiresAt: string, now = Date.now()): number {
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return 0;
  }

  return Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
}
