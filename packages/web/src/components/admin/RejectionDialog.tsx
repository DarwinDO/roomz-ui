/**
 * RejectionDialog Component
 * Reusable dialog for admin to reject rooms/users with reason
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Loader2 } from 'lucide-react';

export type RejectionType = 'room' | 'user';

interface RejectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
    type: RejectionType;
    itemName?: string;
}

const PRESET_REASONS: Record<RejectionType, string[]> = {
    room: [
        'Ảnh phòng không rõ ràng hoặc không đúng thực tế',
        'Thông tin giá cả không hợp lý',
        'Địa chỉ không chính xác hoặc không tồn tại',
        'Mô tả phòng chứa nội dung không phù hợp',
        'Vi phạm chính sách nền tảng',
    ],
    user: [
        'Thông tin cá nhân không chính xác',
        'Ảnh CMND/CCCD không rõ ràng hoặc không hợp lệ',
        'Thông tin liên hệ không xác thực được',
        'Nghi ngờ tài khoản giả mạo',
        'Cần bổ sung thêm thông tin xác minh',
    ],
};

const DIALOG_TITLES: Record<RejectionType, string> = {
    room: 'Từ chối phòng',
    user: 'Từ chối xác thực tài khoản',
};

export function RejectionDialog({
    open,
    onOpenChange,
    onConfirm,
    type,
    itemName,
}: RejectionDialogProps) {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);

    const finalReason = customReason.trim() || selectedReason;
    const canSubmit = finalReason.length > 0;

    const handleClose = () => {
        if (loading) return;
        setSelectedReason('');
        setCustomReason('');
        onOpenChange(false);
    };

    const handleConfirm = async () => {
        if (!canSubmit || loading) return;

        setLoading(true);
        try {
            await onConfirm(finalReason);
            handleClose();
        } catch (error) {
            console.error('[RejectionDialog] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        {DIALOG_TITLES[type]}
                    </DialogTitle>
                    <DialogDescription>
                        {itemName
                            ? `Bạn đang từ chối "${itemName}". Vui lòng chọn hoặc nhập lý do.`
                            : 'Vui lòng chọn hoặc nhập lý do từ chối.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Preset reasons */}
                    <div className="space-y-2">
                        <Label>Lý do thường gặp:</Label>
                        <RadioGroup
                            value={selectedReason}
                            onValueChange={(value) => {
                                setSelectedReason(value);
                                setCustomReason('');
                            }}
                            className="space-y-2"
                        >
                            {PRESET_REASONS[type].map((reason, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem value={reason} id={`reason-${index}`} />
                                    <Label
                                        htmlFor={`reason-${index}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {reason}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Custom reason */}
                    <div className="space-y-2">
                        <Label htmlFor="custom-reason">Hoặc nhập lý do khác:</Label>
                        <Textarea
                            id="custom-reason"
                            placeholder="Nhập lý do từ chối cụ thể..."
                            value={customReason}
                            onChange={(e) => {
                                setCustomReason(e.target.value);
                                if (e.target.value) setSelectedReason('');
                            }}
                            className="min-h-[80px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!canSubmit || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận từ chối
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default RejectionDialog;
