/**
 * AI Chatbot API Service (Shared)
 * Platform-agnostic API calls via Supabase Edge Function
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ROMI_EXPERIENCE_VERSION } from "../../constants/romi";
import type {
  AIChatHistoryEntry,
  AIChatMessage,
  AIChatMessageMetadata,
  AIChatRequest,
  AIChatResponse,
  AIChatSession,
  AIChatStreamEvent,
} from "./types";

type SupabaseClientWithInternals = SupabaseClient & {
  functionsUrl?: URL | string;
  supabaseUrl?: string;
};

type ResponseErrorPayload = {
  error?: string;
  message?: string;
  code?: string | number;
  details?: string | null;
};

type SessionMessagePreviewRow = Pick<
  AIChatMessage,
  "session_id" | "role" | "content" | "created_at" | "metadata"
>;

export interface SendAIChatOptions extends Omit<AIChatRequest, "message"> {
  history?: AIChatHistoryEntry[];
}

function formatDetailedError(payload: ResponseErrorPayload | null, fallback: string) {
  const serverMessage = payload?.error || payload?.message;
  if (!serverMessage) return fallback;

  const withCode = payload?.code ? `${serverMessage} (${payload.code})` : serverMessage;
  return payload?.details ? `${withCode}: ${payload.details}` : withCode;
}

async function getAccessTokenOrThrow(supabase: SupabaseClient) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.");
  }

  return accessToken;
}

async function getOptionalAccessToken(supabase: SupabaseClient) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function resolveFunctionUrl(supabase: SupabaseClient, functionName: string) {
  const client = supabase as SupabaseClientWithInternals;
  const functionsUrl = client.functionsUrl as URL | string | undefined;

  if (functionsUrl instanceof URL) {
    return new URL(functionName, `${functionsUrl.href.replace(/\/?$/, "/")}`).toString();
  }

  if (typeof functionsUrl === "string") {
    return new URL(functionName, `${functionsUrl.replace(/\/?$/, "/")}`).toString();
  }

  if (typeof client.supabaseUrl === "string") {
    return new URL(`functions/v1/${functionName}`, client.supabaseUrl).toString();
  }

  throw new Error("Không thể xác định Functions URL của Supabase client.");
}

function getSessionPreview(content: string | null | undefined) {
  if (!content) return null;

  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  return normalized.length > 110 ? `${normalized.slice(0, 107)}...` : normalized;
}

function buildMessagePreview(
  content: string | null | undefined,
  metadata: AIChatMessageMetadata | undefined,
) {
  const summary = metadata?.journeyState?.summary?.trim();
  const resolutionOutcome = metadata?.resolutionOutcome ?? metadata?.journeyState?.resolutionOutcome;

  if (summary && resolutionOutcome && resolutionOutcome !== "needs_clarification") {
    return summary;
  }

  if (metadata?.handoff?.reason?.trim()) {
    return metadata.handoff.reason.trim();
  }

  return getSessionPreview(content);
}

export function getAIChatSessionPreview(session: Pick<AIChatSession, "preview" | "journeyState">) {
  const summary = session.journeyState?.summary?.trim();
  const resolutionOutcome = session.journeyState?.resolutionOutcome;

  if (summary && resolutionOutcome && resolutionOutcome !== "needs_clarification") {
    return summary;
  }

  return session.preview?.trim() || summary || "Tiếp tục đúng ngữ cảnh đang hỏi.";
}

function normalizeRequest(
  message: string,
  sessionIdOrOptions?: string | null | SendAIChatOptions,
): AIChatRequest {
  if (
    sessionIdOrOptions == null ||
    typeof sessionIdOrOptions === "string"
  ) {
    return {
      message,
      sessionId: sessionIdOrOptions ?? undefined,
    };
  }

  return {
    ...sessionIdOrOptions,
    message,
  };
}

async function callAIChatFunction(
  supabase: SupabaseClient,
  request: AIChatRequest,
  stream: boolean,
) {
  const viewerMode = request.viewerMode ?? "user";
  const accessToken = viewerMode === "guest"
    ? await getOptionalAccessToken(supabase)
    : await getAccessTokenOrThrow(supabase);

  const response = await fetch(resolveFunctionUrl(supabase, "ai-chatbot"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      ...request,
      stream,
    } satisfies AIChatRequest),
  });

  return response;
}

export async function sendAIChatMessage(
  supabase: SupabaseClient,
  message: string,
  sessionIdOrOptions?: string | null | SendAIChatOptions,
): Promise<AIChatResponse> {
  const request = normalizeRequest(message, sessionIdOrOptions);
  const response = await callAIChatFunction(supabase, request, false);

  if (!response.ok) {
    const payload = (await response.clone().json().catch(() => null)) as ResponseErrorPayload | null;
    throw new Error(
      formatDetailedError(payload, "Không thể gửi tin nhắn tới ROMI."),
    );
  }

  return await response.json() as AIChatResponse;
}

export async function* sendAIChatMessageStream(
  supabase: SupabaseClient,
  message: string,
  sessionIdOrOptions?: string | null | SendAIChatOptions,
): AsyncGenerator<AIChatStreamEvent, void, void> {
  const request = normalizeRequest(message, sessionIdOrOptions);
  const response = await callAIChatFunction(supabase, request, true);

  if (!response.ok) {
    const payload = (await response.clone().json().catch(() => null)) as ResponseErrorPayload | null;
    throw new Error(
      formatDetailedError(payload, "Không thể mở luồng phản hồi của ROMI lúc này."),
    );
  }

  if (!response.body) {
    throw new Error("ROMI chưa trả về luồng dữ liệu hợp lệ.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) return null;

    const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
    if (!payload || payload === "[DONE]") return null;

    return JSON.parse(payload) as AIChatStreamEvent;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex === -1) break;

      const nextLine = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      const event = flushLine(nextLine);
      if (event) {
        yield event;
      }
    }
  }

  buffer += decoder.decode();
  const trailingEvent = flushLine(buffer);
  if (trailingEvent) {
    yield trailingEvent;
  }
}

export async function getAIChatSessions(supabase: SupabaseClient): Promise<AIChatSession[]> {
  const { data, error } = await supabase
    .from("ai_chat_sessions")
    .select("*")
    .eq("experience_version", ROMI_EXPERIENCE_VERSION)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const sessions = (data || []) as AIChatSession[];
  if (!sessions.length) return [];

  const sessionIds = sessions.map((session) => session.id);
  const { data: rawMessages, error: messagesError } = await supabase
    .from("ai_chat_messages")
    .select("session_id, role, content, created_at, metadata")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (messagesError) {
    return sessions;
  }

  const latestMessageBySession = new Map<string, SessionMessagePreviewRow>();
  for (const row of (rawMessages || []) as SessionMessagePreviewRow[]) {
    if (!latestMessageBySession.has(row.session_id)) {
      latestMessageBySession.set(row.session_id, row);
    }
  }

  return sessions.map((session) => {
    const latest = latestMessageBySession.get(session.id);
    const journeyState = latest?.metadata?.journeyState ?? session.journeyState;
    return {
      ...session,
      preview: buildMessagePreview(latest?.content, latest?.metadata),
      previewRole: latest?.role ?? null,
      lastMessageAt: latest?.created_at ?? session.updated_at,
      intent: latest?.metadata?.intent ?? null,
      contextType: latest?.metadata?.contextType ?? null,
      journeyState,
    };
  });
}

export async function getAIChatMessages(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<AIChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as AIChatMessage[];
}

export async function deleteAIChatSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase.from("ai_chat_sessions").delete().eq("id", sessionId);

  if (error) throw error;
}
