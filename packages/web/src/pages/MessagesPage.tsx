import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts";
import { useConversations } from "@/hooks/chat/useConversations";
import { useMessages } from "@/hooks/chat/useMessages";
import { useTypingIndicator } from "@/hooks/chat/useTypingIndicator";
import { createPublicMotion } from "@/lib/motion";
import { stitchAssets } from "@/lib/stitchAssets";
import { cn, formatMillions } from "@/lib/utils";
import type { Conversation, MessageWithSender } from "@/services/chat";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type InboxFilter = "all" | "unread" | "room" | "direct";
type ConversationContextKind = "room_inquiry" | "direct";

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const motionTokens = useMemo(() => createPublicMotion(!!shouldReduceMotion), [shouldReduceMotion]);
  const { conversations, isLoading: conversationsLoading, unreadCount } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (conversations.length === 0 || hasAutoSelectedRef.current) {
      return;
    }

    if (urlConversationId) {
      const foundByPath = conversations.find((conversation) => conversation.id === urlConversationId);
      if (foundByPath) {
        setSelectedConversationId(foundByPath.id);
        hasAutoSelectedRef.current = true;
        return;
      }
    }

    const legacyConversationId = searchParams.get("conversation");
    if (legacyConversationId) {
      const foundByLegacy = conversations.find((conversation) => conversation.id === legacyConversationId);
      if (foundByLegacy) {
        setSelectedConversationId(foundByLegacy.id);
        hasAutoSelectedRef.current = true;
        return;
      }
    }

    const targetUserId = searchParams.get("user");
    if (targetUserId) {
      const foundByUser = conversations.find((conversation) => conversation.participant.id === targetUserId);
      if (foundByUser) {
        setSelectedConversationId(foundByUser.id);
        hasAutoSelectedRef.current = true;
        return;
      }
    }

    setSelectedConversationId(conversations[0].id);
    hasAutoSelectedRef.current = true;
  }, [conversations, searchParams, urlConversationId]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (activeFilter === "unread" && conversation.unreadCount === 0) {
        return false;
      }

      const contextKind = getConversationContextKind(conversation);
      if (activeFilter === "room" && contextKind !== "room_inquiry") {
        return false;
      }
      if (activeFilter === "direct" && contextKind !== "direct") {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [conversation.participant.full_name, conversation.roomTitle, conversation.participant.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [activeFilter, conversations, searchQuery]);

  useEffect(() => {
    if (filteredConversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    if (!selectedConversationId || !filteredConversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(filteredConversations[0].id);
    }
  }, [filteredConversations, selectedConversationId]);

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedConversationId) ??
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    null;

  const handleBack = useCallback(() => {
    if (selectedConversation && isMobileView) {
      setSelectedConversationId(null);
      return;
    }

    navigate(-1);
  }, [isMobileView, navigate, selectedConversation]);

  const showList = !isMobileView || !selectedConversation;
  const showChat = !isMobileView || !!selectedConversation;
  const showContextRail = !isMobileView && !!selectedConversation;

  const filterItems: Array<{ value: InboxFilter; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "unread", label: "Chưa đọc" },
    { value: "room", label: "Theo phòng" },
    { value: "direct", label: "Trực tiếp" },
  ];

  return (
    <motion.section
      className="px-4 pb-24 pt-20 md:px-8 md:pb-10 md:pt-28"
      initial="hidden"
      animate="show"
      variants={motionTokens.stagger(0.08, 0.02)}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div variants={motionTokens.revealScale(18, 0.99)}>
        <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Hộp thư</p>
              <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.05em] text-on-surface md:text-5xl">
                Tin nhắn
              </h1>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <InboxMetric label="Tổng trò chuyện" value={`${conversations.length}`} />
              <InboxMetric label="Chưa đọc" value={`${unreadCount}`} accent="primary" />
              <InboxMetric
                label="Theo phòng"
                value={`${conversations.filter((conversation) => getConversationContextKind(conversation) === "room_inquiry").length}`}
              />
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          className={cn(
            "grid gap-6 xl:items-start",
            showContextRail ? "xl:grid-cols-[320px_minmax(0,1fr)_320px]" : "xl:grid-cols-[320px_minmax(0,1fr)]",
          )}
          variants={motionTokens.stagger(0.08, 0.04)}
        >
          {showList ? (
            <ConversationRail
              conversations={filteredConversations}
              isLoading={conversationsLoading}
              activeFilter={activeFilter}
              filterItems={filterItems}
              onFilterChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(conversationId) => setSelectedConversationId(conversationId)}
              motionTokens={motionTokens}
            />
          ) : null}

          {showChat ? (
            <AnimatePresence mode="wait">
              <ChatWorkspace
                key={selectedConversation?.id ?? "empty"}
                conversation={selectedConversation}
                currentUserId={user?.id || ""}
                isHostView={profile?.role === "landlord"}
                onBack={handleBack}
                onOpenRoom={(roomId) => navigate(`/room/${roomId}`)}
                motionTokens={motionTokens}
              />
            </AnimatePresence>
          ) : null}

          {showContextRail && selectedConversation ? (
            <AnimatePresence mode="wait">
              <ContextRail
                key={`context-${selectedConversation.id}`}
                conversation={selectedConversation}
                onOpenRoom={(roomId) => navigate(`/room/${roomId}`)}
                motionTokens={motionTokens}
              />
            </AnimatePresence>
          ) : null}
        </motion.div>
      </div>
    </motion.section>
  );
}

function ConversationRail({
  conversations,
  isLoading,
  activeFilter,
  filterItems,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedConversationId,
  onSelectConversation,
  motionTokens,
}: {
  conversations: Conversation[];
  isLoading: boolean;
  activeFilter: InboxFilter;
  filterItems: Array<{ value: InboxFilter; label: string }>;
  onFilterChange: (value: InboxFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  motionTokens: ReturnType<typeof createPublicMotion>;
}) {
  return (
    <motion.div variants={motionTokens.reveal(18)}>
    <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg xl:sticky xl:top-28">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em]">Hộp thư</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm người, phòng hoặc email..."
            className="h-11 rounded-full border-none bg-surface-container pl-11 shadow-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterItems.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={activeFilter === item.value ? "default" : "outline"}
              className={cn(
                "rounded-full px-4",
                activeFilter === item.value
                  ? "bg-primary text-white hover:bg-primary/95"
                  : "border-border bg-surface hover:bg-surface-container",
              )}
              onClick={() => onFilterChange(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1 xl:max-h-[calc(100svh-22rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyInboxState
              title="Chưa có cuộc trò chuyện nào"
              body="Khi bạn nhắn với chủ trọ hoặc người dùng khác, cuộc trò chuyện sẽ hiện ở đây."
            />
          ) : (
            conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                motionTokens={motionTokens}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

function ConversationCard({
  conversation,
  isSelected,
  onClick,
  motionTokens,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  motionTokens: ReturnType<typeof createPublicMotion>;
}) {
  const initials = getParticipantInitials(conversation.participant.full_name);
  const contextMeta = getConversationContextMeta(conversation);
  const timeAgo = conversation.lastMessage?.created_at
    ? formatDistanceToNow(parseISO(conversation.lastMessage.created_at), { addSuffix: true, locale: vi })
    : "Vừa xong";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[1.5rem] border border-transparent p-4 text-left transition-colors",
        isSelected ? "bg-primary/8 ring-1 ring-primary/15" : "bg-surface hover:bg-surface-container",
      )}
      variants={motionTokens.revealScale(12, 0.995)}
      whileHover={motionTokens.hoverSoft}
      whileTap={motionTokens.tap}
    >
      <div className="flex items-start gap-3">
        <PremiumAvatar
          isPremium={conversation.participant.is_premium ?? false}
          className="h-12 w-12 border border-border/70"
        >
          <AvatarImage src={conversation.participant.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </PremiumAvatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-on-surface">{conversation.participant.full_name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant">{timeAgo}</p>
            </div>
            {conversation.unreadCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={cn("rounded-full", contextMeta.badgeClassName)}>{contextMeta.label}</Badge>
            {conversation.roomTitle ? (
              <span className="truncate text-xs font-medium text-primary">{conversation.roomTitle}</span>
            ) : null}
          </div>

          <p className="mt-3 truncate text-sm text-on-surface-variant">
            {conversation.lastMessage?.content || "Chưa có tin nhắn mới."}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function ChatWorkspace({
  conversation,
  currentUserId,
  isHostView,
  onBack,
  onOpenRoom,
  motionTokens,
}: {
  conversation: Conversation | null;
  currentUserId: string;
  isHostView: boolean;
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
  motionTokens: ReturnType<typeof createPublicMotion>;
}) {
  const [draftMessage, setDraftMessage] = useState("");

  if (!conversation) {
    return (
      <motion.div initial="hidden" animate="show" exit="hidden" variants={motionTokens.revealScale(18, 0.99)}>
      <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
        <CardContent className="flex min-h-[calc(100svh-20rem)] items-center justify-center p-8">
          <EmptyInboxState
            title="Chọn một cuộc trò chuyện"
            body="Chọn một cuộc trò chuyện ở cột bên trái để xem nội dung tại đây."
          />
        </CardContent>
      </Card>
      </motion.div>
    );
  }

  return (
    <ChatPanel
      conversation={conversation}
      currentUserId={currentUserId}
      draftMessage={draftMessage}
      onDraftChange={setDraftMessage}
      isHostView={isHostView}
      onBack={onBack}
      onOpenRoom={onOpenRoom}
      motionTokens={motionTokens}
    />
  );
}

function ChatPanel({
  conversation,
  currentUserId,
  draftMessage,
  onDraftChange,
  isHostView,
  onBack,
  onOpenRoom,
  motionTokens,
}: {
  conversation: Conversation;
  currentUserId: string;
  draftMessage: string;
  onDraftChange: (value: string) => void;
  isHostView: boolean;
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
  motionTokens: ReturnType<typeof createPublicMotion>;
}) {
  const {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    isSending,
  } = useMessages(conversation.id);
  const { typingUsers } = useTypingIndicator(conversation.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useAutoResizeTextarea(draftMessage, { minHeight: 44, maxHeight: 200 });
  const contextMeta = getConversationContextMeta(conversation);
  const quickReplies = useMemo(() => getQuickReplies(conversation, isHostView), [conversation, isHostView]);
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.id, lastMessageId]);

  useEffect(() => {
    if (conversation.unreadCount > 0) {
      void markAsRead();
    }
  }, [conversation.id, conversation.unreadCount, markAsRead]);

  const handleSend = useCallback(async () => {
    if (!draftMessage.trim() || isSending) {
      return;
    }

    const content = draftMessage.trim();
    onDraftChange("");

    try {
      await sendMessage(content);
    } catch (error) {
      console.error("Failed to send message:", error);
      onDraftChange(content);
    }
  }, [draftMessage, isSending, onDraftChange, sendMessage]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <motion.div initial="hidden" animate="show" exit="hidden" variants={motionTokens.revealScale(18, 0.99)}>
    <Card className="overflow-hidden rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button type="button" variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <PremiumAvatar
              isPremium={conversation.participant.is_premium ?? false}
              className="h-12 w-12 border border-border/70"
            >
              <AvatarImage src={conversation.participant.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getParticipantInitials(conversation.participant.full_name)}
              </AvatarFallback>
            </PremiumAvatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-display text-2xl font-extrabold tracking-[-0.03em] text-on-surface">
                  {conversation.participant.full_name}
                </CardTitle>
                <Badge className={cn("rounded-full", contextMeta.badgeClassName)}>{contextMeta.label}</Badge>
              </div>
              {conversation.room ? (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
                  onClick={() => onOpenRoom(conversation.room!.id)}
                >
                  {conversation.room.title}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
            {typingUsers.length > 0 ? "Đang nhập..." : "Sẵn sàng trò chuyện"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <div className="min-h-[22rem] max-h-[calc(100svh-26rem)] space-y-4 overflow-y-auto bg-surface-container/35 px-6 py-6 xl:min-h-[28rem]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyInboxState
              title="Bắt đầu cuộc trò chuyện"
              body="Bạn có thể nhắn ngay tại đây để bắt đầu trao đổi với người này."
            />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isFromMe={message.sender_id === currentUserId}
              />
            ))
          )}

          {typingUsers.length > 0 ? (
            <div className="flex justify-start">
              <div className="rounded-[1.25rem] rounded-bl-md bg-surface px-4 py-3 text-sm text-on-surface-variant shadow-sm">
                Đối phương đang nhập...
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-border/70 bg-white/90 px-6 py-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-on-surface">Soạn phản hồi</p>
            <Popover open={isQuickRepliesOpen} onOpenChange={setIsQuickRepliesOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-full px-3 text-xs font-semibold text-on-surface-variant"
                >
                  {isQuickRepliesOpen ? "Ẩn gợi ý trả lời" : "Hiện gợi ý trả lời"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="top"
                className="w-[min(22rem,calc(100vw-3rem))] rounded-[1.5rem] border-border/70 p-3"
              >
                <div className="mb-2">
                  <p className="text-sm font-semibold text-on-surface">Gợi ý trả lời nhanh</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Chọn một mẫu để điền nhanh vào ô soạn tin mà không làm xê dịch layout.
                  </p>
                </div>
                <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary/8 hover:text-on-surface"
                      onClick={() => {
                        onDraftChange(reply);
                        setIsQuickRepliesOpen(false);
                      }}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Textarea
              ref={textareaRef}
              value={draftMessage}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhắn ngay trong cuộc trò chuyện này..."
              className="rounded-[1.5rem] border-none bg-surface shadow-none transition-[height] duration-100"
              style={{ resize: "none", overflowY: "hidden" }}
              rows={1}
              disabled={isSending}
            />
            <Button
              type="button"
              className="h-12 rounded-full px-6"
              disabled={!draftMessage.trim() || isSending}
              onClick={() => void handleSend()}
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Gửi tin
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

function ContextRail({
  conversation,
  onOpenRoom,
  motionTokens,
}: {
  conversation: Conversation;
  onOpenRoom: (roomId: string) => void;
  motionTokens: ReturnType<typeof createPublicMotion>;
}) {
  const contextMeta = getConversationContextMeta(conversation);

  return (
    <motion.div
      className="space-y-6 xl:sticky xl:top-28"
      variants={motionTokens.reveal(18)}
      initial="hidden"
      animate="show"
      exit="hidden"
    >
      <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">Chi tiết cuộc trò chuyện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversation.room ? (
            <>
              <div className="overflow-hidden rounded-[1.5rem] bg-surface">
                <img
                  src={conversation.room.imageUrl || stitchAssets.roomDetail.gallery[0]}
                  alt={conversation.room.title}
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="rounded-[1.5rem] bg-surface p-4">
                <p className="font-semibold text-on-surface">{conversation.room.title}</p>
                <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-on-surface-variant">
                  <MapPin className="mt-1 h-4 w-4 shrink-0" />
                  <span>{conversation.room.address || "Tin phòng này đang được hỏi trực tiếp."}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-on-surface-variant">Giá tham chiếu</span>
                  <span className="font-semibold text-primary">
                    {conversation.room.pricePerMonth ? `${formatMillions(conversation.room.pricePerMonth)}/tháng` : "Chưa cập nhật"}
                  </span>
                </div>
                <Button type="button" className="mt-5 w-full rounded-full" onClick={() => onOpenRoom(conversation.room!.id)}>
                  Mở chi tiết phòng
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-[1.5rem] bg-surface p-5">
              <div className="flex items-center gap-3">
                <PremiumAvatar
                  isPremium={conversation.participant.is_premium ?? false}
                  className="h-12 w-12 border border-border/70"
                >
                  <AvatarImage src={conversation.participant.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getParticipantInitials(conversation.participant.full_name)}
                  </AvatarFallback>
                </PremiumAvatar>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{conversation.participant.full_name}</p>
                  <p className="mt-1 text-sm text-on-surface-variant [overflow-wrap:anywhere] break-all">
                    {conversation.participant.email || "Trao đổi trong hệ sinh thái RommZ"}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-[1.25rem] bg-surface-container p-4 text-sm leading-6 text-on-surface-variant">
                Đây là cuộc trò chuyện trực tiếp, không gắn với một tin phòng cụ thể. Phù hợp cho trao đổi hồ sơ, tìm người ở ghép hoặc nhắn tin riêng giữa hai người dùng.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-soft-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl font-extrabold tracking-[-0.03em]">Mẹo phản hồi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            contextMeta.kind === "room_inquiry"
              ? "Nếu đang chốt lịch xem phòng, hãy giữ mọi trao đổi về tin phòng này trong cùng một cuộc trò chuyện."
              : "Nếu đây là cuộc trò chuyện trực tiếp, hãy nói rõ mục đích để hai bên theo dõi dễ hơn.",
            "Trả lời ngắn gọn trước, gửi ảnh hoặc thông tin sâu sau khi hai bên đã thống nhất hướng nói chuyện.",
            "Khi hai bên đã thống nhất nội dung chính, hãy tiếp tục ngay trong cuộc trò chuyện này để khỏi sót thông tin.",
          ].map((tip) => (
            <div key={tip} className="rounded-[1.25rem] bg-surface p-4 text-sm leading-6 text-on-surface-variant">
              {tip}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MessageBubble({
  message,
  isFromMe,
}: {
  message: MessageWithSender;
  isFromMe: boolean;
}) {
  const timeAgo = message.created_at
    ? formatDistanceToNow(parseISO(message.created_at), { addSuffix: true, locale: vi })
    : "";

  return (
    <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-[1.5rem] px-4 py-3 shadow-sm [overflow-wrap:anywhere]",
          isFromMe
            ? "rounded-br-md bg-primary text-white"
            : "rounded-bl-md bg-white text-on-surface",
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.content}</p>
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            isFromMe ? "justify-end text-white/75" : "text-on-surface-variant",
          )}
        >
          <span>{timeAgo}</span>
          {isFromMe ? message.is_read ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" /> : null}
        </div>
      </div>
    </div>
  );
}

function InboxMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "primary";
}) {
  return (
    <div className="rounded-[1.5rem] bg-surface px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className={cn("mt-3 font-display text-3xl font-black tracking-[-0.04em] text-on-surface", accent === "primary" && "text-primary")}>
        {value}
      </p>
    </div>
  );
}

function EmptyInboxState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-primary">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="font-semibold text-on-surface">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{body}</p>
    </div>
  );
}

function getConversationContextKind(conversation: Conversation): ConversationContextKind {
  return conversation.roomId || conversation.roomTitle || conversation.room ? "room_inquiry" : "direct";
}

function getConversationContextMeta(conversation: Conversation) {
  const kind = getConversationContextKind(conversation);

  if (kind === "room_inquiry") {
    return {
      kind,
      label: "Hỏi phòng",
      badgeClassName: "bg-primary/10 text-primary hover:bg-primary/10",
    };
  }

  return {
    kind,
    label: "Trực tiếp",
    badgeClassName: "bg-secondary-container text-on-secondary-container hover:bg-secondary-container",
  };
}

function getParticipantInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getQuickReplies(conversation: Conversation, isHostView: boolean) {
  if (conversation.room) {
    return isHostView
      ? [
          "Phòng này vẫn còn trống, bạn muốn chốt lịch xem vào khung nào?",
          "Mình sẽ gửi thêm ảnh và thông tin chi tiết của tin phòng này ngay tại đây.",
          "Nếu cần đổi lịch xem phòng, cứ nhắn lại tại đây để mình cập nhật.",
        ]
      : [
          "Mình muốn hỏi thêm về phòng này trước khi chốt lịch xem.",
          "Phòng này còn trống không ạ? Mình muốn đặt lịch xem trong tuần này.",
          "Nếu được, bạn gửi giúp mình thêm ảnh và chi tiết hợp đồng của phòng này nhé.",
        ];
  }

  return [
    "Chào bạn, mình muốn trao đổi thêm một chút ngay tại đây.",
    "Mình đã xem hồ sơ của bạn và muốn hỏi thêm vài chi tiết.",
    "Nếu tiện, mình muốn chốt tiếp bước tiếp theo ngay tại đây.",
  ];
}
