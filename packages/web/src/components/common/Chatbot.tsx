import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, Loader2, MessageCircle, Send, Sparkles, Trash2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts";
import { sendAIChatMessage } from "@roomz/shared/services/ai-chatbot";
import type { AIChatResponse, RomiChatAction } from "@roomz/shared/services/ai-chatbot";
import { ROMI_NAME, ROMI_SUGGESTED_QUESTIONS, ROMI_WELCOME_MESSAGE } from "@roomz/shared/constants/romi";
import {
  trackRomiActionClicked,
  trackRomiError,
  trackRomiOpened,
  trackRomiSuggestedPromptClicked,
} from "@/services/analyticsTracking";

interface DisplayMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  actions?: RomiChatAction[];
}

const WELCOME_MESSAGE = ROMI_WELCOME_MESSAGE;

export function Chatbot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      text: WELCOME_MESSAGE,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    void trackRomiOpened(user?.id ?? null);
  }, [isOpen, user?.id]);

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || isSendingRef.current) return;

    if (!user) {
      setError("Vui lòng đăng nhập để sử dụng ROMI.");
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

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response: AIChatResponse = await sendAIChatMessage(
        supabase,
        trimmed,
        sessionId || undefined,
      );

      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      const botMsg: DisplayMessage = {
        id: `bot-${Date.now()}`,
        text: response.message,
        sender: "bot",
        timestamp: new Date(),
        actions: response.metadata?.actions,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
      void trackRomiError(user?.id ?? null, errorMessage, {
        ai_chat_session_id: sessionId,
      });

      if (/Invalid JWT|đăng nhập|dang nhap/i.test(errorMessage)) {
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
    void trackRomiSuggestedPromptClicked(user?.id ?? null, question);
    setInputValue(question);
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([
      {
        id: "welcome",
        text: WELCOME_MESSAGE,
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  const handleActionClick = (action: RomiChatAction) => {
    void trackRomiActionClicked(user?.id ?? null, action, {
      ai_chat_session_id: sessionId,
    });

    if (/^https?:\/\//.test(action.href)) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }

    setIsOpen(false);
    navigate(action.href);
  };

  const formatTime = (date: Date) => date.toLocaleTimeString("vi-VN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[60] h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg transition-transform hover:scale-110 hover:from-primary/90 hover:to-secondary/90 md:bottom-20 md:right-6"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl border-0 p-0 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:top-auto md:h-[600px] md:max-w-md md:rounded-3xl"
        >
          <SheetHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-6 pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-secondary">
                <AvatarFallback className="bg-transparent">
                  <Sparkles className="h-6 w-6 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-left">{ROMI_NAME} ✨</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Trợ lý của RommZ • Tìm phòng, hỏi đáp và điều hướng app
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleNewChat}
                title="Cuộc trò chuyện mới"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex h-[calc(100%-140px)] flex-col md:h-[calc(100%-160px)]">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length <= 1 && (
                <div className="mb-4 space-y-2">
                  <p className="text-center text-xs text-muted-foreground">Gợi ý nhanh:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ROMI_SUGGESTED_QUESTIONS.map((question) => (
                      <Badge
                        key={question}
                        variant="outline"
                        className="cursor-pointer rounded-full px-3 py-1.5 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar
                    className={`h-8 w-8 shrink-0 ${message.sender === "bot" ? "bg-gradient-to-br from-primary to-secondary" : "bg-muted"}`}
                  >
                    <AvatarFallback className="bg-transparent">
                      {message.sender === "bot" ? (
                        <Sparkles className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4 text-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex max-w-[78%] flex-col gap-2 ${message.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${message.sender === "user" ? "rounded-tr-sm bg-primary text-white" : "rounded-tl-sm bg-muted text-foreground"}`}
                    >
                      <p className="whitespace-pre-line text-sm">{message.text}</p>
                    </div>
                    {message.sender === "bot" && message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <Button
                            key={`${message.id}-${action.type}-${action.href}`}
                            variant="outline"
                            size="sm"
                            className="h-auto rounded-full px-3 py-2 text-left"
                            onClick={() => handleActionClick(action)}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{action.label}</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                    <span className="px-1 text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-row gap-2">
                  <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-primary to-secondary">
                    <AvatarFallback className="bg-transparent">
                      <Sparkles className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">ROMI đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center">
                  <p className="inline-block rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={user ? "Hỏi ROMI bất kỳ điều gì..." : "Đăng nhập để sử dụng ROMI"}
                  className="flex-1 rounded-full border-2 bg-muted/50 focus-visible:ring-primary"
                  disabled={isLoading || !user}
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
                  disabled={!inputValue.trim() || isLoading || !user}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
