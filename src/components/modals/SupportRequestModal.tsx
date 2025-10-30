import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, HelpCircle } from "lucide-react";

interface SupportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function SupportRequestModal({ isOpen, onClose, onSubmit }: SupportRequestModalProps) {
  const handleSubmit = () => {
    onSubmit();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yêu cầu hỗ trợ</DialogTitle>
          <DialogDescription>
            Đội ngũ RoomZ sẽ phản hồi cho bạn trong vòng 24 giờ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="support-name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Họ và tên
            </Label>
            <Input
              id="support-name"
              placeholder="Ví dụ: Nguyễn Minh Anh"
              className="rounded-xl"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="support-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Email liên hệ
            </Label>
            <Input
              id="support-email"
              type="email"
              placeholder="Ví dụ: minh.anh@roomz.vn"
              className="rounded-xl"
            />
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issue-type" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Loại vấn đề
            </Label>
            <Select>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn loại yêu cầu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moving">Dịch vụ chuyển phòng</SelectItem>
                <SelectItem value="cleaning">Dịch vụ vệ sinh</SelectItem>
                <SelectItem value="setup">Lắp đặt & sắp xếp</SelectItem>
                <SelectItem value="booking">Sự cố đặt dịch vụ</SelectItem>
                <SelectItem value="payment">Thanh toán</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="support-message">Nội dung hỗ trợ</Label>
            <Textarea
              id="support-message"
              placeholder="Mô tả vấn đề hoặc nhu cầu của bạn..."
              className="rounded-xl min-h-32"
            />
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              💡 Trường hợp khẩn cấp, vui lòng gọi hotline{" "}
              <span className="text-primary font-medium">1900 6868 79</span>
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
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
