import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, MapPin, CheckCircle2 } from "lucide-react";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    name: string;
    category: string;
    discount: string;
    distance: string;
  };
}

export function VoucherModal({ isOpen, onClose, partner }: VoucherModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Voucher ưu đãi RommZ</DialogTitle>
          <DialogDescription>
            Quét mã QR này khi thanh toán để áp dụng ưu đãi thành viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Partner Info */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎁</span>
            </div>
            <h2 className="mb-1">{partner.name}</h2>
            <Badge className="bg-primary/10 text-primary border-0">
              {partner.category}
            </Badge>
          </div>

          {/* Discount Badge */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 text-center border-2 border-primary/20">
            <p className="text-sm text-gray-600 mb-2">Ưu đãi dành riêng cho bạn</p>
            <h1 className="text-primary mb-1">{partner.discount}</h1>
            <p className="text-xs text-gray-600">Áp dụng cho thành viên RommZ</p>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-300">
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-24 h-24 text-gray-400" />
            </div>
            <p className="text-xs text-center text-gray-600">
              Quét mã này tại {partner.name}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{partner.distance}</span>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-4 space-y-2">
            <p className="text-sm mb-2">Cách sử dụng:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Đưa mã QR cho nhân viên trước khi thanh toán</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Xuất trình thẻ sinh viên khi được yêu cầu</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Ưu đãi sẽ được áp dụng trực tiếp vào hóa đơn</span>
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-700">
              ⏰ Hiệu lực đến: 31/12/2025
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 rounded-full h-12"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
