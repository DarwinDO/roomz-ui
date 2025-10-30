import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface ConfirmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sublet: {
    title: string;
    location: string;
    price: number;
    distance: string;
  };
}

export function ConfirmBookingModal({ isOpen, onClose, sublet }: ConfirmBookingModalProps) {
  const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

  const handleConfirm = () => {
    toast.success("Đã gửi yêu cầu đặt phòng tới chủ nhà!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Kiểm tra lại thông tin đặt phòng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Details */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-4 space-y-3">
            <h3 className="text-base">{sublet.title}</h3>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{sublet.location}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{sublet.distance}</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-primary">{formatCurrency(sublet.price)}</span>
              <span className="text-sm text-gray-600">/tháng</span>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <strong>Lưu ý:</strong> Yêu cầu đặt phòng của bạn sẽ được gửi tới chủ nhà để xác nhận.
              Bạn sẽ nhận thông báo ngay khi họ phản hồi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full"
            >
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
