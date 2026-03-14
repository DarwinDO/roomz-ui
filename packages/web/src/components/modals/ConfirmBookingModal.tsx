import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@roomz/shared/utils/format";

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
  const handleConfirm = () => {
    toast.success("Đã gửi yêu cầu đặt phòng tới host.");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Kiểm tra lại thông tin đặt phòng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
            <h3 className="text-base font-medium">{sublet.title}</h3>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{sublet.location}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{sublet.distance}</span>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-200 pt-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">{formatCurrency(sublet.price)}</span>
              <span className="text-sm text-gray-600">/tháng</span>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Lưu ý:</strong> Yêu cầu đặt phòng của bạn sẽ được gửi tới host để xác nhận.
              Bạn sẽ nhận thông báo ngay khi host phản hồi.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">
              Hủy
            </Button>
            <Button onClick={handleConfirm} className="flex-1 rounded-full bg-primary hover:bg-primary/90">
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
