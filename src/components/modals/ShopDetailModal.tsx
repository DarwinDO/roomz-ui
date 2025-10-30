import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Gift,
  QrCode,
  Navigation,
  X,
  CheckCircle2,
} from "lucide-react";

interface ShopDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    name: string;
    category: string;
    discount: string;
    distance: string;
    image: string;
    icon: any;
    color: string;
  };
}

export function ShopDetailModal({ isOpen, onClose, shop }: ShopDetailModalProps) {
  const [showVoucher, setShowVoucher] = useState(false);

  const handleClose = () => {
    onClose();
    // Reset voucher state after modal closes
    setTimeout(() => setShowVoucher(false), 300);
  };

  const shopDetails = {
    description:
      shop.category === "Cà phê"
        ? "Quán cà phê ấm cúng với góc học bài yên tĩnh, Wifi mạnh và ổ cắm đầy đủ. Rất phù hợp cho sinh viên học nhóm hoặc gặp gỡ bạn bè."
        : shop.category === "Phòng gym"
        ? "Phòng gym hiện đại với đầy đủ máy móc, lớp nhóm và huấn luyện viên cá nhân. Có gói linh hoạt ưu đãi dành cho sinh viên."
        : shop.category === "Giặt ủi"
        ? "Dịch vụ giặt ủi và giặt khô chuyên nghiệp, giao nhận trong ngày. Nhiều gói theo tuần với giá ưu đãi cho sinh viên."
        : "Không gian ẩm thực phục vụ món ngon mỗi ngày, mở cửa tới khuya và có dịch vụ giao hàng.",
    hours: "Thứ 2 - Thứ 6: 07:00 - 22:00 | Thứ 7 - CN: 09:00 - 23:00",
    phone: "090 123 4567",
    email: "contact@roomz.vn",
    address: "25 Nguyễn Văn Bình, Đa Kao, Quận 1, TP.HCM",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{shop.name} - Shop Details</DialogTitle>
          <DialogDescription>
            View exclusive student discount details and get your voucher for {shop.name}
          </DialogDescription>
        </VisuallyHidden>
        {/* Hero Image */}
        <div className="relative h-64 overflow-hidden rounded-t-xl">
          <img
            src={shop.image}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-4 right-4">
            <Button
              onClick={handleClose}
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white shadow-md"
            >
              <X className="w-4 h-4 text-primary" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-white mb-2">{shop.name}</h1>
                <Badge className={`${shop.color} border-0`}>
                  <shop.icon className="w-3 h-3 mr-1" />
                  {shop.category}
                </Badge>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-white/90 text-gray-900"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {shop.distance}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Offer Banner */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ưu đãi dành riêng cho thành viên RoomZ</p>
                <h2 className="text-primary">{shop.discount}</h2>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-2">Về {shop.name}</h3>
            <p className="text-sm text-gray-600">{shopDetails.description}</p>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3>Liên hệ & địa chỉ</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Giờ mở cửa</p>
                  <p className="text-xs text-gray-600">{shopDetails.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Điện thoại</p>
                  <p className="text-xs text-gray-600">{shopDetails.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-gray-600">{shopDetails.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Địa chỉ</p>
                  <p className="text-xs text-gray-600">{shopDetails.address}</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Navigation className="w-4 h-4 mr-1" />
                  Chỉ đường
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Voucher Section */}
          <div className="space-y-4">
            <h3>Nhận voucher ưu đãi</h3>
            {!showVoucher ? (
              <Button
                onClick={() => setShowVoucher(true)}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Tạo mã voucher
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* QR Code */}
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-300">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                  <p className="text-xs text-center text-gray-600">
                    Quét mã này tại {shop.name}
                  </p>
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
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12"
              onClick={handleClose}
            >
              Đóng
            </Button>
            <Button className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90">
              <Navigation className="w-4 h-4 mr-2" />
              Chỉ đường
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
