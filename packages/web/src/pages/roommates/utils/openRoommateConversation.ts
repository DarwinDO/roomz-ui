import { startConversation } from "@/services/chat";

type StartConversationFn = typeof startConversation;

interface OpenRoommateConversationArgs {
  currentUserId?: string | null;
  otherUserId?: string | null;
  navigate: (to: string) => void;
  startConversationFn?: StartConversationFn;
}

export async function openRoommateConversation({
  currentUserId,
  otherUserId,
  navigate,
  startConversationFn = startConversation,
}: OpenRoommateConversationArgs) {
  if (!currentUserId) {
    throw new Error("Bạn cần đăng nhập để nhắn tin.");
  }

  if (!otherUserId) {
    throw new Error("Không thể mở cuộc trò chuyện vì thiếu người nhận.");
  }

  const conversation = await startConversationFn(otherUserId, currentUserId);

  if (!conversation?.id) {
    throw new Error("Không thể mở cuộc trò chuyện lúc này.");
  }

  navigate(`/messages/${conversation.id}`);
  return conversation.id;
}
