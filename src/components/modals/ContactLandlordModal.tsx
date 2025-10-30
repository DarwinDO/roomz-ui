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
      text: "Xin chào, tôi là Nguyễn Văn Minh — tôi có thể giúp gì cho bạn về căn phòng này?",
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

    if (input.includes("available") || input.includes("when") || input.includes("khi nào") || input.includes("còn trống")) {
      return "Phòng còn trống từ ngày 1 tháng 11 năm 2025. Bạn có muốn đặt lịch xem phòng không?";
    } else if (input.includes("price") || input.includes("rent") || input.includes("cost") || input.includes("giá") || input.includes("thuê")) {
      return "Giá thuê là 3.5 triệu đồng mỗi tháng, đã bao gồm tiện ích. Còn có tiền đặt cọc một lần là 3.5 triệu đồng.";
    } else if (input.includes("viewing") || input.includes("visit") || input.includes("see") || input.includes("xem") || input.includes("gặp")) {
      return "Tôi rất sẵn lòng cho bạn xem phòng! Tôi thường rảnh vào các ngày trong tuần sau 5 giờ chiều và cuối tuần. Thời gian nào thuận tiện cho bạn?";
    } else if (input.includes("pet") || input.includes("dog") || input.includes("cat") || input.includes("thú cưng") || input.includes("chó") || input.includes("mèo")) {
      return "Rất tiếc, tòa nhà này có chính sách không cho phép nuôi thú cưng. Tôi xin lỗi vì sự bất tiện này.";
    } else if (input.includes("furnished") || input.includes("furniture") || input.includes("nội thất") || input.includes("đồ đạc")) {
      return "Có, phòng được trang bị đầy đủ nội thất gồm giường, bàn làm việc, ghế và tủ quần áo. Khu vực chung cũng có đầy đủ nội thất cần thiết.";
    } else {
      return "Cảm ơn câu hỏi của bạn! Tôi sẽ trả lời chi tiết hơn trong thời gian tới. Cứ thoải mái hỏi thêm!";
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
            <DialogTitle>Liên hệ chủ nhà</DialogTitle>
            <DialogDescription>Trò chuyện với chủ nhà</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20">
                <AvatarFallback>NM</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base">Nguyễn Văn Minh</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Đang hoạt động</span>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="mt-3 w-fit text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Thường trả lời trong vòng 1 giờ
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
                    "NM"
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
              placeholder="Nhập tin nhắn của bạn..."
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
