import { describe, expect, test, vi } from "vitest";

import { openRoommateConversation } from "./openRoommateConversation";

describe("openRoommateConversation", () => {
  test("creates or reuses the conversation and navigates to the exact thread", async () => {
    const navigate = vi.fn();
    const startConversationFn = vi.fn().mockResolvedValue({ id: "conversation-123" });

    const conversationId = await openRoommateConversation({
      currentUserId: "current-user",
      otherUserId: "other-user",
      navigate,
      startConversationFn,
    });

    expect(startConversationFn).toHaveBeenCalledWith("other-user", "current-user");
    expect(navigate).toHaveBeenCalledWith("/messages/conversation-123");
    expect(conversationId).toBe("conversation-123");
  });

  test("rejects when the current user is missing", async () => {
    await expect(
      openRoommateConversation({
        currentUserId: null,
        otherUserId: "other-user",
        navigate: vi.fn(),
        startConversationFn: vi.fn(),
      }),
    ).rejects.toThrow("Bạn cần đăng nhập để nhắn tin.");
  });
});
