import { expect, test } from "@playwright/test";
import {
  ROMI_EXPERIENCE_VERSION,
  ROMI_GUEST_SUGGESTED_QUESTIONS,
  ROMI_NAME,
  ROMI_SUGGESTED_QUESTIONS,
  getRomiAppInfo,
} from "@roomz/shared/constants/romi";
import { ROMI_KNOWLEDGE_DOCUMENTS } from "@roomz/shared/constants/romiKnowledge";
import { analyzeRomiIntake, buildJourneySummary } from "@roomz/shared/services/ai-chatbot";

test.describe("ROMI shared sources of truth", () => {
  test("exposes stable branding, prompts, and experience version", () => {
    expect(ROMI_NAME).toBe("ROMI");
    expect(ROMI_EXPERIENCE_VERSION).toBe("romi_v3");
    expect(ROMI_SUGGESTED_QUESTIONS).toContain("Tìm dịch vụ chuyển nhà ở Hà Nội");
    expect(ROMI_GUEST_SUGGESTED_QUESTIONS).toContain("Tôi nên bắt đầu tìm phòng từ đâu?");
  });

  test("keeps premium copy and curated knowledge corpus aligned", () => {
    const premiumInfo = getRomiAppInfo("rommz_plus");
    const premiumKnowledge = ROMI_KNOWLEDGE_DOCUMENTS.find((document) => document.slug === "rommz-plus-pricing");

    expect(premiumInfo).toContain("39.000đ/tháng");
    expect(premiumInfo).toContain("100 lượt/ngày");
    expect(premiumKnowledge?.chunks.join("\n")).toContain("39.000đ mỗi tháng");
    expect(premiumKnowledge?.chunks.join("\n")).toContain("100 lượt mỗi ngày");
  });

  test("extracts journey state and clarification needs from Vietnamese room-seeking prompts", () => {
    const analysis = analyzeRomiIntake("Mình cần tìm phòng gần Bách Khoa ở Hà Nội dưới 4 triệu", {}, "guest");

    expect(analysis.intent).toBe("room_search");
    expect(analysis.journeyState.city).toBe("Hà Nội");
    expect(analysis.journeyState.areaHint).toContain("Bách Khoa");
    expect(analysis.journeyState.budgetMax).toBe(4000000);
    expect(analysis.clarification).toBeNull();
    expect(buildJourneySummary(analysis.journeyState)).toContain("Hà Nội");
  });

  test("marks onboarding prompts so knowledge retrieval can stay focused", () => {
    const analysis = analyzeRomiIntake("Tôi mới dùng RommZ, nên bắt đầu từ đâu?", {}, "guest");

    expect(analysis.intent).toBe("general");
    expect(analysis.requestedTopics).toContain("onboarding");
    expect(analysis.shouldUseKnowledge).toBe(true);
  });
});
