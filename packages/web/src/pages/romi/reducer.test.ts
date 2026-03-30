import { expect, test } from "@playwright/test";
import { applyStreamEvent, createInitialWorkspaceState } from "./reducer";
import type { AIChatStreamEvent } from "@roomz/shared/services/ai-chatbot";

test.describe("romi workspace reducer", () => {
  test("merges streaming tokens, tool results, and final metadata into the placeholder message", () => {
    const createdAt = "2026-03-27T00:00:00.000Z";
    const placeholderId = "assistant-placeholder";
    let state = createInitialWorkspaceState("guest");

    state = applyStreamEvent(state, {
      type: "token",
      text: "ROMI đang ",
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    state = applyStreamEvent(state, {
      type: "tool_result",
      tool: {
        name: "search_rooms",
        status: "completed",
      },
      actions: [{ type: "open_search", label: "Mở tìm phòng", href: "/search" }],
      sources: ["Nguồn phòng đang mở"],
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    state = applyStreamEvent(state, {
      type: "final",
      sessionId: null,
      messageId: "assistant-final",
      message: "ROMI đang có 3 phòng phù hợp.",
      metadata: {
        actions: [{ type: "open_room", label: "Xem phòng", href: "/room/1" }],
        sources: ["Local Passport"],
        journeyState: {
          stage: "recommend",
          summary: "Đang tìm phòng • khu vực Quận 7",
        },
      },
      session: null,
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    const finalMessage = state.messages.at(-1);

    expect(finalMessage?.id).toBe("assistant-final");
    expect(finalMessage?.text).toBe("ROMI đang có 3 phòng phù hợp.");
    expect(finalMessage?.actions).toHaveLength(2);
    expect(finalMessage?.sources).toEqual(["Nguồn phòng đang mở", "Local Passport"]);
    expect(state.journeyState.summary).toContain("Quận 7");
  });

  test("stores clarification requests and handoff events in state", () => {
    const createdAt = "2026-03-27T00:00:00.000Z";
    const placeholderId = "assistant-placeholder";
    let state = createInitialWorkspaceState("guest");

    state = applyStreamEvent(state, {
      type: "clarification_request",
      clarification: {
        prompt: "Bạn muốn ở khu vực nào và khoảng ngân sách bao nhiêu?",
        missingFields: ["khu_vuc", "ngan_sach"],
      },
      journeyState: {
        stage: "clarify",
        missingFields: ["khu_vuc", "ngan_sach"],
      },
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    state = applyStreamEvent(state, {
      type: "handoff",
      handoff: {
        href: "/login",
        label: "Đăng nhập để tiếp tục sâu hơn",
        reason: "Bước tiếp theo cần lưu ngữ cảnh.",
        requiresAuth: true,
      },
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    expect(state.clarification?.missingFields).toEqual(["khu_vuc", "ngan_sach"]);
    expect(state.handoff?.href).toBe("/login");
    expect(state.journeyState.stage).toBe("clarify");
  });
});
