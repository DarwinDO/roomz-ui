/**
 * ApplySubletDialog
 * Form dialog for applying to stay in a short-stay listing.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, FileText, MessageSquare, X } from 'lucide-react';
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
import { useCreateApplication } from '@/hooks/useSublets';
import { toast } from 'sonner';
import type { SubletListing } from '@roomz/shared/types/swap';

interface ApplySubletDialogProps {
  sublet: SubletListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplySubletDialog({ sublet, isOpen, onClose }: ApplySubletDialogProps) {
  const createApplication = useCreateApplication();
  const [formData, setFormData] = useState({
    message: '',
    preferredMoveInDate: '',
    preferredMoveOutDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!sublet) {
    return null;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.preferredMoveInDate) {
      nextErrors.preferredMoveInDate = 'Vui lòng chọn ngày bắt đầu ở.';
    } else {
      const moveIn = new Date(formData.preferredMoveInDate);
      const subletStart = new Date(sublet.start_date);
      const subletEnd = new Date(sublet.end_date);

      if (moveIn < subletStart || moveIn > subletEnd) {
        nextErrors.preferredMoveInDate = `Ngày bắt đầu phải nằm trong khoảng ${format(subletStart, 'dd/MM/yyyy')} - ${format(subletEnd, 'dd/MM/yyyy')}.`;
      }
    }

    if (formData.preferredMoveOutDate) {
      const moveOut = new Date(formData.preferredMoveOutDate);
      const moveIn = new Date(formData.preferredMoveInDate);
      const subletEnd = new Date(sublet.end_date);

      if (moveOut > subletEnd) {
        nextErrors.preferredMoveOutDate = `Ngày kết thúc không được sau ${format(subletEnd, 'dd/MM/yyyy')}.`;
      }

      if (moveOut <= moveIn) {
        nextErrors.preferredMoveOutDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
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
      await createApplication.mutateAsync({
        sublet_listing_id: sublet.id,
        message: formData.message,
        preferred_move_in_date: formData.preferredMoveInDate,
      });

      toast.success('Đã gửi đơn quan tâm', {
        description: 'Host sẽ xem và phản hồi nếu thời gian ở của bạn phù hợp.',
      });

      setFormData({
        message: '',
        preferredMoveInDate: '',
        preferredMoveOutDate: '',
      });
      onClose();
    } catch (error) {
      toast.error('Không thể gửi đơn', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gửi đơn ở ngắn hạn
          </DialogTitle>
          <DialogDescription>
            Gửi yêu cầu ở tại <strong>{sublet.room?.title}</strong> từ{' '}
            {format(new Date(sublet.start_date), 'dd/MM/yyyy', { locale: vi })} đến{' '}
            {format(new Date(sublet.end_date), 'dd/MM/yyyy', { locale: vi })}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="moveInDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ngày bắt đầu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="moveInDate"
              type="date"
              min={sublet.start_date}
              max={sublet.end_date}
              value={formData.preferredMoveInDate}
              onChange={(event) => setFormData((prev) => ({ ...prev, preferredMoveInDate: event.target.value }))}
              className={errors.preferredMoveInDate ? 'border-red-500' : ''}
            />
            {errors.preferredMoveInDate ? <p className="text-sm text-red-500">{errors.preferredMoveInDate}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="moveOutDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ngày kết thúc dự kiến
            </Label>
            <Input
              id="moveOutDate"
              type="date"
              min={formData.preferredMoveInDate || sublet.start_date}
              max={sublet.end_date}
              value={formData.preferredMoveOutDate}
              onChange={(event) => setFormData((prev) => ({ ...prev, preferredMoveOutDate: event.target.value }))}
              className={errors.preferredMoveOutDate ? 'border-red-500' : ''}
            />
            {errors.preferredMoveOutDate ? <p className="text-sm text-red-500">{errors.preferredMoveOutDate}</p> : null}
            <p className="text-xs text-muted-foreground">
              Có thể để trống nếu bạn muốn ở đến hết hạn vào {format(new Date(sublet.end_date), 'dd/MM/yyyy', { locale: vi })}.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ghi chú cho host
            </Label>
            <Textarea
              id="message"
              placeholder="Giới thiệu ngắn về bạn, thời gian ở mong muốn và điều gì cần trao đổi thêm."
              value={formData.message}
              onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={createApplication.isPending || !formData.preferredMoveInDate}>
            {createApplication.isPending ? 'Đang gửi...' : 'Gửi đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
