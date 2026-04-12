import { describe, expect, test } from "vitest";
import { applyStreamEvent, buildGuestHistory, createInitialWorkspaceState, romiWorkspaceReducer } from "./reducer";
import type { AIChatStreamEvent } from "@roomz/shared/services/ai-chatbot";

describe("romi workspace reducer", () => {
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

  test("clears stale clarification and handoff state when the user starts a new turn", () => {
    const state = romiWorkspaceReducer(
      {
        ...createInitialWorkspaceState("guest"),
        clarification: {
          prompt: "Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?",
          missingFields: ["ngan_sach"],
        },
        handoff: {
          href: "/login",
          label: "Đăng nhập để tiếp tục",
          reason: "Cần đăng nhập để lưu ngữ cảnh.",
          requiresAuth: true,
        },
      },
      {
        type: "user_message",
        message: {
          id: "user-1",
          role: "user",
          text: "Dưới 5 triệu",
          createdAt: "2026-03-27T00:00:00.000Z",
        },
      },
    );

    expect(state.clarification).toBeNull();
    expect(state.handoff).toBeNull();
  });

  test("does not inject the welcome message while a saved session is hydrating", () => {
    const state = romiWorkspaceReducer(createInitialWorkspaceState("user"), {
      type: "bootstrap",
      viewerMode: "user",
      session: {
        id: "session-1",
        user_id: "user-1",
        title: "Tìm phòng ở Thủ Đức",
        created_at: "2026-03-27T00:00:00.000Z",
        updated_at: "2026-03-27T00:00:00.000Z",
        journeyState: {
          stage: "recommend",
          summary: "Đang tìm phòng • khu vực Thành phố Thủ Đức",
        },
      },
      messages: [],
    });

    expect(state.messages).toHaveLength(0);
    expect(state.journeyState.summary).toContain("Thủ Đức");
  });

  test("clears resolved clarification and handoff state on a normal final reply", () => {
    const createdAt = "2026-03-27T00:00:00.000Z";
    const placeholderId = "assistant-placeholder";
    let state = {
      ...createInitialWorkspaceState("guest"),
      clarification: {
        prompt: "Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?",
        missingFields: ["ngan_sach"],
      },
      handoff: {
        href: "/login",
        label: "Đăng nhập để tiếp tục",
        reason: "Cần đăng nhập để lưu ngữ cảnh.",
        requiresAuth: true,
      },
    };

    state = applyStreamEvent(state, {
      type: "final",
      sessionId: null,
      messageId: "assistant-final",
      message: "Mình đã tìm được vài phòng phù hợp rồi.",
      metadata: {
        journeyState: {
          stage: "recommend",
          summary: "Đang tìm phòng • khu vực Thành phố Thủ Đức • ngân sách tối đa 5.000.000đ",
        },
      },
      session: null,
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    expect(state.clarification).toBeNull();
    expect(state.handoff).toBeNull();
  });

  test("keeps selection metadata in the assistant message and guest history", () => {
    const createdAt = "2026-03-27T00:00:00.000Z";
    const placeholderId = "assistant-placeholder";
    let state = createInitialWorkspaceState("guest");

    state = romiWorkspaceReducer(state, {
      type: "user_message",
      message: {
        id: "user-1",
        role: "user",
        text: "phòng số 2",
        createdAt,
      },
    });

    state = applyStreamEvent(state, {
      type: "final",
      sessionId: null,
      messageId: "assistant-final",
      message: "Mình đã mở đúng phòng bạn chọn.",
      metadata: {
        contextType: "room",
        contextId: "room-2",
        selection: {
          entityType: "room",
          entityId: "room-2",
          resolvedFrom: "ordinal",
          ordinal: 2,
        },
        journeyState: {
          stage: "recommend",
          summary: "Đang tìm phòng • đang mở room",
          activeEntityType: "room",
          activeEntityId: "room-2",
        },
      },
      session: null,
    } satisfies AIChatStreamEvent, placeholderId, createdAt);

    expect(state.messages.at(-1)?.selection?.entityId).toBe("room-2");
    expect(buildGuestHistory(state.messages).at(-1)?.metadata?.selection?.resolvedFrom).toBe("ordinal");
  });
});
