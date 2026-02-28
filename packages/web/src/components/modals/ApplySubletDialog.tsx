/**
 * ApplySubletDialog
 * Form dialog for applying to rent a sublet
 * Following UX Psychology: Hick's Law (limit choices), clear feedback
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, MessageSquare, FileText, X } from 'lucide-react';
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

    if (!sublet) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.preferredMoveInDate) {
            newErrors.preferredMoveInDate = 'Vui lòng chọn ngày dọn vào';
        } else {
            const moveIn = new Date(formData.preferredMoveInDate);
            const subletStart = new Date(sublet.start_date);
            const subletEnd = new Date(sublet.end_date);

            if (moveIn < subletStart || moveIn > subletEnd) {
                newErrors.preferredMoveInDate = `Ngày dọn vào phải từ ${format(subletStart, 'dd/MM/yyyy')} đến ${format(subletEnd, 'dd/MM/yyyy')}`;
            }
        }

        if (formData.preferredMoveOutDate) {
            const moveOut = new Date(formData.preferredMoveOutDate);
            const moveIn = new Date(formData.preferredMoveInDate);
            const subletEnd = new Date(sublet.end_date);

            if (moveOut > subletEnd) {
                newErrors.preferredMoveOutDate = `Ngày dọn ra không được sau ${format(subletEnd, 'dd/MM/yyyy')}`;
            }
            if (moveOut <= moveIn) {
                newErrors.preferredMoveOutDate = 'Ngày dọn ra phải sau ngày dọn vào';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createApplication.mutateAsync({
                sublet_listing_id: sublet.id,
                message: formData.message,
                preferred_move_in_date: formData.preferredMoveInDate,
            });

            toast.success('Thành công!', {
                description: 'Đơn đăng ký của bạn đã được gửi. Chủ phòng sẽ phản hồi sớm.',
            });

            // Reset form
            setFormData({
                message: '',
                preferredMoveInDate: '',
                preferredMoveOutDate: '',
            });
            onClose();
        } catch (error) {
            toast.error('Lỗi', {
                description: error instanceof Error ? error.message : 'Không thể gửi đơn đăng ký. Vui lòng thử lại.',
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
                        <FileText className="w-5 h-5" />
                        Đăng ký thuê phòng
                    </DialogTitle>
                    <DialogDescription>
                        Gửi đơn đăng ký thuê phòng <strong>{sublet.room?.title}</strong> từ{' '}
                        {format(new Date(sublet.start_date), 'dd/MM/yyyy', { locale: vi })} đến{' '}
                        {format(new Date(sublet.end_date), 'dd/MM/yyyy', { locale: vi })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Move-in Date */}
                    <div className="space-y-2">
                        <Label htmlFor="moveInDate" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Ngày dọn vào <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="moveInDate"
                            type="date"
                            min={sublet.start_date}
                            max={sublet.end_date}
                            value={formData.preferredMoveInDate}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, preferredMoveInDate: e.target.value }))
                            }
                            className={errors.preferredMoveInDate ? 'border-red-500' : ''}
                        />
                        {errors.preferredMoveInDate && (
                            <p className="text-sm text-red-500">{errors.preferredMoveInDate}</p>
                        )}
                    </div>

                    {/* Move-out Date */}
                    <div className="space-y-2">
                        <Label htmlFor="moveOutDate" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Ngày dọn ra (tùy chọn)
                        </Label>
                        <Input
                            id="moveOutDate"
                            type="date"
                            min={formData.preferredMoveInDate || sublet.start_date}
                            max={sublet.end_date}
                            value={formData.preferredMoveOutDate}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, preferredMoveOutDate: e.target.value }))
                            }
                            className={errors.preferredMoveOutDate ? 'border-red-500' : ''}
                        />
                        {errors.preferredMoveOutDate && (
                            <p className="text-sm text-red-500">{errors.preferredMoveOutDate}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Để trống nếu bạn muốn thuê đến hết hạn ({format(new Date(sublet.end_date), 'dd/MM/yyyy', { locale: vi })})
                        </p>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Tin nhắn cho chủ phòng
                        </Label>
                        <Textarea
                            id="message"
                            placeholder="Giới thiệu bản thân, lý do bạn muốn thuê phòng..."
                            value={formData.message}
                            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createApplication.isPending || !formData.preferredMoveInDate}
                    >
                        {createApplication.isPending ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
