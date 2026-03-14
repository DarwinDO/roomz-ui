/**
 * SwapRequestCard Component
 * Display cards for swap request history and action handling.
 */

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SwapRequest } from '@roomz/shared/types/swap';

interface SwapRequestCardProps {
  request: SwapRequest;
  isIncoming: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onViewDetails?: () => void;
  disabled?: boolean;
}

const statusConfig = {
  pending: { label: 'Chờ phản hồi', color: 'bg-yellow-500', icon: Clock },
  accepted: { label: 'Đã chấp nhận', color: 'bg-blue-500', icon: CheckCircle },
  rejected: { label: 'Đã từ chối', color: 'bg-red-500', icon: XCircle },
} as const;

export function SwapRequestCard({
  request,
  isIncoming,
  onAccept,
  onReject,
  onCancel,
  onViewDetails,
  disabled = false,
}: SwapRequestCardProps) {
  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const otherUser = isIncoming ? request.requester : request.recipient;
  const otherListing = isIncoming ? request.requester_listing : request.recipient_listing;
  const myListing = isIncoming ? request.recipient_listing : request.requester_listing;

  const myRoom = myListing?.original_room;
  const otherRoom = otherListing?.original_room;

  return (
    <Card className="space-y-4 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback>{otherUser?.full_name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{otherUser?.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {isIncoming ? 'Đã gửi đề xuất tới tin của bạn' : 'Bạn đã gửi đề xuất tới host này'}
            </p>
          </div>
        </div>
        <Badge className={cn(status.color, 'text-white')}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tin của bạn</p>
          <p className="line-clamp-1 text-sm font-medium">{myRoom?.title || 'Đang cập nhật'}</p>
          <p className="text-xs text-muted-foreground">{myRoom?.district || 'Chưa có khu vực'}</p>
        </div>

        <div className="flex flex-col items-center text-primary">
          {isIncoming ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </div>

        <div className="space-y-1 text-right">
          <p className="text-xs text-muted-foreground">Tin được đề xuất</p>
          <p className="line-clamp-1 text-sm font-medium">{otherRoom?.title || 'Đang cập nhật'}</p>
          <p className="text-xs text-muted-foreground">{otherRoom?.district || 'Chưa có khu vực'}</p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        <p className="mb-1 text-xs text-muted-foreground">Khoảng thời gian đề xuất</p>
        <p className="font-medium">
          {format(new Date(request.proposed_start_date), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(request.proposed_end_date), 'dd/MM/yyyy', { locale: vi })}
        </p>
      </div>

      {request.message ? (
        <div className="rounded-lg bg-primary/5 p-3 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">Ghi chú</p>
          <p className="italic">&ldquo;{request.message}&rdquo;</p>
        </div>
      ) : null}

      <div className="flex gap-2 pt-2">
        {onViewDetails ? (
          <Button variant="outline" className="flex-1" onClick={onViewDetails}>
            Xem chi tiết
          </Button>
        ) : null}

        {isIncoming && request.status === 'pending' ? (
          <>
            {onReject ? (
              <Button variant="outline" className="flex-1" onClick={onReject} disabled={disabled}>
                <XCircle className="mr-2 h-4 w-4" />
                Từ chối
              </Button>
            ) : null}
            {onAccept ? (
              <Button className="flex-1" onClick={onAccept} disabled={disabled}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Chấp nhận
              </Button>
            ) : null}
          </>
        ) : null}

        {!isIncoming && request.status === 'pending' && onCancel ? (
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={disabled}>
            Hủy đề xuất
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
