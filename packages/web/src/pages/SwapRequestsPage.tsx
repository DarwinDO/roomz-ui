/**
 * SwapRequestsPage
 * Manage incoming and outgoing swap requests
 */

import { useState } from 'react';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SwapRequestCard } from '@/components/swap';
import {
    useSwapRequests,
    useRespondToSwapRequest,
    useCancelSwapRequest,
} from '@/hooks/useSwap';
import { toast } from 'sonner';
import type { SwapRequest } from '@roomz/shared/types/swap';

export default function SwapRequestsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: requests, isLoading, isError } = useSwapRequests();
    const respondToRequest = useRespondToSwapRequest();
    const cancelRequest = useCancelSwapRequest();

    const [processingId, setProcessingId] = useState<string | null>(null);

    const incomingRequests =
        requests?.filter((r) => r.status === 'pending' && r.recipient_id === user?.id) || [];
    const outgoingRequests =
        requests?.filter((r) => r.requester_id === user?.id) || [];
    const allRequests = requests || [];

    const handleAccept = async (request: SwapRequest) => {
        setProcessingId(request.id);
        try {
            await respondToRequest.mutateAsync({
                requestId: request.id,
                response: { status: 'accepted' },
            });
            toast.success('Đã chấp nhận!', {
                description: 'Yêu cầu hoán đổi đã được chấp nhận.',
            });
        } catch (error) {
            toast.error('Lỗi', {
                description: 'Không thể chấp nhận yêu cầu.',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request: SwapRequest) => {
        setProcessingId(request.id);
        try {
            await respondToRequest.mutateAsync({
                requestId: request.id,
                response: { status: 'rejected', rejection_reason: 'Không phù hợp' },
            });
            toast.success('Đã từ chối', {
                description: 'Yêu cầu đã bị từ chối.',
            });
        } catch (error) {
            toast.error('Lỗi', {
                description: 'Không thể từ chối yêu cầu.',
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (request: SwapRequest) => {
        setProcessingId(request.id);
        try {
            await cancelRequest.mutateAsync(request.id);
            toast.success('Đã hủy', {
                description: 'Yêu cầu của bạn đã được hủy.',
            });
        } catch (error) {
            toast.error('Lỗi', {
                description: 'Không thể hủy yêu cầu.',
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="pb-20 md:pb-8 min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-30 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/swap')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Yêu cầu hoán đổi</h1>
                            <p className="text-muted-foreground text-sm hidden sm:block">
                                Quản lý yêu cầu gửi đến và đã gửi
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <Tabs defaultValue="incoming" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger value="incoming" className="rounded-lg">
                            <Inbox className="w-4 h-4 mr-2" />
                            Đến
                            {incomingRequests.length > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {incomingRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="outgoing" className="rounded-lg">
                            <Send className="w-4 h-4 mr-2" />
                            Đã gửi
                        </TabsTrigger>
                        <TabsTrigger value="all" className="rounded-lg">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Tất cả
                        </TabsTrigger>
                    </TabsList>

                    {/* Incoming */}
                    <TabsContent value="incoming" className="space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <Card key={i} className="h-48 animate-pulse" />
                                ))}
                            </div>
                        ) : incomingRequests.length === 0 ? (
                            <Card className="p-12 text-center">
                                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Inbox className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 font-medium">Chưa có yêu cầu nào</h3>
                                <p className="text-muted-foreground">
                                    Khi có người gửi yêu cầu hoán đổi, bạn sẽ thấy ở đây.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {incomingRequests.map((request) => (
                                    <SwapRequestCard
                                        key={request.id}
                                        request={request}
                                        isIncoming={true}
                                        onAccept={() => handleAccept(request)}
                                        onReject={() => handleReject(request)}
                                        disabled={processingId === request.id}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Outgoing */}
                    <TabsContent value="outgoing" className="space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <Card key={i} className="h-48 animate-pulse" />
                                ))}
                            </div>
                        ) : outgoingRequests.length === 0 ? (
                            <Card className="p-12 text-center">
                                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Send className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 font-medium">Chưa gửi yêu cầu nào</h3>
                                <p className="text-muted-foreground mb-4">
                                    Tìm phòng và gửi yêu cầu hoán đổi ngay.
                                </p>
                                <Button onClick={() => navigate('/swap')}>Tìm phòng</Button>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {outgoingRequests.map((request) => (
                                    <SwapRequestCard
                                        key={request.id}
                                        request={request}
                                        isIncoming={false}
                                        onCancel={() => handleCancel(request)}
                                        disabled={processingId === request.id}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* All */}
                    <TabsContent value="all" className="space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="h-48 animate-pulse" />
                                ))}
                            </div>
                        ) : allRequests.length === 0 ? (
                            <Card className="p-12 text-center">
                                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <RotateCcw className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 font-medium">Chưa có yêu cầu nào</h3>
                                <p className="text-muted-foreground">
                                    Lịch sử yêu cầu hoán đổi sẽ hiển thị ở đây.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {allRequests.map((request) => (
                                    <SwapRequestCard
                                        key={request.id}
                                        request={request}
                                        isIncoming={request.recipient_id === user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
