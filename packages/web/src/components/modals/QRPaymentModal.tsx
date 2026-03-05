import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Copy, Check, AlertCircle, RefreshCw, Timer, AlertTriangle } from 'lucide-react';
import { subscribeToPaymentStatus, createSePayCheckoutSession, type BillingCycle, type SubscriptionPlan } from '@/services/payments';
import { useAuth } from '@/contexts';
import { toast } from 'sonner';

interface QRPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderCode: string;
    qrCodeUrl: string;
    amount: number;
    billingCycle: BillingCycle;
    onPaymentSuccess: () => void;
}

export function QRPaymentModal({
    isOpen,
    onClose,
    orderCode,
    qrCodeUrl,
    amount,
    billingCycle,
    onPaymentSuccess,
}: QRPaymentModalProps) {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    const [isExpired, setIsExpired] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Clear checkout session
    const clearCheckoutSession = useCallback(() => {
        setTimeLeft(0);
        setIsExpired(true);
        setIsLoading(false);
        setCopied(false);
    }, []);

    // Handle payment success
    const handlePaymentSuccess = useCallback(() => {
        onPaymentSuccess();
    }, [onPaymentSuccess]);

    // Subscribe to payment status changes
    useEffect(() => {
        if (!isOpen || !orderCode) return;

        const { unsubscribe } = subscribeToPaymentStatus(orderCode, handlePaymentSuccess);

        return () => {
            unsubscribe();
        };
    }, [isOpen, orderCode, handlePaymentSuccess]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || isExpired) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, isExpired]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(15 * 60);
            setIsExpired(false);
            setCopied(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Format amount as VND
    const formatAmount = (value: number): string => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value);
    };

    // Copy order code to clipboard
    const copyOrderCode = async () => {
        try {
            await navigator.clipboard.writeText(orderCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Handle close - show confirmation if not expired
    const handleClose = () => {
        if (!isExpired) {
            setShowCancelConfirm(true);
        } else {
            onClose();
        }
    };

    // Handle cancel confirmation
    const handleCancelConfirm = () => {
        clearCheckoutSession();
        setShowCancelConfirm(false);
        onClose();
    };

    // Regenerate QR (placeholder)
    const handleRegenerate = () => {
        setIsExpired(false);
        setTimeLeft(15 * 60);
        // In production, this would call createSePayCheckoutSession again
        if (import.meta.env.DEV) {
            console.log('[QRModal] Regenerate QR code');
        }
    };

    const isLowTime = timeLeft < 2 * 60; // Less than 2 minutes

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-sm mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center">Thanh toán RommZ+</DialogTitle>
                        <DialogDescription className="text-center">
                            Quét mã QR để thanh toán
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Amount Display */}
                        <div className="text-center py-2">
                            <div className="text-3xl font-bold text-amber-600">
                                {formatAmount(amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {billingCycle === 'monthly' ? '/tháng' : '/quý'}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center">
                            {isExpired ? (
                                <Card className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50">
                                    <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                                    <p className="text-red-600 font-medium">Mã QR đã hết hạn</p>
                                    <p className="text-sm text-gray-500 mt-1">Vui lòng tạo mã mới</p>
                                </Card>
                            ) : (
                                <Card className="p-4 relative">
                                    <img
                                        src={qrCodeUrl}
                                        alt="Payment QR Code"
                                        className="w-48 h-48 object-contain"
                                        onLoad={() => setIsLoading(false)}
                                    />
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>

                        {/* Order Code */}
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Nội dung chuyển khoản</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={orderCode}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyOrderCode}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sao chép nội dung này và dán vào phần "Nội dung" khi chuyển khoản
                            </p>
                        </div>

                        {/* Timer */}
                        <div className={`flex items-center justify-center gap-2 py-2 rounded-lg ${isLowTime ? 'bg-red-50' : 'bg-amber-50'
                            }`}>
                            <Timer className={`w-5 h-5 ${isLowTime ? 'text-red-500' : 'text-amber-600'}`} />
                            <span className={`font-mono text-lg font-semibold ${isLowTime ? 'text-red-600' : 'text-amber-700'
                                }`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {/* Status */}
                        <div className="text-center">
                            {isExpired ? (
                                <p className="text-sm text-red-600">Mã QR đã hết hiệu lực</p>
                            ) : (
                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang chờ thanh toán...
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            {isExpired ? (
                                <Button
                                    onClick={handleRegenerate}
                                    className="w-full bg-amber-600 hover:bg-amber-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Tạo mã mới
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="w-full"
                                >
                                    Hủy
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent className="bg-white rounded-lg">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                            <AlertDialogTitle>Hủy thanh toán?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Mã QR hiện tại sẽ hết hiệu lực. Bạn cần tạo mã mới nếu muốn thanh toán sau.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setShowCancelConfirm(false)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Tiếp tục thanh toán
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelConfirm}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Hủy thanh toán
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
