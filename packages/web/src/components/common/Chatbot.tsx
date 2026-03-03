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
      text: "Xin chào! 👋 Tôi là trợ lý RoomZ. Tôi có thể giúp gì cho bạn?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const suggestedQuestions = [
    "Tìm phòng đã xác thực gần tôi",
    "Làm sao để đăng tin phòng?",
    "Cho tôi biết về RoomZ+",
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

    if (input.includes("verified") || input.includes("find") || input.includes("room") || input.includes("xác thực") || input.includes("tìm") || input.includes("phòng")) {
      return "Tuyệt vời! Tôi có thể giúp bạn tìm phòng đã xác thực. Tất cả tin đăng đều được xác thực bằng giấy tờ và ảnh 360°. Bạn có thể tìm kiếm theo địa điểm, giá, hoặc sử dụng tính năng phù hợp để tìm bạn cùng phòng hoàn hảo. Bạn có muốn tôi đưa bạn đến trang tìm kiếm không?";
    } else if (input.includes("list") || input.includes("my room") || input.includes("đăng") || input.includes("phòng của tôi")) {
      return "Để đăng tin phòng trên RoomZ, bạn cần xác thực tài khoản trước. Nhấn 'Xác thực' trong menu, hoàn thành xác thực giấy tờ, sau đó bạn có thể đăng phòng kèm ảnh và chi tiết. Tin đăng đã xác thực có lượt xem gấp 3 lần! 🏠";
    } else if (input.includes("roomz+") || input.includes("plus") || input.includes("upgrade") || input.includes("nâng cấp")) {
      return "RoomZ+ là gói thành viên cao cấp với giá 200.000đ/tháng! Lợi ích bao gồm:\n\n✅ Ưu tiên hiển thị kết quả tìm kiếm\n✅ Phù hợp nâng cao\n✅ Không phí đặt phòng\n✅ Ưu đãi và giảm giá độc quyền\n\nBạn có muốn nâng cấp không?";
    } else if (input.includes("swap") || input.includes("sublet") || input.includes("thuê lại") || input.includes("hoán đổi")) {
      return "SwapRoom là tính năng cho thuê linh hoạt! Bạn có thể đăng phòng cho thuê ngắn hạn hoặc hoán đổi với sinh viên khác. Hoàn hảo cho thực tập hè, du học, hoặc chuyển chỗ tạm thời. Xem mục SwapRoom để bắt đầu! 🔄";
    } else if (input.includes("services") || input.includes("moving") || input.includes("cleaning") || input.includes("dịch vụ") || input.includes("chuyển nhà") || input.includes("dọn dẹp")) {
      return "Chúng tôi cung cấp dịch vụ đối tác tin cậy bao gồm hỗ trợ chuyển nhà, dọn phòng và thiết lập. Tất cả đối tác đều được xác thực và giảm giá 15% cho sinh viên! Truy cập mục 'Dịch vụ' để đặt lịch. 📦";
    } else if (input.includes("perks") || input.includes("discount") || input.includes("passport") || input.includes("ưu đãi") || input.includes("giảm giá")) {
      return "Thẻ Ưu đãi của bạn mang lại các deal độc quyền dành cho sinh viên tại quán cà phê, phòng gym, giặt là và nhà hàng gần bạn! Giảm giá lên đến 30% tại các địa điểm đối tác. Xem mục 'Ưu đãi' để khám phá! 🎁";
    } else {
      return "Tôi ở đây để giúp bạn! Bạn có thể hỏi tôi về:\n\n🏠 Tìm phòng đã xác thực\n🤝 Tìm bạn cùng phòng phù hợp\n💎 Lợi ích RoomZ+\n🔄 Cho thuê lại SwapRoom\n📦 Dịch vụ chuyển nhà & dọn dẹp\n🎁 Ưu đãi địa phương cho sinh viên\n\nBạn muốn biết thêm về gì?";
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
        className="fixed bottom-24 right-4 md:bottom-20 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg z-[60] transition-transform hover:scale-110"
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
                <SheetTitle className="text-left">Trợ lý RoomZ 🤖</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Hỏi bất cứ điều gì về tìm phòng hoặc đời sống sinh viên
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
                  className={`flex gap-2 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                >
                  {/* Avatar */}
                  <Avatar
                    className={`w-8 h-8 shrink-0 ${message.sender === "bot"
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
                    className={`max-w-[75%] ${message.sender === "user" ? "items-end" : "items-start"
                      } flex flex-col gap-1`}
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
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-white p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Nhập câu hỏi của bạn..."
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
