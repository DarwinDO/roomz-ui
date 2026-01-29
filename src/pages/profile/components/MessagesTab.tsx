import { Button } from "@/components/ui/button";
import { AlertCircle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MessagesList } from "@/components/common/MessagesList";

interface MessagesTabProps {
    messages: any[];
    loading: boolean;
    error: string | null;
    onMessageClick: (message: any) => void;
}

export function MessagesTab({
    messages,
    loading,
    error,
    onMessageClick,
}: MessagesTabProps) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 animate-fade-in">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center animate-fade-in">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center animate-fade-in">
                <MessageCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chưa có tin nhắn</h3>
                <p className="text-muted-foreground mb-4">Bắt đầu trò chuyện khi bạn quan tâm đến một phòng</p>
                <Button onClick={() => navigate('/search')} variant="default" className="rounded-xl">
                    Tìm kiếm phòng
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <MessagesList
                messages={messages}
                onMessageClick={onMessageClick}
            />
        </div>
    );
}
