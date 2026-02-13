/**
 * SwapRequestCard Component
 * Display card for swap requests
 * Following UX Psychology principles
 */

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowRight, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { SwapRequest } from '@/types/swap';

interface SwapRequestCardProps {
    request: SwapRequest;
    isIncoming: boolean;
    onAccept?: () => void;
    onReject?: () => void;
    onCancel?: () => void;
    onViewDetails?: () => void;
    disabled?: boolean;
}

export function SwapRequestCard({
    request,
    isIncoming,
    onAccept,
    onReject,
    onCancel,
    onViewDetails,
    disabled = false,
}: SwapRequestCardProps) {
    const statusConfig = {
        pending: { label: 'Chờ phản hồi', color: 'bg-yellow-500', icon: Clock },
        accepted: { label: 'Đã chấp nhận', color: 'bg-blue-500', icon: CheckCircle },
        rejected: { label: 'Đã từ chối', color: 'bg-red-500', icon: XCircle },
    };

    const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = status.icon;

    const otherUser = isIncoming ? request.requester : request.recipient;
    const otherListing = isIncoming ? request.requester_listing : request.recipient_listing;
    const myListing = isIncoming ? request.recipient_listing : request.requester_listing;

    // Access room data via Supabase join alias 'original_room'
    const myRoom = myListing?.original_room;
    const otherRoom = otherListing?.original_room;

    return (
        <Card className="p-4 space-y-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={otherUser?.avatar_url || undefined} />
                        <AvatarFallback>{otherUser?.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{otherUser?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                            {isIncoming ? 'Gửi yêu cầu hoán đổi' : 'Bạn đã gửi yêu cầu'}
                        </p>
                    </div>
                </div>
                <Badge className={cn(status.color, 'text-white')}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                </Badge>
            </div>

            {/* Listing Comparison */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                {/* My Listing */}
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Phòng của bạn</p>
                    <p className="font-medium text-sm line-clamp-1">{myRoom?.title}</p>
                    <p className="text-xs text-muted-foreground">{myRoom?.district}</p>
                </div>

                {/* Direction Arrow */}
                <div className="flex flex-col items-center">
                    {isIncoming ? (
                        <ArrowLeft className="w-5 h-5 text-primary" />
                    ) : (
                        <ArrowRight className="w-5 h-5 text-primary" />
                    )}
                </div>

                {/* Other Listing */}
                <div className="space-y-1 text-right">
                    <p className="text-xs text-muted-foreground">Phòng đề xuất</p>
                    <p className="font-medium text-sm line-clamp-1">{otherRoom?.title}</p>
                    <p className="text-xs text-muted-foreground">{otherRoom?.district}</p>
                </div>
            </div>

            {/* Proposed Dates */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Thờ gian đề xuất</p>
                <p className="font-medium">
                    {format(new Date(request.proposed_start_date), 'dd/MM/yyyy', { locale: vi })} - {' '}
                    {format(new Date(request.proposed_end_date), 'dd/MM/yyyy', { locale: vi })}
                </p>
            </div>

            {/* Message */}
            {request.message && (
                <div className="bg-primary/5 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground text-xs mb-1">Tin nhắn</p>
                    <p className="italic">&ldquo;{request.message}&rdquo;</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                {onViewDetails && (
                    <Button variant="outline" className="flex-1" onClick={onViewDetails}>
                        Xem chi tiết
                    </Button>
                )}
                {isIncoming && request.status === 'pending' && (
                    <>
                        {onReject && (
                            <Button variant="outline" className="flex-1" onClick={onReject} disabled={disabled}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Từ chối
                            </Button>
                        )}
                        {onAccept && (
                            <Button className="flex-1" onClick={onAccept} disabled={disabled}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Chấp nhận
                            </Button>
                        )}
                    </>
                )}
                {!isIncoming && request.status === 'pending' && onCancel && (
                    <Button variant="outline" className="flex-1" onClick={onCancel} disabled={disabled}>
                        Hủy yêu cầu
                    </Button>
                )}
            </div>
        </Card>
    );
}
