import { expect, test } from "@playwright/test";
import {
  ROMI_NAME,
  ROMI_SUGGESTED_QUESTIONS,
  ROMI_WELCOME_MESSAGE,
  getRomiAppInfo,
} from "@roomz/shared/constants/romi";

test.describe("ROMI constants", () => {
  test("exposes stable branding and suggested prompts", () => {
    expect(ROMI_NAME).toBe("ROMI");
    expect(ROMI_WELCOME_MESSAGE).toContain("ROMI");
    expect(ROMI_SUGGESTED_QUESTIONS).toContain("Tìm dịch vụ chuyển nhà ở Hà Nội");
  });

  test("returns premium capability copy from the shared source of truth", () => {
    const premiumInfo = getRomiAppInfo("rommz_plus");

    expect(premiumInfo).toContain("49.000đ/tháng");
    expect(premiumInfo).toContain("100 lượt/ngày");
    expect(premiumInfo).toContain("Local Passport");
  });

  test("falls back to general info when topic is missing or unknown", () => {
    expect(getRomiAppInfo(undefined)).toContain("RommZ");
    expect(getRomiAppInfo("unknown-topic")).toContain("RommZ");
  });
});
