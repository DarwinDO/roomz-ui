/**
 * SwapRequestDialog
 * Form dialog for requesting a room swap
 * Following UX Psychology: Progressive disclosure, clear feedback
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowRightLeft, Calendar, MessageSquare, X, AlertCircle } from 'lucide-react';
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
import type { SubletListing } from '@roomz/shared/types/swap';

interface SwapRequestDialogProps {
    targetSublet: SubletListing | null;
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

    if (!targetSublet) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!selectedListingId) {
            newErrors.listing = 'Vui lòng chọn phòng để hoán đổi';
        }

        if (!formData.proposedStartDate) {
            newErrors.proposedStartDate = 'Vui lòng chọn ngày bắt đầu';
        }

        if (!formData.proposedEndDate) {
            newErrors.proposedEndDate = 'Vui lòng chọn ngày kết thúc';
        }

        if (formData.proposedStartDate && formData.proposedEndDate) {
            const start = new Date(formData.proposedStartDate);
            const end = new Date(formData.proposedEndDate);

            if (end <= start) {
                newErrors.proposedEndDate = 'Ngày kết thúc phải sau ngày bắt đầu';
            }

            const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
            if (end.getTime() - start.getTime() > maxDuration) {
                newErrors.proposedEndDate = 'Thờ gian hoán đổi tối đa 30 ngày';
            }
        }

        // Validate dates are within target sublet availability
        if (formData.proposedStartDate && targetSublet?.start_date && targetSublet?.end_date) {
            const start = new Date(formData.proposedStartDate);
            const subletStart = new Date(targetSublet.start_date);
            const subletEnd = new Date(targetSublet.end_date);

            if (start < subletStart || start > subletEnd) {
                newErrors.proposedStartDate = `Ngày bắt đầu phải từ ${format(subletStart, 'dd/MM/yyyy')} đến ${format(subletEnd, 'dd/MM/yyyy')}`;
            }
        }

        if (formData.proposedEndDate && targetSublet?.start_date && targetSublet?.end_date) {
            const end = new Date(formData.proposedEndDate);
            const subletStart = new Date(targetSublet.start_date);
            const subletEnd = new Date(targetSublet.end_date);

            if (end < subletStart || end > subletEnd) {
                newErrors.proposedEndDate = `Ngày kết thúc phải từ ${format(subletStart, 'dd/MM/yyyy')} đến ${format(subletEnd, 'dd/MM/yyyy')}`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createSwapRequest.mutateAsync({
                requester_listing_id: selectedListingId,
                recipient_listing_id: targetSublet.id,
                message: formData.message,
                proposed_start_date: formData.proposedStartDate,
                proposed_end_date: formData.proposedEndDate,
            });

            toast.success('Thành công!', {
                description: 'Yêu cầu hoán đổi đã được gửi. Bạn sẽ nhận được thông báo khi có phản hồi.',
            });

            // Reset form
            setSelectedListingId('');
            setFormData({
                message: '',
                proposedStartDate: '',
                proposedEndDate: '',
            });
            onClose();
        } catch (error) {
            toast.error('Lỗi', {
                description: error instanceof Error ? error.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.',
            });
        }
    };

    const handleClose = () => {
        setErrors({});
        setSelectedListingId('');
        onClose();
    };

    const selectedListing = mySublets?.find((s) => s.id === selectedListingId);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5" />
                        Yêu cầu hoán đổi phòng
                    </DialogTitle>
                    <DialogDescription>
                        Đề xuất hoán đổi phòng với <strong>{targetSublet.owner?.full_name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Target Listing Info */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">Phòng bạn muốn hoán đổi:</p>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                                <img
                                    src={targetSublet.images?.[0]?.image_url || '/placeholder-room.jpg'}
                                    alt={targetSublet.room?.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="font-medium">{targetSublet.room?.title}</p>
                                <p className="text-sm text-muted-foreground">{targetSublet.room?.district}</p>
                                <p className="text-sm text-primary">{formatMonthlyPrice(targetSublet.sublet_price)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Select My Listing */}
                    <div className="space-y-2">
                        <Label>
                            Chọn phòng của bạn <span className="text-red-500">*</span>
                        </Label>
                        {isLoadingMySublets ? (
                            <p className="text-sm text-muted-foreground">Đang tải...</p>
                        ) : !mySublets || mySublets.length === 0 ? (
                            <Alert variant="destructive">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>
                                    Bạn chưa có tin đăng nào. Vui lòng tạo tin đăng trước khi gửi yêu cầu hoán đổi.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-2 max-h-48 overflow-y-auto">
                                {mySublets.map((sublet) => (
                                    <div
                                        key={sublet.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedListingId === sublet.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted hover:border-primary/30'
                                            }`}
                                        onClick={() => setSelectedListingId(sublet.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                                                <img
                                                    src={sublet.images?.[0]?.image_url || '/placeholder-room.jpg'}
                                                    alt={sublet.room?.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{sublet.room?.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(sublet.start_date), 'dd/MM', { locale: vi })} -{' '}
                                                    {format(new Date(sublet.end_date), 'dd/MM', { locale: vi })}
                                                </p>
                                            </div>
                                            <div className="text-sm font-medium text-primary">
                                                {formatMonthlyPrice(sublet.sublet_price)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {errors.listing && <p className="text-sm text-red-500">{errors.listing}</p>}
                    </div>

                    {/* Proposed Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Từ ngày <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.proposedStartDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, proposedStartDate: e.target.value }))
                                }
                                className={errors.proposedStartDate ? 'border-red-500' : ''}
                            />
                            {errors.proposedStartDate && (
                                <p className="text-sm text-red-500">{errors.proposedStartDate}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Đến ngày <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                min={formData.proposedStartDate}
                                value={formData.proposedEndDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, proposedEndDate: e.target.value }))
                                }
                                className={errors.proposedEndDate ? 'border-red-500' : ''}
                            />
                            {errors.proposedEndDate && (
                                <p className="text-sm text-red-500">{errors.proposedEndDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message" className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Tin nhắn
                        </Label>
                        <Textarea
                            id="message"
                            placeholder="Giải thích lý do bạn muốn hoán đổi, đề xuất thêm..."
                            value={formData.message}
                            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                            rows={3}
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
                        disabled={
                            createSwapRequest.isPending ||
                            !selectedListingId ||
                            !formData.proposedStartDate ||
                            !formData.proposedEndDate ||
                            !mySublets?.length
                        }
                    >
                        {createSwapRequest.isPending ? 'Đang gửi...' : 'Gửi yêu cầu hoán đổi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
