import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi there! 👋 I'm your RoomZ Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const suggestedQuestions = [
    "Find verified rooms near me",
    "How do I list my room?",
    "Tell me about RoomZ+",
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("verified") || input.includes("find") || input.includes("room")) {
      return "Great! I can help you find verified rooms. All our listings are verified with ID checks and 360° photos. You can start searching by location, price range, or use our compatibility matching to find the perfect roommate. Would you like me to take you to the search page?";
    } else if (input.includes("list") || input.includes("my room")) {
      return "To list your room on RoomZ, you'll need to get verified first. Click on 'Get Verified' in the menu, complete the ID verification, and then you can list your room with photos and details. Verified listings get 3x more views! 🏠";
    } else if (input.includes("roomz+") || input.includes("plus") || input.includes("upgrade")) {
      return "RoomZ+ is our premium membership at $9.99/mo! Benefits include:\n\n✅ Priority in search results\n✅ Advanced compatibility matching\n✅ No booking fees\n✅ Exclusive perks & discounts\n\nWould you like to upgrade?";
    } else if (input.includes("swap") || input.includes("sublet")) {
      return "SwapRoom is our flexible subletting feature! You can list your room for short-term stays or swap with other students. It's perfect for summer internships, semester abroad, or temporary relocations. Check out the SwapRoom tab to get started! 🔄";
    } else if (input.includes("services") || input.includes("moving") || input.includes("cleaning")) {
      return "We offer trusted partner services including moving assistance, room cleaning, and setup help. All partners are verified and offer 15% student discounts! Visit the 'Services' section to book. 📦";
    } else if (input.includes("perks") || input.includes("discount") || input.includes("passport")) {
      return "Your Local Passport gives you exclusive student deals at cafés, gyms, laundromats, and restaurants near you! Get up to 30% off at partner locations. Check out the 'Perks' section to explore deals nearby! 🎁";
    } else {
      return "I'm here to help! You can ask me about:\n\n🏠 Finding verified rooms\n🤝 Roommate matching\n💎 RoomZ+ benefits\n🔄 SwapRoom subletting\n📦 Moving & cleaning services\n🎁 Local student perks\n\nWhat would you like to know more about?";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg z-40 transition-transform hover:scale-110"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>

      {/* Chat Panel Overlay */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] md:h-[600px] md:max-w-md md:right-6 md:left-auto md:bottom-6 md:top-auto rounded-t-3xl md:rounded-3xl p-0 border-0 shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-primary to-secondary">
                <AvatarFallback className="bg-transparent">
                  <Bot className="w-6 h-6 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-left">RoomZ Assistant 🤖</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Ask anything about finding rooms or student life
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Chat Messages Area */}
          <div className="flex flex-col h-[calc(100%-140px)] md:h-[calc(100%-160px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Quick suggestions:
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
                  className={`flex gap-2 ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <Avatar
                    className={`w-8 h-8 shrink-0 ${
                      message.sender === "bot"
                        ? "bg-gradient-to-br from-primary to-secondary"
                        : "bg-muted"
                    }`}
                  >
                    <AvatarFallback className="bg-transparent">
                      {message.sender === "bot" ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-foreground" />
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
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground px-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your question..."
                  className="flex-1 rounded-full border-2 focus-visible:ring-primary bg-muted/50"
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
