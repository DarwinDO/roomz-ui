import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, MapPin, Phone, Upload, User } from "lucide-react";
import { useState } from "react";

interface VerifyLandlordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function VerifyLandlordModal({ isOpen, onClose, onComplete }: VerifyLandlordModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = () => {
    if (!isConfirmed) {
      return;
    }

    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác minh thông tin host</DialogTitle>
          <DialogDescription>
            Cung cấp thông tin người cho thuê để hoàn tất bước xác thực hồ sơ của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="host-name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Họ tên host
            </Label>
            <Input id="host-name" placeholder="Ví dụ: Trần Thanh Bình" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="host-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Số điện thoại liên hệ
            </Label>
            <Input id="host-phone" type="tel" placeholder="Ví dụ: 0901 234 567" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Địa chỉ bất động sản
            </Label>
            <Input
              id="property-address"
              placeholder="Ví dụ: 25 Nguyễn Văn Cừ, P.5, Quận 5"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Tài liệu chứng minh quyền cho thuê
            </Label>
            <div className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-primary">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Nhấn để tải lên tài liệu</p>
              <p className="mt-1 text-xs text-gray-500">
                Hợp đồng thuê, giấy ủy quyền hoặc tài liệu chứng minh quyền cho thuê
                (PDF, tối đa 5MB)
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-accuracy"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              />
              <div className="flex-1">
                <label htmlFor="confirm-accuracy" className="cursor-pointer text-sm">
                  Tôi cam kết thông tin cung cấp là chính xác và đã được sự đồng ý của host
                  để chia sẻ cho mục đích xác minh.
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs text-gray-700">
              <strong>Bảo mật thông tin:</strong> RommZ chỉ sử dụng dữ liệu này cho mục đích xác minh
              và sẽ bảo mật hoàn toàn thông tin host. Chúng tôi có thể liên hệ để xác nhận chi tiết khi cần.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-full h-12">
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isConfirmed}
              className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90"
            >
              Gửi xác minh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
