import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Mail, MapPin, Gift } from "lucide-react";

interface PartnerSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function PartnerSignUpModal({ isOpen, onClose, onSubmit }: PartnerSignUpModalProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = () => {
    if (agreedToTerms) {
      onSubmit();
      onClose();
      // Reset state
      setTimeout(() => {
        setAgreedToTerms(false);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký trở thành đối tác RoomZ</DialogTitle>
          <DialogDescription>
            Tham gia Local Passport để tiếp cận hàng nghìn sinh viên khu vực bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="business-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Tên doanh nghiệp
            </Label>
            <Input
              id="business-name"
              placeholder="Ví dụ: Café 89°"
              className="rounded-xl"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="business-type">Loại hình kinh doanh</Label>
            <Select>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cafe">Cà phê / Đồ uống</SelectItem>
                <SelectItem value="restaurant">Nhà hàng / Ăn uống</SelectItem>
                <SelectItem value="gym">Gym / Fitness</SelectItem>
                <SelectItem value="laundry">Giặt ủi</SelectItem>
                <SelectItem value="retail">Bán lẻ / Mua sắm</SelectItem>
                <SelectItem value="salon">Salon / Làm đẹp</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Person */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-person" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Người liên hệ
              </Label>
              <Input
                id="contact-person"
                placeholder="Họ và tên"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email liên hệ
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="business@example.com"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="business-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ kinh doanh
            </Label>
            <Input
              id="business-address"
              placeholder="Ví dụ: 25 Nguyễn Văn Bình, Quận 1"
              className="rounded-xl"
            />
          </div>

          {/* Offer Details */}
          <div className="space-y-2">
            <Label htmlFor="offer-details" className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-secondary" />
              Thông tin ưu đãi cung cấp
            </Label>
            <Textarea
              id="offer-details"
              placeholder="Ví dụ: Giảm 20% cho thành viên RoomZ, Tặng cà phê khi gọi món..."
              className="rounded-xl min-h-24"
            />
          </div>

          {/* Benefits Banner */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <h3 className="mb-3 text-sm">Quyền lợi đối tác:</h3>
            <ul className="space-y-2 text-xs text-gray-700">
              <li>✓ Tiếp cận hơn 10.000 sinh viên đang hoạt động tại khu vực</li>
              <li>✓ Được ưu tiên hiển thị trên RoomZ Local Passport</li>
              <li>✓ Hỗ trợ truyền thông miễn phí trên các kênh RoomZ</li>
              <li>✓ Bảng thống kê lượt sử dụng ưu đãi theo thời gian thực</li>
              <li>✓ Không thu phí ban đầu – chỉ trả khi có sinh viên sử dụng</li>
            </ul>
          </div>

          {/* Terms Agreement */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <div className="flex-1">
                <label
                  htmlFor="agree-terms"
                  className="text-sm cursor-pointer"
                >
                  Tôi đồng ý với{" "}
                  <span className="text-primary underline">Điều khoản đối tác RoomZ</span>{" "}
                  và hiểu rằng thông tin doanh nghiệp sẽ hiển thị cho thành viên RoomZ.
                </label>
              </div>
            </div>
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
              disabled={!agreedToTerms}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Gửi đăng ký
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
