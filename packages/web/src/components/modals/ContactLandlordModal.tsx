import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Send, User } from "lucide-react";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import {
  getConversationMessages,
  getOrCreateConversation,
  sendMessage,
  type MessageWithUsers,
} from "@/services/messages";
import { subscribeToConversationMessages } from "@/services/realtime";

interface LandlordInfo {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  email?: string;
}

interface ContactLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlord?: LandlordInfo;
  roomId?: string;
  roomTitle?: string;
}

export function ContactLandlordModal({
  isOpen,
  onClose,
  landlord,
  roomTitle,
}: ContactLandlordModalProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const hostName = landlord?.full_name || "Host";
  const hostInitials = hostName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (!isOpen || !user?.id || !landlord?.id) {
      setLoading(false);
      return;
    }

    const initConversation = async () => {
      setLoading(true);

      try {
        const nextConversationId = await getOrCreateConversation(user.id, landlord.id);
        setConversationId(nextConversationId);

        const existingMessages = await getConversationMessages(nextConversationId);
        setMessages(existingMessages);
      } catch (error) {
        console.error("[ContactLandlordModal] Error:", error);
        toast.error("Không thể tải tin nhắn");
      } finally {
        setLoading(false);
      }
    };

    void initConversation();
  }, [isOpen, landlord?.id, user?.id]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const subscription = subscribeToConversationMessages(conversationId, {
      onNewMessage: (newMessage) => {
        setMessages((currentMessages) => {
          if (currentMessages.some((message) => message.id === newMessage.id)) {
            return currentMessages;
          }

          return [...currentMessages, newMessage as MessageWithUsers];
        });
      },
      onError: (error) => {
        console.error("[ContactLandlordModal] Realtime error:", error);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user?.id || !conversationId) {
      return;
    }

    const messageContent = inputValue.trim();
    setInputValue("");
    setSending(true);

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: profile?.full_name || "Bạn",
        avatar_url: profile?.avatar_url || null,
      },
    } as MessageWithUsers;

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);

    try {
      const sentMessage = await sendMessage(conversationId, user.id, messageContent);

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === optimisticMessage.id
            ? { ...sentMessage, sender: optimisticMessage.sender }
            : message,
        ),
      );
    } catch (error) {
      console.error("[ContactLandlordModal] Send error:", error);
      toast.error("Không thể gửi tin nhắn");
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== optimisticMessage.id),
      );
      setInputValue(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleOpenFullMessages = () => {
    navigate(conversationId ? `/messages?conversation=${conversationId}` : "/messages");
    onClose();
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) {
      return "";
    }

    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: vi });
    } catch {
      return "";
    }
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-3xl sm:max-w-[400px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Đăng nhập để nhắn tin</DialogTitle>
            <DialogDescription>
              Bạn cần đăng nhập để liên hệ với host.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button
              onClick={() => {
                onClose();
                navigate("/login");
              }}
              className="w-full rounded-full"
            >
              Đăng nhập ngay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[600px] flex-col rounded-3xl p-0 sm:max-w-[450px]" aria-describedby={undefined}>
        <DialogHeader className="shrink-0 border-b border-border p-5 pb-4">
          <VisuallyHidden>
            <DialogTitle>Liên hệ host</DialogTitle>
            <DialogDescription>Trò chuyện với host</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary/20 to-secondary/20">
                <AvatarImage src={landlord?.avatar_url || undefined} />
                <AvatarFallback>{hostInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-medium">{hostName}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Đang hoạt động</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={handleOpenFullMessages}
            >
              Xem tất cả
            </Button>
          </div>

          {roomTitle ? (
            <Badge variant="outline" className="mt-3 w-fit text-xs">
              📍 {roomTitle}
            </Badge>
          ) : null}

          <Badge variant="outline" className="mt-2 w-fit text-xs">
            <Clock className="mr-1 h-3 w-3" />
            Thường phản hồi trong vòng 1 giờ
          </Badge>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">Chưa có tin nhắn</p>
              <p className="mt-1 text-xs">Bắt đầu cuộc trò chuyện với {hostName}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isFromMe = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isFromMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={isFromMe ? profile?.avatar_url || undefined : landlord?.avatar_url || undefined}
                    />
                    <AvatarFallback
                      className={
                        isFromMe
                          ? "bg-muted"
                          : "bg-gradient-to-br from-primary/20 to-secondary/20"
                      }
                    >
                      {isFromMe ? <User className="h-4 w-4" /> : hostInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex max-w-[75%] flex-col gap-1 ${
                      isFromMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isFromMe
                          ? "rounded-tr-sm bg-primary text-white"
                          : "rounded-tl-sm bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    <span className="px-1 text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 rounded-full border-2 focus-visible:ring-primary"
              disabled={loading || sending}
            />
            <Button
              onClick={() => void handleSendMessage()}
              size="icon"
              className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
              disabled={!inputValue.trim() || loading || sending}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
