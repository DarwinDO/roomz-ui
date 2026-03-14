/**
 * SwapRequestDialog
 * Form dialog for suggesting a room swap.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertCircle, ArrowRightLeft, Calendar, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateSwapRequest } from '@/hooks/useSwap';
import { useMySublets } from '@/hooks/useSublets';
import { toast } from 'sonner';
import { formatMonthlyPrice } from '@roomz/shared/utils/format';

interface SwapRequestTargetSublet {
  id: string;
  start_date: string;
  end_date: string;
  sublet_price: number;
  room?: {
    title: string;
    district: string;
  };
  owner?: {
    full_name: string;
  };
  images?: Array<{
    image_url: string;
  }>;
}

interface SwapRequestDialogProps {
  targetSublet: SwapRequestTargetSublet | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SwapRequestDialog({ targetSublet, isOpen, onClose }: SwapRequestDialogProps) {
  const createSwapRequest = useCreateSwapRequest();
  const { data: mySublets, isLoading: isLoadingMySublets } = useMySublets();

  const [selectedListingId, setSelectedListingId] = useState('');
  const [formData, setFormData] = useState({
    message: '',
    proposedStartDate: '',
    proposedEndDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!targetSublet) {
    return null;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!selectedListingId) {
      nextErrors.listing = 'Vui lòng chọn tin của bạn để đề xuất hoán đổi';
    }

    if (!formData.proposedStartDate) {
      nextErrors.proposedStartDate = 'Vui lòng chọn ngày bắt đầu';
    }

    if (!formData.proposedEndDate) {
      nextErrors.proposedEndDate = 'Vui lòng chọn ngày kết thúc';
    }

    if (formData.proposedStartDate && formData.proposedEndDate) {
      const start = new Date(formData.proposedStartDate);
      const end = new Date(formData.proposedEndDate);

      if (end <= start) {
        nextErrors.proposedEndDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }

      const maxDuration = 30 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > maxDuration) {
        nextErrors.proposedEndDate = 'Thời gian hoán đổi tối đa 30 ngày';
      }
    }

    if (formData.proposedStartDate) {
      const start = new Date(formData.proposedStartDate);
      const targetStart = new Date(targetSublet.start_date);
      const targetEnd = new Date(targetSublet.end_date);

      if (start < targetStart || start > targetEnd) {
        nextErrors.proposedStartDate = `Ngày bắt đầu phải từ ${format(targetStart, 'dd/MM/yyyy')} đến ${format(targetEnd, 'dd/MM/yyyy')}`;
      }
    }

    if (formData.proposedEndDate) {
      const end = new Date(formData.proposedEndDate);
      const targetStart = new Date(targetSublet.start_date);
      const targetEnd = new Date(targetSublet.end_date);

      if (end < targetStart || end > targetEnd) {
        nextErrors.proposedEndDate = `Ngày kết thúc phải từ ${format(targetStart, 'dd/MM/yyyy')} đến ${format(targetEnd, 'dd/MM/yyyy')}`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      await createSwapRequest.mutateAsync({
        requester_listing_id: selectedListingId,
        recipient_listing_id: targetSublet.id,
        message: formData.message,
        proposed_start_date: formData.proposedStartDate,
        proposed_end_date: formData.proposedEndDate,
      });

      toast.success('Đã gửi đề xuất', {
        description: 'Host kia sẽ nhận được đề xuất hoán đổi của bạn và phản hồi nếu phù hợp.',
      });

      setSelectedListingId('');
      setFormData({
        message: '',
        proposedStartDate: '',
        proposedEndDate: '',
      });
      onClose();
    } catch (error) {
      toast.error('Không thể gửi đề xuất', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    setSelectedListingId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Đề xuất hoán đổi
          </DialogTitle>
          <DialogDescription>
            Gửi đề xuất trao đổi thời gian ở với <strong>{targetSublet.owner?.full_name}</strong> khi hai bên có nhu cầu gần nhau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium">Tin bạn muốn trao đổi:</p>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                <img
                  src={targetSublet.images?.[0]?.image_url || '/placeholder-room.jpg'}
                  alt={targetSublet.room?.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{targetSublet.room?.title}</p>
                <p className="text-sm text-muted-foreground">{targetSublet.room?.district}</p>
                <p className="text-sm text-primary">{formatMonthlyPrice(targetSublet.sublet_price)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Chọn tin của bạn <span className="text-red-500">*</span>
            </Label>
            {isLoadingMySublets ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : !mySublets || mySublets.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bạn chưa có tin ở ngắn hạn nào đang hoạt động. Hãy tạo tin trước khi gửi đề xuất hoán đổi.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid max-h-48 gap-2 overflow-y-auto">
                {mySublets.filter((sublet) => sublet.status === 'active').map((sublet) => (
                  <div
                    key={sublet.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${selectedListingId === sublet.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
                    onClick={() => setSelectedListingId(sublet.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded bg-muted">
                        <img
                          src={sublet.images?.[0]?.image_url || '/placeholder-room.jpg'}
                          alt={sublet.room?.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{sublet.room?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sublet.start_date), 'dd/MM', { locale: vi })} - {format(new Date(sublet.end_date), 'dd/MM', { locale: vi })}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-primary">{formatMonthlyPrice(sublet.sublet_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.listing ? <p className="text-sm text-red-500">{errors.listing}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Từ ngày <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.proposedStartDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, proposedStartDate: event.target.value }))}
                className={errors.proposedStartDate ? 'border-red-500' : ''}
              />
              {errors.proposedStartDate ? <p className="text-sm text-red-500">{errors.proposedStartDate}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Đến ngày <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                min={formData.proposedStartDate}
                value={formData.proposedEndDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, proposedEndDate: event.target.value }))}
                className={errors.proposedEndDate ? 'border-red-500' : ''}
              />
              {errors.proposedEndDate ? <p className="text-sm text-red-500">{errors.proposedEndDate}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ghi chú thêm
            </Label>
            <Textarea
              id="message"
              placeholder="Nói rõ vì sao bạn muốn hoán đổi và điều gì cần thống nhất thêm giữa hai bên."
              value={formData.message}
              onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createSwapRequest.isPending || !selectedListingId || !formData.proposedStartDate || !formData.proposedEndDate || !mySublets?.length}
          >
            {createSwapRequest.isPending ? 'Đang gửi...' : 'Gửi đề xuất hoán đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
