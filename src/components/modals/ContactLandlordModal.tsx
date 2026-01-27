import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  type MessageWithUsers
} from "@/services/messages";
import { subscribeToConversationMessages } from "@/services/realtime";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

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
  roomId,
  roomTitle
}: ContactLandlordModalProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get landlord display info with fallback
  const landlordName = landlord?.full_name || "Chủ nhà";
  const landlordInitials = landlordName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Load or create conversation when modal opens
  useEffect(() => {
    if (!isOpen || !user?.id || !landlord?.id) {
      setLoading(false);
      return;
    }

    const initConversation = async () => {
      setLoading(true);
      try {
        // Get or create conversation
        const convId = await getOrCreateConversation(user.id, landlord.id);
        setConversationId(convId);

        // Load existing messages
        const existingMessages = await getConversationMessages(convId);
        setMessages(existingMessages);
      } catch (error) {
        console.error('[ContactLandlordModal] Error:', error);
        toast.error("Không thể tải tin nhắn");
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [isOpen, user?.id, landlord?.id]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const subscription = subscribeToConversationMessages(conversationId, {
      onNewMessage: (newMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      },
      onError: (err) => {
        console.error('[ContactLandlordModal] Realtime error:', err);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user?.id || !conversationId) return;

    const messageContent = inputValue.trim();
    setInputValue("");
    setSending(true);

    // Optimistic update - use minimal required fields
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: profile?.full_name || 'Bạn',
        avatar_url: profile?.avatar_url || null,
      }
    } as MessageWithUsers;

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const sentMessage = await sendMessage(conversationId, user.id, messageContent);

      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => m.id === optimisticMessage.id ? { ...sentMessage, sender: optimisticMessage.sender } : m)
      );
    } catch (error) {
      console.error('[ContactLandlordModal] Send error:', error);
      toast.error("Không thể gửi tin nhắn");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setInputValue(messageContent); // Restore input
    } finally {
      setSending(false);
    }
  };

  const handleOpenFullMessages = () => {
    if (conversationId) {
      navigate(`/messages?conversation=${conversationId}`);
    } else {
      navigate('/messages');
    }
    onClose();
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: vi });
    } catch {
      return "";
    }
  };

  // Not logged in
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Đăng nhập để nhắn tin</DialogTitle>
            <DialogDescription>
              Bạn cần đăng nhập để liên hệ với chủ nhà.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button
              onClick={() => {
                onClose();
                navigate('/login');
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
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 h-[600px] flex flex-col" aria-describedby={undefined}>
        <DialogHeader className="p-5 pb-4 border-b border-border shrink-0">
          <VisuallyHidden>
            <DialogTitle>Liên hệ chủ nhà</DialogTitle>
            <DialogDescription>Trò chuyện với chủ nhà</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20">
                <AvatarImage src={landlord?.avatar_url || undefined} />
                <AvatarFallback>{landlordInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-medium">{landlordName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
          {roomTitle && (
            <Badge variant="outline" className="mt-3 w-fit text-xs">
              📍 {roomTitle}
            </Badge>
          )}
          <Badge variant="outline" className="mt-2 w-fit text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Thường trả lời trong vòng 1 giờ
          </Badge>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">Chưa có tin nhắn</p>
              <p className="text-xs mt-1">Bắt đầu cuộc trò chuyện với {landlordName}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isFromMe = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isFromMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={isFromMe ? profile?.avatar_url || undefined : landlord?.avatar_url || undefined} />
                    <AvatarFallback
                      className={
                        isFromMe
                          ? "bg-muted"
                          : "bg-gradient-to-br from-primary/20 to-secondary/20"
                      }
                    >
                      {isFromMe ? (
                        <User className="w-4 h-4" />
                      ) : (
                        landlordInitials
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] ${isFromMe ? "items-end" : "items-start"
                      } flex flex-col gap-1`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${isFromMe
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground px-1">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 rounded-full border-2 focus-visible:ring-primary"
              disabled={loading || sending}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
              disabled={!inputValue.trim() || loading || sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
