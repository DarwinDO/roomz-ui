import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, X } from "lucide-react";
import { useState } from "react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientRole?: string;
  compatibilityScore?: number;
}

export function ChatDrawer({ isOpen, onClose, recipientName, recipientRole, compatibilityScore }: ChatDrawerProps) {
  const [message, setMessage] = useState("");

  const quickMessages = [
    "Chào bạn! Mình thấy chúng ta khá phù hợp!",
    "Mình muốn tìm hiểu thêm về lối sống của bạn!",
    "Bạn muốn gặp lúc nào?",
  ];

  const exampleMessages = [
    {
      sender: "them",
      text: "Chào bạn! Cảm ơn bạn đã liên hệ. Mình rất muốn nói chuyện về việc ở cùng!",
      time: "2:30 PM",
    },
    {
      sender: "you",
      text: "Tuyệt! Mình thấy chúng ta có 92% độ phù hợp. Khi nào thì tiện để gặp nhỉ?",
      time: "2:32 PM",
    },
    {
      sender: "them",
      text: "Mình rảnh cuối tuần này. Chiều thứ Bảy nhé?",
      time: "2:35 PM",
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message
      setMessage("");
    }
  };

  const handleQuickMessage = (quickMsg: string) => {
    setMessage(quickMsg);
  };

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
                onClick={() => handleQuickMessage(quickMsg)}
              >
                {quickMsg}
              </Badge>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {exampleMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.sender === "you"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === "you" ? "text-primary-foreground/70" : "text-gray-500"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
