import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useConversations, useConversationMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type { Conversation, MessageWithUsers } from "@/services/messages";

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loading, unreadCount, refetch } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
            >
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
                      <p className="text-xs text-gray-500">{selectedConversation.roomTitle}</p>
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

      <div className="max-w-6xl mx-auto">
        <div className="md:grid md:grid-cols-3 md:h-[calc(100vh-60px)]">
          {/* Conversations List */}
          {showList && (
            <div className="md:col-span-1 md:border-r border-border h-full overflow-hidden flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="pl-10 rounded-full"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? "Không tìm thấy cuộc trò chuyện" : "Chưa có tin nhắn nào"}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
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
            <div className="md:col-span-2 h-full flex flex-col">
              {selectedConversation ? (
                <ChatPanel
                  conversation={selectedConversation}
                  currentUserId={user?.id || ""}
                />
              ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu</p>
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

  const timeAgo = lastMessage.created_at
    ? formatDistanceToNow(parseISO(lastMessage.created_at), { addSuffix: true, locale: vi })
    : "";

  const isFromMe = lastMessage.sender_id === currentUserId;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-gray-50 ${
        isSelected ? "bg-primary/5 border-l-4 border-primary" : ""
      }`}
    >
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={participant.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
            {initials}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-medium truncate ${unreadCount > 0 ? "text-foreground" : ""}`}>
            {participant.full_name}
          </p>
          <span className="text-xs text-gray-400 shrink-0">{timeAgo}</span>
        </div>
        {roomTitle && (
          <p className="text-xs text-primary truncate">{roomTitle}</p>
        )}
        <p
          className={`text-sm truncate mt-0.5 ${
            unreadCount > 0 ? "text-foreground font-medium" : "text-gray-500"
          }`}
        >
          {isFromMe && <span className="text-gray-400">Bạn: </span>}
          {lastMessage.content}
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
    loading,
    sendMessage: sendNewMessage,
    markAsRead,
  } = useConversationMessages(conversation.id, conversation.roomId);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Mark as read when opening conversation
  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markAsRead();
    }
  }, [conversation.id, conversation.unreadCount, markAsRead]);

  // Auto scroll to bottom
  useEffect(() => {
    const messagesContainer = document.getElementById("messages-container");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendNewMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header (desktop only) */}
      <div className="hidden md:flex items-center gap-3 p-4 border-b border-border bg-white">
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
            <p className="text-sm text-gray-500">{conversation.roomTitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        id="messages-container"
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFromMe={message.sender_id === currentUserId}
            />
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-white">
        <div className="flex items-center gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-full"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-full shrink-0"
          >
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
  message: MessageWithUsers;
  isFromMe: boolean;
}

function MessageBubble({ message, isFromMe }: MessageBubbleProps) {
  const timeAgo = message.created_at
    ? formatDistanceToNow(parseISO(message.created_at), { addSuffix: true, locale: vi })
    : "";

  return (
    <div className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isFromMe
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white border border-border rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            isFromMe ? "text-white/70 justify-end" : "text-gray-400"
          }`}
        >
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
