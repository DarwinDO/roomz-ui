/**
 * SwapRequestsPage
 * Manage incoming and outgoing swap requests inside the short-stay lane.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, RotateCcw, Send } from 'lucide-react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SwapRequestCard } from '@/components/swap';
import { useCancelSwapRequest, useRespondToSwapRequest, useSwapRequests } from '@/hooks/useSwap';
import { toast } from 'sonner';
import type { SwapRequest } from '@roomz/shared/types/swap';

export default function SwapRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: requests, isLoading, isError, refetch } = useSwapRequests();
  const respondToRequest = useRespondToSwapRequest();
  const cancelRequest = useCancelSwapRequest();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const incomingRequests = requests?.filter((request) => request.status === 'pending' && request.recipient_id === user?.id) || [];
  const outgoingRequests = requests?.filter((request) => request.requester_id === user?.id) || [];
  const allRequests = requests || [];

  const handleAccept = async (request: SwapRequest) => {
    setProcessingId(request.id);

    try {
      await respondToRequest.mutateAsync({
        requestId: request.id,
        response: { status: 'accepted' },
      });
      toast.success('Đã chấp nhận', {
        description: 'Đề xuất hoán đổi đã được chấp nhận.',
      });
    } catch {
      toast.error('Không thể chấp nhận', {
        description: 'Vui lòng thử lại sau.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: SwapRequest) => {
    const reason = window.prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) {
      return;
    }

    setProcessingId(request.id);

    try {
      await respondToRequest.mutateAsync({
        requestId: request.id,
        response: {
          status: 'rejected',
          rejection_reason: reason || 'Chưa phù hợp vào lúc này',
        },
      });
      toast.success('Đã từ chối', {
        description: 'Đề xuất hoán đổi đã được cập nhật.',
      });
    } catch {
      toast.error('Không thể từ chối', {
        description: 'Vui lòng thử lại sau.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (request: SwapRequest) => {
    setProcessingId(request.id);

    try {
      await cancelRequest.mutateAsync(request.id);
      toast.success('Đã hủy đề xuất', {
        description: 'Yêu cầu của bạn không còn chờ phản hồi nữa.',
      });
    } catch {
      toast.error('Không thể hủy đề xuất', {
        description: 'Vui lòng thử lại sau.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/swap')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Quản lý đề xuất hoán đổi</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Theo dõi các đề xuất bạn nhận được và đã gửi cho chỗ ở ngắn hạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-3 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="incoming" className="rounded-lg">
              <Inbox className="mr-2 h-4 w-4" />
              Nhận được
              {incomingRequests.length > 0 ? (
                <Badge variant="destructive" className="ml-2">{incomingRequests.length}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="rounded-lg">
              <Send className="mr-2 h-4 w-4" />
              Đã gửi
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg">
              <RotateCcw className="mr-2 h-4 w-4" />
              Tất cả
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <Card key={item} className="h-48 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Card className="p-10 text-center">
                <p className="mb-4 text-muted-foreground">Không thể tải các đề xuất bạn nhận được.</p>
                <Button onClick={() => refetch()}>Tải lại</Button>
              </Card>
            ) : incomingRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Chưa có đề xuất nào</h3>
                <p className="text-muted-foreground">
                  Khi có người muốn trao đổi thêm với tin ở ngắn hạn của bạn, mục này sẽ hiện ngay.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <SwapRequestCard
                    key={request.id}
                    request={request}
                    isIncoming
                    onAccept={() => handleAccept(request)}
                    onReject={() => handleReject(request)}
                    disabled={processingId === request.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <Card key={item} className="h-48 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Card className="p-10 text-center">
                <p className="mb-4 text-muted-foreground">Không thể tải các đề xuất bạn đã gửi.</p>
                <Button onClick={() => refetch()}>Tải lại</Button>
              </Card>
            ) : outgoingRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Bạn chưa gửi đề xuất nào</h3>
                <p className="mb-4 text-muted-foreground">
                  Hãy xem các cơ hội phù hợp trong mục hoán đổi nếu bạn muốn trao đổi thêm với một host khác.
                </p>
                <Button onClick={() => navigate('/swap-matches')}>Xem cơ hội hoán đổi</Button>
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

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <Card key={item} className="h-48 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <Card className="p-10 text-center">
                <p className="mb-4 text-muted-foreground">Không thể tải lịch sử đề xuất.</p>
                <Button onClick={() => refetch()}>Tải lại</Button>
              </Card>
            ) : allRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <RotateCcw className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Chưa có lịch sử nào</h3>
                <p className="text-muted-foreground">Lịch sử đề xuất hoán đổi sẽ xuất hiện ở đây khi bạn bắt đầu dùng mục này.</p>
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
