export function getUtcDateKey(date: Date | number | string = Date.now()): string {
  const resolvedDate = date instanceof Date ? date : new Date(date);
  return resolvedDate.toISOString().slice(0, 10);
}

export function hasUtcDayRolledOver(
  previousUtcDateKey: string | null | undefined,
  now: Date | number | string = Date.now(),
): boolean {
  if (!previousUtcDateKey) {
    return false;
  }

  return previousUtcDateKey !== getUtcDateKey(now);
}

export function getMillisecondsUntilNextUtcMidnight(
  now: Date | number | string = Date.now(),
): number {
  const resolvedDate = now instanceof Date ? now : new Date(now);
  const nextUtcMidnight = Date.UTC(
    resolvedDate.getUTCFullYear(),
    resolvedDate.getUTCMonth(),
    resolvedDate.getUTCDate() + 1,
  );

  return Math.max(0, nextUtcMidnight - resolvedDate.getTime());
}
