/**
 * RequestsList - List of roommate connection requests
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumAvatar } from '@/components/ui/PremiumAvatar';
import { Badge } from '@/components/ui/badge';
import {
    Inbox,
    Send,
    Check,
    X,
    MessageCircle,
    Clock,
    Loader2,
    Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoommateRequestsQuery } from '@/hooks/useRoommatesQuery';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PageLoading } from '../common/LoadingSpinner';
import type { RoommateRequest } from '@/services/roommates';

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending':
            return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Đang chờ</Badge>;
        case 'accepted':
            return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" />Đã chấp nhận</Badge>;
        case 'declined':
            return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Đã từ chối</Badge>;
        case 'cancelled':
            return <Badge variant="outline">Đã hủy</Badge>;
        case 'expired':
            return <Badge variant="outline">Hết hạn</Badge>;
        default:
            return null;
    }
}

interface RequestCardProps {
    request: RoommateRequest;
    type: 'received' | 'sent';
    onAccept?: () => Promise<unknown>;
    onDecline?: () => Promise<unknown>;
    onCancel?: () => Promise<unknown>;
    onMessage?: () => void;
}

function RequestCard({
    request,
    type,
    onAccept,
    onDecline,
    onCancel,
    onMessage,
}: RequestCardProps) {
    const [loading, setLoading] = useState<'accept' | 'decline' | 'cancel' | null>(null);

    const user = type === 'received' ? request.sender : request.receiver;
    const isPending = request.status === 'pending';
    const isAccepted = request.status === 'accepted';

    const handleAction = async (action: 'accept' | 'decline' | 'cancel') => {
        setLoading(action);
        try {
            if (action === 'accept' && onAccept) await onAccept();
            if (action === 'decline' && onDecline) await onDecline();
            if (action === 'cancel' && onCancel) await onCancel();
        } finally {
            setLoading(null);
        }
    };

    const getInitials = (name: string) =>
        name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <Card className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <PremiumAvatar isPremium={user?.is_premium ?? false} className="h-12 w-12">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user?.full_name || '')}
                        </AvatarFallback>
                    </PremiumAvatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold truncate">{user?.full_name || 'Người dùng'}</h4>
                            {getStatusBadge(request.status)}
                        </div>

                        {/* Intro Message Display */}
                        {request.message && (
                            <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary/50">
                                <div className="flex items-start gap-2">
                                    <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Lời nhắn giới thiệu:
                                        </p>
                                        <p className="text-sm text-foreground line-clamp-3">
                                            "{request.message}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), {
                                addSuffix: true,
                                locale: vi,
                            })}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        {type === 'received' && isPending && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => handleAction('accept')}
                                    disabled={loading !== null}
                                >
                                    {loading === 'accept' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            Chấp nhận
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction('decline')}
                                    disabled={loading !== null}
                                >
                                    {loading === 'decline' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <X className="w-4 h-4 mr-1" />
                                            Từ chối
                                        </>
                                    )}
                                </Button>
                            </>
                        )}

                        {type === 'sent' && isPending && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('cancel')}
                                disabled={loading !== null}
                            >
                                {loading === 'cancel' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Hủy'
                                )}
                            </Button>
                        )}

                        {isAccepted && (
                            <Button size="sm" onClick={onMessage}>
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Nhắn tin
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export function RequestsList() {
    const {
        receivedRequests,
        sentRequests,
        loading,
        acceptRequest,
        declineRequest,
        cancelRequest,
    } = useRoommateRequestsQuery();

    const pendingReceived = receivedRequests.filter((r) => r.status === 'pending');
    const pendingSent = sentRequests.filter((r) => r.status === 'pending');

    if (loading) {
        return <PageLoading message="Đang tải yêu cầu kết nối..." />;
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Yêu cầu kết nối</h1>
                <p className="text-muted-foreground">
                    Quản lý các yêu cầu kết bạn cùng phòng
                </p>
            </div>

            <Tabs defaultValue="received" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="received" className="relative">
                        <Inbox className="w-4 h-4 mr-2" />
                        Nhận được
                        {pendingReceived.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                                {pendingReceived.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        <Send className="w-4 h-4 mr-2" />
                        Đã gửi
                        {pendingSent.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-muted rounded-full">
                                {pendingSent.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="mt-6">
                    <AnimatePresence>
                        {receivedRequests.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">Chưa có yêu cầu nào</h3>
                                <p className="text-sm text-muted-foreground">
                                    Khi có người muốn kết nối với bạn, yêu cầu sẽ hiện ở đây
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {receivedRequests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        type="received"
                                        onAccept={() => acceptRequest(request.id)}
                                        onDecline={() => declineRequest(request.id)}
                                        onMessage={() => {
                                            // Navigate to messages
                                            window.location.href = `/messages?user=${request.sender_id}`;
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                <TabsContent value="sent" className="mt-6">
                    <AnimatePresence>
                        {sentRequests.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">Chưa gửi yêu cầu nào</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tìm và gửi yêu cầu kết nối đến bạn cùng phòng tiềm năng
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {sentRequests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        type="sent"
                                        onCancel={() => cancelRequest(request.id)}
                                        onMessage={() => {
                                            window.location.href = `/messages?user=${request.receiver_id}`;
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </TabsContent>
            </Tabs>
        </>
    );
}
