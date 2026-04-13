/**
 * ChatDrawer Component
 * Chat drawer using TanStack Query hooks with realtime updates
 * No more polling - uses subscription for live updates
 */

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts";
import { startConversation } from "@/services/chat";
import { useMessages, useTypingIndicator } from "@/hooks/chat";
import {
  MessageBubble,
  TypingIndicator,
  QuickReplies,
  ConnectionStatus,
  MessageSkeleton
} from "@/components/chat";
import { toast } from "sonner";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
  recipientName: string;
  recipientRole?: string;
  compatibilityScore?: number;
  recipientAvatar?: string;
  recipientIsPremium?: boolean;
}

export function ChatDrawer({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientRole,
  compatibilityScore,
  recipientAvatar,
  recipientIsPremium = false,
}: ChatDrawerProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TanStack Query hooks (only active when conversationId exists)
  const {
    messages,
    isLoading,
    sendMessage,
    isSending,
    markAsRead
  } = useMessages(conversationId || '');

  // Typing indicator (active chat only)
  const { typingUsers, setTyping } = useTypingIndicator(conversationId || '');

  // Initialize conversation when drawer opens
  useEffect(() => {
    async function initChat() {
      if (!isOpen || !recipientId || !user) return;

      setIsInitializing(true);
      try {
        const convo = await startConversation(recipientId, user.id);
        setConversationId(convo.id);
      } catch (error) {
        console.error("Failed to initialize chat", error);
        toast.error("Không thể tải cuộc trò chuyện");
      } finally {
        setIsInitializing(false);
      }
    }

    initChat();
  }, [isOpen, recipientId, user]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead();
    }
  }, [conversationId, messages.length, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  }, [setTyping]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversationId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setTyping(false);

    try {
      await sendMessage(content);
    } catch {
      toast.error("Gửi tin nhắn thất bại");
      setNewMessage(content); // Restore on failure
    }
  }, [newMessage, conversationId, sendMessage, setTyping]);

  // Quick reply handler
  const handleQuickReply = useCallback((text: string) => {
    setNewMessage(text);
  }, []);

  const initials = recipientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isLoadingState = isInitializing || isLoading;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <PremiumAvatar isPremium={recipientIsPremium} className="h-12 w-12">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                {initials}
              </AvatarFallback>
            </PremiumAvatar>
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
            <ConnectionStatus />
          </div>
        </SheetHeader>

        {/* Quick Replies (only show when no messages yet) */}
        {!isLoadingState && messages.length === 0 && (
          <QuickReplies onSelect={handleQuickReply} />
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30">
          {isLoadingState ? (
            <MessageSkeleton count={4} />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                Hãy bắt đầu cuộc trò chuyện!
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Chọn tin nhắn nhanh ở trên hoặc tự gõ
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isFromMe={msg.sender_id === user?.id}
                />
              ))}

              {/* Typing Indicator */}
              <TypingIndicator typingUsers={typingUsers} />
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="px-4 py-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Nhập tin nhắn..."
              className="rounded-full flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!conversationId}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
              disabled={!newMessage.trim() || !conversationId || isSending}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
