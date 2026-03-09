import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts";
import {
  sendAIChatMessage,
} from "@roomz/shared/services/ai-chatbot";
import type { AIChatResponse } from "@roomz/shared/services/ai-chatbot";

interface DisplayMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      text: "Xin chào! 👋 Tôi là trợ lý AI của RommZ. Tôi có thể giúp bạn tìm phòng, trả lời câu hỏi về app, hoặc hỗ trợ bất kỳ điều gì!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const suggestedQuestions = [
    "Tìm phòng ở Quận 7 dưới 3 triệu",
    "Cho tôi biết về RommZ+",
    "SwapRoom hoạt động thế nào?",
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || isSendingRef.current) return;

    if (!user) {
      setError("Vui lòng đăng nhập để sử dụng chatbot.");
      return;
    }
    isSendingRef.current = true;

    setError(null);
    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response: AIChatResponse = await sendAIChatMessage(
        supabase,
        trimmed,
        sessionId || undefined
      );

      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      const botMsg: DisplayMessage = {
        id: `bot-${Date.now()}`,
        text: response.message,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.";

      if (/Invalid JWT|đăng nhập/i.test(errorMessage)) {
        await supabase.auth.signOut().catch(() => undefined);
        setSessionId(null);
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([{
      id: "welcome",
      text: "Xin chào! 👋 Tôi là trợ lý AI của RommZ. Tôi có thể giúp bạn tìm phòng, trả lời câu hỏi về app, hoặc hỗ trợ bất kỳ điều gì!",
      sender: "bot",
      timestamp: new Date(),
    }]);
    setError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-20 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg z-[60] transition-transform hover:scale-110"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>

      {/* Chat Panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] md:h-[600px] md:max-w-md md:right-6 md:left-auto md:bottom-6 md:top-auto rounded-t-3xl md:rounded-3xl p-0 border-0 shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-primary to-secondary">
                <AvatarFallback className="bg-transparent">
                  <Sparkles className="w-6 h-6 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-left">Trợ lý AI RommZ ✨</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Powered by Gemini • Tìm phòng, hỏi đáp, hỗ trợ 24/7
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleNewChat}
                title="Cuộc trò chuyện mới"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Chat Body */}
          <div className="flex flex-col h-[calc(100%-140px)] md:h-[calc(100%-160px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Gợi ý nhanh:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((question, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors rounded-full px-3 py-1.5"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar
                    className={`w-8 h-8 shrink-0 ${message.sender === "bot"
                      ? "bg-gradient-to-br from-primary to-secondary"
                      : "bg-muted"
                      }`}
                  >
                    <AvatarFallback className="bg-transparent">
                      {message.sender === "bot" ? (
                        <Sparkles className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`max-w-[75%] ${message.sender === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${message.sender === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground px-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2 flex-row">
                  <Avatar className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary to-secondary">
                    <AvatarFallback className="bg-transparent">
                      <Sparkles className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center">
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 inline-block">
                    {error}
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={user ? "Hỏi trợ lý AI bất kỳ điều gì..." : "Đăng nhập để sử dụng chatbot"}
                  className="flex-1 rounded-full border-2 focus-visible:ring-primary bg-muted/50"
                  disabled={isLoading || !user}
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
                  disabled={!inputValue.trim() || isLoading || !user}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
