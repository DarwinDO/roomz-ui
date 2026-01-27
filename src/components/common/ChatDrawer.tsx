import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts";
import { getMessages, sendMessage, startConversation, type Message } from "@/services/chat";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string; // We need ID to start/find chat
  recipientName: string;
  recipientRole?: string;
  compatibilityScore?: number;
}

export function ChatDrawer({ isOpen, onClose, recipientId, recipientName, recipientRole, compatibilityScore }: ChatDrawerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    async function initChat() {
      if (!isOpen || !recipientId || !user) return;

      setIsLoading(true);
      try {
        // Find existing conversation or start new
        // For MVP, we'll try to 'start' which gets or creates
        // Optimized: In real app, check if we already have convId from parent
        const convo = await startConversation(recipientId);
        setConversationId(convo.id);

        // Fetch messages
        const msgs = await getMessages(convo.id);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load chat", error);
        toast.error("Không thể tải cuộc trò chuyện");
      } finally {
        setIsLoading(false);
      }
    }

    initChat();

    // Polling for new messages (Simple MVP)
    const interval = setInterval(() => {
      if (conversationId) {
        getMessages(conversationId).then(setMessages).catch(() => { });
      }
    }, 5000); // 5s

    return () => clearInterval(interval);
  }, [isOpen, recipientId, user, conversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const content = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    try {
      await sendMessage(conversationId, content);
      // Refresh immediately
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      toast.error("Gửi tin nhắn thất bại");
      setNewMessage(content); // Restore if failed
    }
  };

  const quickMessages = [
    "Chào bạn! Mình thấy chúng ta khá phù hợp!",
    "Mình muốn tìm hiểu thêm về lối sống của bạn!",
    "Bạn muốn gặp lúc nào?",
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                {recipientName.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="mb-1">
                <div className="flex items-center gap-2">
                  <span>{recipientName}</span>
                  {compatibilityScore && (
                    <Badge className="bg-gradient-to-r from-secondary to-primary text-white text-xs px-2 py-0.5">
                      {compatibilityScore}%
                    </Badge>
                  )}
                </div>
              </SheetTitle>
              {recipientRole && (
                <SheetDescription>{recipientRole}</SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Quick Message Suggestions */}
        <div className="px-6 py-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-b">
          <p className="text-xs text-gray-600 mb-2">Tin nhắn nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((quickMsg, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-white cursor-pointer hover:bg-primary hover:text-white transition-colors"
                onClick={() => setNewMessage(quickMsg)}
              >
                {quickMsg}
              </Badge>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Hãy bắt đầu cuộc trò chuyện!</p>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id; // Assuming user available
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMe
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white text-gray-900 rounded-bl-sm border"
                      }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-gray-400"
                        }`}
                    >
                      {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="rounded-full flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
              disabled={!newMessage.trim() || !conversationId}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
