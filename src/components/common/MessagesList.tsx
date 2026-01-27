import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface Message {
  id?: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  conversationId?: string;
  participantId?: string;
}

interface MessagesListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  try {
    return formatDistanceToNow(parseISO(timeStr), { addSuffix: true, locale: vi });
  } catch {
    return timeStr;
  }
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
          key={message.id || index}
          onClick={() => onMessageClick(message)}
          className={`p-4 rounded-2xl hover:shadow-md transition-shadow cursor-pointer ${message.unread ? "bg-primary/5 border-primary/20" : ""
            }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar>
                {message.avatar ? (
                  <AvatarImage src={message.avatar} alt={message.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                  {message.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {message.unreadCount && message.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {message.unreadCount > 9 ? "9+" : message.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className={`truncate ${message.unread ? "font-semibold" : ""}`}>
                  {message.name}
                </p>
                <span className="text-xs text-gray-500 shrink-0">
                  {formatTime(message.time)}
                </span>
              </div>
              <p className={`text-sm truncate ${message.unread ? "text-foreground font-medium" : "text-gray-600"}`}>
                {message.lastMessage}
              </p>
            </div>
            {message.unread && !message.unreadCount && (
              <div className="w-3 h-3 bg-primary rounded-full shrink-0"></div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
