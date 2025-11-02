import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessagesList } from "@/components/common/MessagesList";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { messagesData } from "../data/messages";
import { ArrowLeft } from "lucide-react";

export default function MessagesPage() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatPerson, setSelectedChatPerson] = useState<any>(null);

  const handleMessageClick = (message: any) => {
    setSelectedChatPerson(message);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="ml-3">Tin nhắn</h3>
        </div>
      </div>

      {/* Messages Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <MessagesList messages={messagesData} onMessageClick={handleMessageClick} />
      </div>

      {/* Chat Drawer */}
      {selectedChatPerson && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientName={selectedChatPerson.name}
          recipientRole="Người tìm bạn cùng phòng"
        />
      )}
    </div>
  );
}

