import type { AIChatSession } from "@roomz/shared/services/ai-chatbot";

interface ResolveLoadedSessionSelectionArgs {
  currentSelectedSessionId: string | null;
  nextSessions: AIChatSession[];
  prefersFreshConversation: boolean;
}

export function resolveLoadedSessionSelection({
  currentSelectedSessionId,
  nextSessions,
  prefersFreshConversation,
}: ResolveLoadedSessionSelectionArgs) {
  if (prefersFreshConversation) {
    return null;
  }

  if (currentSelectedSessionId && nextSessions.some((session) => session.id === currentSelectedSessionId)) {
    return currentSelectedSessionId;
  }

  return nextSessions[0]?.id ?? null;
}
