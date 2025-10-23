import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, User, Bot } from "lucide-react";

interface ContactLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "landlord";
  timestamp: Date;
}

export function ContactLandlordModal({ isOpen, onClose }: ContactLandlordModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi, I'm John Doe — how can I help you with this property?",
      sender: "landlord",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate landlord response
    setTimeout(() => {
      const landlordResponse: Message = {
        id: messages.length + 2,
        text: getLandlordResponse(inputValue),
        sender: "landlord",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, landlordResponse]);
    }, 1500);
  };

  const getLandlordResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("available") || input.includes("when")) {
      return "The room is available from November 1st, 2025. Would you like to schedule a viewing?";
    } else if (input.includes("price") || input.includes("rent") || input.includes("cost")) {
      return "The rent is $850 per month, which includes utilities. There's also a one-time security deposit of $850.";
    } else if (input.includes("viewing") || input.includes("visit") || input.includes("see")) {
      return "I'd be happy to show you the room! I'm usually available on weekdays after 5 PM and weekends. What works best for you?";
    } else if (input.includes("pet") || input.includes("dog") || input.includes("cat")) {
      return "Unfortunately, we have a no-pets policy in this building. I apologize for any inconvenience.";
    } else if (input.includes("furnished") || input.includes("furniture")) {
      return "Yes, the room comes fully furnished with a bed, desk, chair, and closet. The common areas also have all necessary furniture.";
    } else {
      return "Thanks for your question! I'll get back to you with more details shortly. Feel free to ask anything else!";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 h-[600px] flex flex-col" aria-describedby={undefined}>
        <DialogHeader className="p-5 pb-4 border-b border-border shrink-0">
          <VisuallyHidden>
            <DialogTitle>Contact Landlord</DialogTitle>
            <DialogDescription>Chat with the property landlord</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base">John Doe</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Active now</span>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="mt-3 w-fit text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Usually replies within 1 hour
          </Badge>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback
                  className={
                    message.sender === "landlord"
                      ? "bg-gradient-to-br from-primary/20 to-secondary/20"
                      : "bg-muted"
                  }
                >
                  {message.sender === "landlord" ? (
                    "JD"
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Message Bubble */}
              <div
                className={`max-w-[75%] ${
                  message.sender === "user" ? "items-end" : "items-start"
                } flex flex-col gap-1`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.sender === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-full border-2 focus-visible:ring-primary"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
              disabled={!inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
