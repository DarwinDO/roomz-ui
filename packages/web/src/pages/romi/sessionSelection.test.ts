import { describe, expect, test } from "vitest";
import type { AIChatSession } from "@roomz/shared/services/ai-chatbot";
import { resolveLoadedSessionSelection } from "./sessionSelection";

function createSession(id: string): AIChatSession {
  return {
    id,
    user_id: "user-1",
    title: `Session ${id}`,
    created_at: "2026-03-30T00:00:00.000Z",
    updated_at: "2026-03-30T00:00:00.000Z",
  };
}

describe("romi session selection", () => {
  test("auto-selects the newest saved session on first load", () => {
    const selectedSessionId = resolveLoadedSessionSelection({
      currentSelectedSessionId: null,
      nextSessions: [createSession("session-1"), createSession("session-2")],
      prefersFreshConversation: false,
    });

    expect(selectedSessionId).toBe("session-1");
  });

  test("keeps an explicit fresh draft instead of snapping back to history", () => {
    const selectedSessionId = resolveLoadedSessionSelection({
      currentSelectedSessionId: null,
      nextSessions: [createSession("session-1"), createSession("session-2")],
      prefersFreshConversation: true,
    });

    expect(selectedSessionId).toBeNull();
  });

  test("preserves the active session when it still exists in the loaded list", () => {
    const selectedSessionId = resolveLoadedSessionSelection({
      currentSelectedSessionId: "session-2",
      nextSessions: [createSession("session-1"), createSession("session-2")],
      prefersFreshConversation: false,
    });

    expect(selectedSessionId).toBe("session-2");
  });
});
