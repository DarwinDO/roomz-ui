import { describe, expect, test } from "vitest";
import {
  getMillisecondsUntilNextUtcMidnight,
  getUtcDateKey,
  hasUtcDayRolledOver,
} from "./dailyReset";

describe("dailyReset helpers", () => {
  test("builds a stable UTC date key from timestamps", () => {
    expect(getUtcDateKey("2026-04-13T23:59:59.000Z")).toBe("2026-04-13");
    expect(getUtcDateKey(new Date("2026-04-14T00:00:00.000Z"))).toBe("2026-04-14");
  });

  test("detects when the UTC day has rolled over", () => {
    expect(hasUtcDayRolledOver("2026-04-13", "2026-04-13T23:59:59.000Z")).toBe(false);
    expect(hasUtcDayRolledOver("2026-04-13", "2026-04-14T00:00:00.000Z")).toBe(true);
    expect(hasUtcDayRolledOver(null, "2026-04-14T00:00:00.000Z")).toBe(false);
  });

  test("computes the delay until the next UTC midnight", () => {
    expect(getMillisecondsUntilNextUtcMidnight("2026-04-13T23:59:30.000Z")).toBe(30_000);
    expect(getMillisecondsUntilNextUtcMidnight("2026-04-13T00:00:00.000Z")).toBe(86_400_000);
  });
});
