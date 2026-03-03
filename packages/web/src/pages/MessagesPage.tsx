import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Loader2,
  Send,
  Check,
  CheckCheck,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type { Conversation, MessageWithSender } from "@/services/chat";

// TanStack Query hooks
import { useConversations } from "@/hooks/chat/useConversations";
import { useMessages } from "@/hooks/chat/useMessages";
import { useTypingIndicator } from "@/hooks/chat/useTypingIndicator";

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversations, isLoading: conversationsLoading, unreadCount } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const hasAutoSelectedRef = useRef(false);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-select conversation from URL parameter (only once on initial load)
  useEffect(() => {
    if (conversations.length === 0 || hasAutoSelectedRef.current) return;

    // Priority 1: Handle :conversationId from URL path
    if (urlConversationId) {
      const found = conversations.find(c => c.id === urlConversationId);
      if (found) {
        setSelectedConversation(found);
        hasAutoSelectedRef.current = true;
        return;
      }
    }

    // Priority 2: Handle ?conversation=<id> - direct conversation ID (legacy)
    const conversationId = searchParams.get("conversation");
    if (conversationId) {
      const found = conversations.find(c => c.id === conversationId);
      if (found) {
        setSelectedConversation(found);
        hasAutoSelectedRef.current = true;
        return;
      }
    }

    // Priority 3: Handle ?user=<userId> - find conversation with this user
    const targetUserId = searchParams.get("user");
    if (targetUserId) {
      const found = conversations.find(c => c.participant.id === targetUserId);
      if (found) {
        setSelectedConversation(found);
        hasAutoSelectedRef.current = true;
      } else {
        // No existing conversation - user might need to start from roommate feature
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] No conversation found with user:', targetUserId);
        }
      }
    }
  }, [searchParams, conversations, urlConversationId]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.participant.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    if (selectedConversation && isMobileView) {
      setSelectedConversation(null);
    } else {
      navigate(-1);
    }
  };

  // Show conversation list on mobile, or both on desktop
  const showList = !isMobileView || !selectedConversation;
  const showChat = !isMobileView || selectedConversation;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-xl hover:bg-muted">
              {selectedConversation && isMobileView ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </Button>
            <div className="ml-3">
              {selectedConversation && isMobileView ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedConversation.participant.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedConversation.participant.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedConversation.participant.full_name}</p>
                    {selectedConversation.roomTitle && (
                      <p className="text-xs text-muted-foreground">{selectedConversation.roomTitle}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3>Tin nhắn</h3>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversations List */}
          {showList && (
            <div className="md:col-span-1 md:border-r border-border h-full overflow-hidden flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4 animate-fade-in">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "Không tìm thấy cuộc trò chuyện" : "Chưa có tin nhắn nào"}
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Bắt đầu trò chuyện khi bạn quan tâm đến một phòng
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversation?.id === conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        currentUserId={user?.id || ""}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="md:col-span-2 h-full flex flex-col overflow-hidden">
              {selectedConversation ? (
                <ChatPanel
                  conversation={selectedConversation}
                  currentUserId={user?.id || ""}
                />
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-muted/50">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Chọn một cuộc trò chuyện để bắt đầu</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
}

function ConversationItem({ conversation, isSelected, onClick, currentUserId }: ConversationItemProps) {
  const { participant, lastMessage, unreadCount, roomTitle } = conversation;
  const initials = participant.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = lastMessage?.created_at
    ? formatDistanceToNow(parseISO(lastMessage.created_at), { addSuffix: true, locale: vi })
    : "";

  const isFromMe = lastMessage?.sender_id === currentUserId;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-muted ${isSelected ? "bg-primary/5 border-l-4 border-primary" : ""
        }`}>
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={participant.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
            {initials}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-medium truncate ${unreadCount > 0 ? "text-foreground" : ""}`}>
            {participant.full_name}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
        </div>
        {roomTitle && (
          <p className="text-xs text-primary truncate">{roomTitle}</p>
        )}
        <p
          className={`text-sm truncate mt-0.5 ${unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
        >
          {isFromMe && <span className="text-muted-foreground">Bạn: </span>}
          {lastMessage?.content}
        </p>
      </div>
    </button>
  );
}

// Chat Panel Component
interface ChatPanelProps {
  conversation: Conversation;
  currentUserId: string;
}

function ChatPanel({ conversation, currentUserId }: ChatPanelProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    isSending,
  } = useMessages(conversation.id);
  const [newMessage, setNewMessage] = useState("");
  const { typingUsers } = useTypingIndicator(conversation.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when opening conversation
  const hasMarkedAsReadRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (conversation.unreadCount > 0 && !hasMarkedAsReadRef.current.has(conversation.id)) {
      hasMarkedAsReadRef.current.add(conversation.id);
      markAsRead();
    }
  }, [conversation.id, conversation.unreadCount, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      await sendMessage(content);
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(content); // Restore on error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOtherTyping = typingUsers.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header (desktop only) */}
      <div className="hidden md:flex flex-shrink-0 items-center gap-3 p-4 border-b border-border bg-card">
        <Avatar className="w-10 h-10">
          <AvatarImage src={conversation.participant.avatar_url || undefined} />
          <AvatarFallback>
            {conversation.participant.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{conversation.participant.full_name}</p>
          {conversation.roomTitle && (
            <p className="text-sm text-muted-foreground">{conversation.roomTitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isFromMe={message.sender_id === currentUserId}
              />
            ))}
            {isOtherTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2">
                  <span className="text-sm text-muted-foreground">Đang nhập...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card safe-area-pb">
        <div className="flex items-center gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-xl"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-xl shrink-0 bg-primary hover:bg-primary/90">
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: MessageWithSender;
  isFromMe: boolean;
}

function MessageBubble({ message, isFromMe }: MessageBubbleProps) {
  const timeAgo = message.created_at
    ? formatDistanceToNow(parseISO(message.created_at), { addSuffix: true, locale: vi })
    : "";

  return (
    <div className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${isFromMe
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-card border border-border rounded-bl-sm"
          }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${isFromMe ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
            }`}>
          <span>{timeAgo}</span>
          {isFromMe && (
            message.is_read ? (
              <CheckCheck className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
