import {
  memo,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  History,
  Loader2,
  LogIn,
  MessageSquarePlus,
  Search,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts";
import { createPublicMotion } from "@/lib/motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  trackRomiActionClicked,
  trackRomiError,
  trackRomiOpened,
  trackRomiSuggestedPromptClicked,
} from "@/services/analyticsTracking";
import {
  deleteAIChatSession,
  getAIChatMessages,
  getAIChatSessionPreview,
  getAIChatSessions,
  sendAIChatMessageStream,
  type AIChatHistoryEntry,
  type AIChatSession,
  type RomiChatAction,
  type RomiJourneyState,
  type RomiViewerMode,
} from "@roomz/shared/services/ai-chatbot";
import {
  ROMI_EXPERIENCE_VERSION,
  ROMI_GUEST_SUGGESTED_QUESTIONS,
  ROMI_NAME,
  ROMI_SUGGESTED_QUESTIONS,
} from "@roomz/shared/constants/romi";
import {
  createInitialWorkspaceState,
  mapStoredMessage,
  romiWorkspaceReducer,
  type RomiDisplayMessage,
} from "./romi/reducer";
import { resolveLoadedSessionSelection } from "./romi/sessionSelection";

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Vừa xong";

  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: vi });
  } catch {
    return "Vừa xong";
  }
}

function formatSessionTitle(session: AIChatSession | null | undefined) {
  return session?.title?.trim() || "Luồng mới";
}

function formatSessionPreview(session: AIChatSession) {
  return getAIChatSessionPreview(session);
}

function upsertSessions(current: AIChatSession[], incoming: AIChatSession) {
  const next = [incoming, ...current.filter((session) => session.id !== incoming.id)];
  return next.sort(
    (left, right) =>
      new Date(right.lastMessageAt || right.updated_at).getTime() -
      new Date(left.lastMessageAt || left.updated_at).getTime(),
  );
}

function buildGuestHistory(messages: RomiDisplayMessage[]): AIChatHistoryEntry[] {
  return messages
    .filter((message) => !message.isStreaming)
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.text,
      metadata: {
        actions: message.actions,
        sources: message.sources,
        knowledgeSources: message.knowledgeSources,
        intent: message.intent as never,
        contextType: message.contextType ?? null,
        contextId: message.contextId ?? null,
        clarification: message.clarification ?? null,
        handoff: message.handoff ?? null,
        journeyState: message.journeyState ?? undefined,
      },
  }));
}

const DEFAULT_JOURNEY_SUMMARY = `${ROMI_NAME} đang chờ bạn mô tả nhu cầu.`;

function hasMeaningfulJourneySummary(journeyState: RomiJourneyState) {
  const summary = journeyState.summary?.trim();
  return Boolean(summary && summary !== DEFAULT_JOURNEY_SUMMARY);
}

function buildJourneyChips(journeyState: RomiJourneyState) {
  const chips: string[] = [];

  if (journeyState.city) chips.push(journeyState.city);
  if (journeyState.district) chips.push(journeyState.district);
  if (typeof journeyState.budgetMax === "number") {
    chips.push(`Tối đa ${new Intl.NumberFormat("vi-VN").format(journeyState.budgetMax)}đ`);
  }
  if (journeyState.roomType) chips.push(journeyState.roomType);

  return chips;
}

const PromptChips = memo(function PromptChips({
  prompts,
  disabled,
  onPrompt,
}: {
  prompts: readonly string[];
  disabled: boolean;
  onPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPrompt(prompt)}
          disabled={disabled}
          className="rounded-full border border-slate-200 bg-white/88 px-4 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
});

const SessionRail = memo(function SessionRail({
  sessions,
  sessionsLoading,
  searchQuery,
  onSearchChange,
  selectedSessionId,
  deletingSessionId,
  onSelect,
  onDelete,
}: {
  sessions: AIChatSession[];
  sessionsLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSessionId: string | null;
  deletingSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">History</p>
      <h2 className="mt-2 font-display text-2xl font-black tracking-[-0.04em] text-slate-900">
        Lịch sử hội thoại
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Mở lại thread cũ hoặc xoá những luồng bạn không cần nữa.
      </p>

      <div className="mt-4 rounded-[22px] bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Search className="h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm session..."
            className="h-auto border-none bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {sessionsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-skeleton rounded-[22px] bg-slate-100" />
          ))
        ) : sessions.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            ROMI sẽ giữ lại session <span className="font-mono">{ROMI_EXPERIENCE_VERSION}</span> mới của bạn tại đây.
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelect(session.id)}
              className={cn(
                "group w-full rounded-[22px] border px-4 py-4 text-left transition",
                session.id === selectedSessionId
                  ? "border-[#0f172a]/12 bg-[#f8fafc]"
                  : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold tracking-[-0.02em] text-slate-900">
                    {formatSessionTitle(session)}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {formatRelativeTime(session.lastMessageAt || session.updated_at)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full opacity-0 transition group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(session.id);
                  }}
                  disabled={deletingSessionId === session.id}
                >
                  {deletingSessionId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{formatSessionPreview(session)}</p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
});

const MessageCard = memo(function MessageCard({
  message,
  onAction,
}: {
  message: RomiDisplayMessage;
  onAction: (action: RomiChatAction) => void;
}) {
  return (
    <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-[26px] px-5 py-4 shadow-soft",
          message.role === "user"
            ? "bg-[image:linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-white"
            : "border border-slate-200 bg-white text-slate-900",
        )}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-8">
          {message.text || (message.isStreaming ? "ROMI đang ghép câu trả lời..." : "ROMI chưa có thêm nội dung cho lượt này.")}
        </p>

        {message.sources?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.sources.map((source) => (
              <Badge
                key={source}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px]",
                  message.role === "user" ? "bg-white/14 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {source}
              </Badge>
            ))}
          </div>
        ) : null}

        {message.actions?.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {message.actions.map((action) => (
              <button
                key={`${action.type}-${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{action.label}</p>
                    {action.description ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600">{action.description}</p>
                    ) : null}
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-500" />
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className={cn("mt-3 text-xs", message.role === "user" ? "text-white/70" : "text-slate-500")}>
          {formatRelativeTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
});

export default function RomiPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const motionTokens = useMemo(() => createPublicMotion(!!shouldReduceMotion), [shouldReduceMotion]);

  const viewerMode: RomiViewerMode = user ? "user" : "guest";
  const [workspaceState, dispatch] = useReducer(
    romiWorkspaceReducer,
    viewerMode,
    createInitialWorkspaceState,
  );
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const skipHydrationSessionIdRef = useRef<string | null>(null);
  const prefersFreshConversationRef = useRef(false);

  useEffect(() => {
    void trackRomiOpened(user?.id || null);
  }, [user?.id]);

  useEffect(() => {
    prefersFreshConversationRef.current = false;
    dispatch({ type: "reset", viewerMode });
    setSelectedSessionId(null);
    setInputValue("");
  }, [viewerMode]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      prefersFreshConversationRef.current = false;
      setSessions([]);
      setSessionsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setSessionsLoading(true);
      try {
        const nextSessions = await getAIChatSessions(supabase);
        if (cancelled) return;
        startTransition(() => {
          setSessions(nextSessions);
          setSelectedSessionId((current) =>
            resolveLoadedSessionSelection({
              currentSelectedSessionId: current,
              nextSessions,
              prefersFreshConversation: prefersFreshConversationRef.current,
            }),
          );
        });
      } catch (error) {
        console.error("Failed to load ROMI sessions:", error);
        toast.error("Không thể tải session ROMI lúc này.");
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    if (!user || !selectedSessionId) return;
    if (skipHydrationSessionIdRef.current === selectedSessionId) {
      skipHydrationSessionIdRef.current = null;
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      setMessagesLoading(true);
      try {
        const messageRows = await getAIChatMessages(supabase, selectedSessionId);
        if (cancelled) return;
        const session = sessions.find((item) => item.id === selectedSessionId) || null;
        dispatch({
          type: "bootstrap",
          viewerMode,
          session,
          messages: messageRows.map(mapStoredMessage),
        });
      } catch (error) {
        console.error("Failed to hydrate ROMI session:", error);
        toast.error("Không thể tải nội dung session này.");
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, sessions, user, viewerMode]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [workspaceState.messages, workspaceState.streamStatus]);

  const filteredSessions = useMemo(() => {
    if (!deferredSearch.trim()) return sessions;
    const query = deferredSearch.trim().toLowerCase();
    return sessions.filter((session) =>
      [formatSessionTitle(session), formatSessionPreview(session)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearch, sessions]);

  const promptOptions = viewerMode === "guest" ? ROMI_GUEST_SUGGESTED_QUESTIONS : ROMI_SUGGESTED_QUESTIONS;
  const hasConversationStarted = useMemo(
    () => workspaceState.messages.some((message) => message.role === "user"),
    [workspaceState.messages],
  );
  const showHistoryShortcut = viewerMode === "user" && (sessionsLoading || sessions.length > 0);
  const hasMeaningfulJourney = useMemo(
    () => hasMeaningfulJourneySummary(workspaceState.journeyState),
    [workspaceState.journeyState],
  );
  const journeyChips = useMemo(() => buildJourneyChips(workspaceState.journeyState), [workspaceState.journeyState]);
  const activeSession = useMemo(
    () => sessions.find((item) => item.id === selectedSessionId) || workspaceState.session,
    [selectedSessionId, sessions, workspaceState.session],
  );
  const activeSessionTitle = activeSession ? formatSessionTitle(activeSession) : null;
  const workspaceSubtitle = hasMeaningfulJourney
    ? workspaceState.journeyState.summary?.trim()
    : viewerMode === "guest"
      ? "Mô tả khu vực, ngân sách hoặc câu hỏi sản phẩm để ROMI trả lời sát hơn."
      : "Nói nhu cầu hiện tại, ROMI sẽ bám theo đúng thread này thay vì bày thêm các bảng phụ.";

  function handleLogin() {
    navigate("/login", { state: { from: location } });
  }

  function handleCreateConversation() {
    prefersFreshConversationRef.current = true;
    setHistoryOpen(false);
    dispatch({ type: "reset", viewerMode });
    setSelectedSessionId(null);
    setInputValue("");
  }

  function handleSelectSession(sessionId: string) {
    prefersFreshConversationRef.current = false;
    setHistoryOpen(false);
    setSelectedSessionId(sessionId);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!user) return;

    setDeletingSessionId(sessionId);
    try {
      await deleteAIChatSession(supabase, sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      if (selectedSessionId === sessionId) {
        handleCreateConversation();
      }
    } catch (error) {
      console.error("Failed to delete ROMI session:", error);
      toast.error("Không thể xoá session này.");
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleAction(action: RomiChatAction) {
    await trackRomiActionClicked(user?.id || null, action, {
      session_id: selectedSessionId,
      viewer_mode: viewerMode,
    });

    if (action.type === "open_login") {
      handleLogin();
      return;
    }

    navigate(action.href);
  }

  async function handlePrompt(prompt: string) {
    await trackRomiSuggestedPromptClicked(user?.id || null, prompt);
    setInputValue(prompt);
    await handleSend(prompt);
  }

  async function handleSend(override?: string) {
    const nextText = (override || inputValue).trim();
    if (!nextText || isStreaming || loading) return;

    const createdAt = new Date().toISOString();
    const userMessage: RomiDisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: nextText,
      createdAt,
      journeyState: workspaceState.journeyState,
    };
    const placeholderId = `assistant-${Date.now()}`;

    if (!override) {
      setInputValue("");
    }

    dispatch({ type: "user_message", message: userMessage });
    dispatch({ type: "assistant_placeholder", id: placeholderId, createdAt });
    setIsStreaming(true);

    try {
      for await (const event of sendAIChatMessageStream(supabase, nextText, {
        sessionId: viewerMode === "user" ? selectedSessionId || undefined : undefined,
        viewerMode,
        entryPoint: "romi_page",
        pageContext: {
          route: location.pathname,
          surface: viewerMode === "guest" ? "guest_workspace" : "workspace",
        },
        journeyState: workspaceState.journeyState,
        history: viewerMode === "guest" ? buildGuestHistory(workspaceState.messages) : undefined,
      })) {
        dispatch({ type: "stream_event", event, placeholderId, createdAt });

        if (event.type === "start" && event.session) {
          prefersFreshConversationRef.current = false;
          skipHydrationSessionIdRef.current = event.session.id;
          setSelectedSessionId(event.session.id);
          setSessions((current) => upsertSessions(current, event.session as AIChatSession));
        }

        if (event.type === "final" && event.session) {
          prefersFreshConversationRef.current = false;
          skipHydrationSessionIdRef.current = event.session.id;
          setSelectedSessionId(event.session.id);
          setSessions((current) => upsertSessions(current, event.session as AIChatSession));
        }

        if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (error) {
      console.error("ROMI stream failed:", error);
      const message = error instanceof Error ? error.message : "ROMI chưa thể phản hồi lúc này.";
      await trackRomiError(user?.id || null, message, {
        viewer_mode: viewerMode,
        session_id: selectedSessionId,
      });
      toast.error(message);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <motion.section
      className="px-4 pb-24 pt-20 md:px-8 md:pb-10 md:pt-28"
      initial="hidden"
      animate="show"
      variants={motionTokens.stagger(0.08, 0.03)}
    >
      <div className="mx-auto max-w-4xl">
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          {showHistoryShortcut ? (
            <SheetContent side="left" className="w-full border-r border-slate-200 bg-[#fcfcfd] p-4 sm:max-w-md">
              <SessionRail
                sessions={filteredSessions}
                sessionsLoading={sessionsLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedSessionId={selectedSessionId}
                deletingSessionId={deletingSessionId}
                onSelect={handleSelectSession}
                onDelete={(sessionId) => void handleDeleteSession(sessionId)}
              />
            </SheetContent>
          ) : null}
        </Sheet>

        <motion.div variants={motionTokens.revealScale(20, 0.99)}>
            <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white/96 shadow-soft-lg xl:h-[calc(100svh-11rem)]">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        {viewerMode === "guest" ? "Guest conversation" : activeSessionTitle ? "Thread đang mở" : "Chat workspace"}
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] text-slate-950">
                        {ROMI_NAME}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workspaceSubtitle}
                      </p>
                      {activeSessionTitle || journeyChips.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeSessionTitle ? (
                            <Badge className="rounded-full bg-slate-100 text-slate-700">
                              {activeSessionTitle}
                            </Badge>
                          ) : null}
                          {journeyChips.map((chip) => (
                            <Badge key={chip} className="rounded-full bg-slate-100 text-slate-700">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {showHistoryShortcut ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setHistoryOpen(true)}
                      >
                        <History className="h-4 w-4" />
                        Lịch sử
                      </Button>
                    ) : null}
                    {viewerMode === "guest" ? (
                      <Button type="button" variant="outline" className="rounded-full" onClick={handleLogin}>
                        <LogIn className="h-4 w-4" />
                        Đăng nhập
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" className="rounded-full" onClick={handleCreateConversation}>
                        <MessageSquarePlus className="h-4 w-4" />
                        Luồng mới
                      </Button>
                    )}
                  </div>
                </div>

                {workspaceState.streamStatus ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{workspaceState.streamStatus.message}</span>
                  </div>
                ) : null}
              </div>

              <div
                ref={viewportRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fffaf2_0%,#f8fbff_100%)] px-6 py-5"
              >
                {messagesLoading && workspaceState.messages.length === 0 ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-24 max-w-[72%] animate-skeleton rounded-[28px] bg-white shadow-soft",
                        index % 2 === 0 ? "mr-auto" : "ml-auto",
                      )}
                    />
                  ))
                ) : (
                  workspaceState.messages.map((message) => (
                    <MessageCard key={message.id} message={message} onAction={(action) => void handleAction(action)} />
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 bg-white px-6 py-5">
                {!hasConversationStarted ? (
                  <PromptChips
                    prompts={promptOptions}
                    disabled={isStreaming || loading}
                    onPrompt={(prompt) => void handlePrompt(prompt)}
                  />
                ) : null}

                {workspaceState.clarification ? (
                  <div className="mb-4 rounded-[24px] border border-[#a04e17]/14 bg-[#fff7ef] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a04e17]">
                      {workspaceState.clarification.mode === "repair_after_failed_extraction"
                        ? "ROMI đang sửa lại tiêu chí"
                        : "ROMI cần thêm 1 chi tiết"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{workspaceState.clarification.prompt}</p>
                  </div>
                ) : null}

                {workspaceState.handoff ? (
                  <div className="mb-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Bước tiếp theo</p>
                    <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm leading-6 text-slate-700">{workspaceState.handoff.reason}</p>
                      <Button
                        type="button"
                        className="rounded-full"
                        onClick={() =>
                          void handleAction({
                            type: workspaceState.handoff?.href === "/login" ? "open_login" : "open_search",
                            href: workspaceState.handoff?.href || "/login",
                            label: workspaceState.handoff?.label || "Tiếp tục",
                          })
                        }
                      >
                        {workspaceState.handoff.label}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-soft">
                  <Textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Nêu khu vực, ngân sách, câu hỏi sản phẩm hoặc bước tiếp theo bạn đang cần..."
                    className="min-h-[116px] resize-none border-none bg-transparent px-2 py-2 text-[15px] leading-8 shadow-none focus-visible:ring-0"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      ROMI sẽ ưu tiên hỏi bù khi thiếu context bắt buộc thay vì trả lời đoán.
                    </p>
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={() => void handleSend()}
                      disabled={isStreaming || loading || !inputValue.trim()}
                    >
                      {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Gửi
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
      </div>
    </motion.section>
  );
}
