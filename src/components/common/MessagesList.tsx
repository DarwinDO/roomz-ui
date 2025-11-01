import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

interface MessagesListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
}

export function MessagesList({ messages, onMessageClick }: MessagesListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-gray-600">Tin nhắn của bạn sẽ hiển thị ở đây.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <Card
          key={index}
          onClick={() => onMessageClick(message)}
          className="p-4 rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>
                {message.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="truncate">{message.name}</p>
                <span className="text-xs text-gray-500 shrink-0">
                  {message.time}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {message.lastMessage}
              </p>
            </div>
            {message.unread && (
              <div className="w-3 h-3 bg-primary rounded-full shrink-0"></div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
