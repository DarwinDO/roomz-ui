import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, User, MapPin, Phone } from "lucide-react";

interface VerifyLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function VerifyLandlordModal({ isOpen, onClose, onComplete }: VerifyLandlordModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = () => {
    if (isConfirmed) {
      onComplete();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác minh thông tin chủ nhà</DialogTitle>
          <DialogDescription>
            Cung cấp thông tin người cho thuê để hoàn tất bước xác thực hồ sơ của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="landlord-name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Họ tên chủ nhà
            </Label>
            <Input
              id="landlord-name"
              placeholder="Ví dụ: Trần Thanh Bình"
              className="rounded-xl"
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <Label htmlFor="landlord-phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Số điện thoại liên hệ
            </Label>
            <Input
              id="landlord-phone"
              type="tel"
              placeholder="Ví dụ: 0901 234 567"
              className="rounded-xl"
            />
          </div>

          {/* Property Address */}
          <div className="space-y-2">
            <Label htmlFor="property-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ bất động sản
            </Label>
            <Input
              id="property-address"
              placeholder="Ví dụ: 25 Nguyễn Văn Cừ, P.5, Quận 5"
              className="rounded-xl"
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Tài liệu chứng minh sở hữu
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm mb-1">Nhấn để tải lên tài liệu</p>
              <p className="text-xs text-gray-500">
                Hợp đồng thuê, sổ hồng hoặc giấy ủy quyền (định dạng PDF, tối đa 5MB)
              </p>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-accuracy"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              />
              <div className="flex-1">
                <label
                  htmlFor="confirm-accuracy"
                  className="text-sm cursor-pointer"
                >
                  Tôi cam kết thông tin cung cấp là chính xác và đã được sự đồng ý của chủ nhà
                  để chia sẻ cho mục đích xác minh.
                </label>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              <strong>Bảo mật thông tin:</strong> RoomZ chỉ sử dụng dữ liệu này cho mục đích xác minh
              và sẽ bảo mật hoàn toàn thông tin chủ nhà. Chúng tôi có thể liên hệ để xác nhận chi tiết khi cần.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isConfirmed}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Gửi xác minh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
