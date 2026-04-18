import { describe, expect, test } from "vitest";
import {
  ROMI_EXPERIENCE_VERSION,
  ROMI_GUEST_SUGGESTED_QUESTIONS,
  ROMI_NAME,
  ROMI_SUGGESTED_QUESTIONS,
  getRomiAppInfo,
} from "@roomz/shared/constants/romi";
import { ROMI_KNOWLEDGE_DOCUMENTS } from "@roomz/shared/constants/romiKnowledge";
import {
  analyzeRomiIntake,
  buildJourneySummary,
  getAIChatSessionPreview,
} from "@roomz/shared/services/ai-chatbot";

describe("ROMI shared sources of truth", () => {
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
    expect(buildJourneySummary(analysis.journeyState)).toContain("Bạn đang tìm phòng");
    expect(buildJourneySummary(analysis.journeyState)).toContain("Hà Nội");
    expect(buildJourneySummary(analysis.journeyState)).not.toContain("•");
  });

  test("marks onboarding prompts so knowledge retrieval can stay focused", () => {
    const analysis = analyzeRomiIntake("Tôi mới dùng RommZ, nên bắt đầu từ đâu?", {}, "guest");

    expect(analysis.intent).toBe("general");
    expect(analysis.requestedTopics).toContain("onboarding");
    expect(analysis.shouldUseKnowledge).toBe(true);
  });

  test("splits POI hints from malformed budget clauses without polluting area parsing", () => {
    const analysis = analyzeRomiIntake(
      "Tìm phòng gần đại học sư phạm kỹ thuật và từ 5 triệu trở xuống",
      {},
      "guest",
    );

    expect(analysis.intent).toBe("room_search");
    expect(analysis.journeyState.poiHint).toBe("đại học sư phạm kỹ thuật");
    expect(analysis.journeyState.areaHint).toBeNull();
    expect(analysis.journeyState.budgetMax).toBe(5000000);
    expect(analysis.journeyState.budgetConstraintType).toBe("hard_cap");
    expect(analysis.journeyState.summary).not.toContain("và từ 5 triệu");
    expect(analysis.clarification).toBeNull();
  });

  test("supports ascii gan prefixes when users skip Vietnamese diacritics", () => {
    const analysis = analyzeRomiIntake("tim phong gan Bach Khoa duoi 4 trieu", {}, "guest");

    expect(analysis.intent).toBe("room_search");
    expect(analysis.journeyState.poiHint || analysis.journeyState.areaHint).toBe("Bach Khoa");
    expect(analysis.journeyState.budgetMax).toBe(4000000);
  });

  test("repairs mojibake Vietnamese prompts before intake classification", () => {
    const mojibakePrompt = new TextDecoder("latin1").decode(
      new TextEncoder().encode("tôi muốn tìm phòng ở thủ đức dưới 5 triêu"),
    );
    const analysis = analyzeRomiIntake(mojibakePrompt, {}, "guest");

    expect(analysis.intent).toBe("room_search");
    expect(analysis.journeyState.district).toBe("Thành phố Thủ Đức");
    expect(analysis.journeyState.budgetMax).toBe(5000000);
  });

  test("fills terse budget replies when ROMI has just asked for budget", () => {
    const analysis = analyzeRomiIntake(
      "5 triệu nha",
      {
        goal: "find_room",
        city: "TP.HCM",
        budgetMax: 4000000,
        lastAskedField: "ngan_sach",
        missingFields: ["ngan_sach"],
      },
      "guest",
    );

    expect(analysis.journeyState.budgetMax).toBe(5000000);
    expect(analysis.journeyState.budgetConstraintType).toBe("soft_cap");
    expect(analysis.clarification).toBeNull();
    expect(analysis.journeyState.lastAskedField).toBeNull();
  });

  test("does not silently override an existing budget from an out-of-context terse reply", () => {
    const analysis = analyzeRomiIntake(
      "5 triệu nha",
      {
        goal: "find_room",
        city: "TP.HCM",
        budgetMax: 4000000,
        budgetConstraintType: "hard_cap",
      },
      "guest",
    );

    expect(analysis.journeyState.budgetMax).toBe(4000000);
    expect(analysis.journeyState.budgetConstraintType).toBe("hard_cap");
  });

  test("does not keep forcing room_search for short meta reactions with no room cue", () => {
    const analysis = analyzeRomiIntake(
      "rồi tự nhiên hiện cái này làm gì?",
      {
        goal: "find_room",
        city: "TP.HCM",
        district: "Thành phố Thủ Đức",
        budgetMax: 5000000,
        budgetConstraintType: "hard_cap",
      },
      "guest",
    );

    expect(analysis.intent).toBe("general");
    expect(analysis.journeyState.goal).toBe("find_room");
  });

  test("does not misread short complaints containing ga-like substrings as room refinements", () => {
    const analysis = analyzeRomiIntake(
      "ngao a?",
      {
        goal: "find_room",
        district: "Thành phố Thủ Đức",
        budgetMax: 5000000,
        budgetConstraintType: "hard_cap",
        activeEntityType: "room",
        activeEntityId: "776bd8be-f835-44cb-9994-45ce9511de41",
        lastIntent: "room_detail",
        lastResultSetType: "room",
        lastResultIds: [
          "aa35f569-47bd-48cb-82bc-18347c951568",
          "776bd8be-f835-44cb-9994-45ce9511de41",
        ],
        lastResultSourceIntent: "room_search",
      },
      "guest",
    );

    expect(analysis.intent).toBe("general");
    expect(analysis.journeyState.goal).toBe("find_room");
  });

  test("parses approximate and ranged budgets from direct room-search prompts", () => {
    const softCap = analyzeRomiIntake("Mình cần tìm phòng ở Quận 7 tầm 5 triệu", {}, "guest");
    const range = analyzeRomiIntake("Tìm phòng 3 đến 5 triệu ở Hà Nội", {}, "guest");

    expect(softCap.journeyState.budgetMax).toBe(5000000);
    expect(softCap.journeyState.budgetConstraintType).toBe("soft_cap");
    expect(range.journeyState.budgetMin).toBe(3000000);
    expect(range.journeyState.budgetMax).toBe(5000000);
    expect(range.journeyState.budgetConstraintType).toBe("range");
  });

  test("treats an explicit budget clear as no-budget-preference instead of looping the same clarification", () => {
    const analysis = analyzeRomiIntake(
      "không",
      {
        goal: "find_room",
        city: "TP.HCM",
        budgetMax: 4000000,
        budgetConstraintType: "soft_cap",
        lastAskedField: "ngan_sach",
        missingFields: ["ngan_sach"],
      },
      "guest",
    );

    expect(analysis.journeyState.budgetMax).toBeNull();
    expect(analysis.journeyState.budgetConstraintType).toBe("unspecified");
    expect(analysis.clarification).toBeNull();
  });

  test("prefers repaired or resolved journey summaries over stale clarification previews", () => {
    const preview = getAIChatSessionPreview({
      preview: "Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?",
      journeyState: {
        summary: "Bạn đang tìm phòng ở Thành phố Thủ Đức với ngân sách tối đa 5.000.000đ.",
        resolutionOutcome: "repair_after_failed_extraction",
      },
    });

    expect(preview).toContain("Thành phố Thủ Đức");
    expect(preview).not.toContain("Ngân sách bạn muốn giữ");
  });

  test("summarizes active room context in natural language instead of state fragments", () => {
    const summary = buildJourneySummary({
      goal: "find_room",
      district: "Thành phố Thủ Đức",
      budgetMax: 5000000,
      activeEntityType: "room",
      activeEntityId: "room-123",
    });

    expect(summary).toContain("Bạn đang tìm phòng");
    expect(summary).toContain("Thành phố Thủ Đức");
    expect(summary).toContain("tin phòng bạn vừa mở");
    expect(summary).not.toContain("•");
    expect(summary).not.toContain("đang mở room");
  });
});
