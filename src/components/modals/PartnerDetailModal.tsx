import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Mail, Clock, CheckCircle2, Percent, ExternalLink } from "lucide-react";

interface PartnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    name: string;
    rating: number;
    reviews: number;
    specialization: string;
    discount: string;
  };
}

export function PartnerDetailModal({ isOpen, onClose, partner }: PartnerDetailModalProps) {
  const handleBookService = () => {
    // TODO: Implement booking flow
    onClose();
  };

  const handleContactPartner = () => {
    // TODO: Implement contact flow
  };

  // Mock additional data - trong thực tế sẽ fetch từ API
  const partnerDetails = {
    description:
      "Đối tác uy tín của RoomZ với hơn 5 năm kinh nghiệm trong lĩnh vực dịch vụ hỗ trợ sinh viên. Đội ngũ chuyên nghiệp, tận tâm, cam kết mang đến trải nghiệm tốt nhất cho khách hàng.",
    address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
    phone: "1900 6868",
    email: "support@partner.com",
    workingHours: "Thứ 2 - Chủ nhật: 7:00 - 22:00",
    services: [
      "Chuyển nhà trong nội thành",
      "Chuyển nhà liên tỉnh",
      "Đóng gói đồ đạc chuyên nghiệp",
      "Vệ sinh sau xây dựng",
      "Vệ sinh định kỳ",
      "Lắp đặt nội thất",
    ],
    features: [
      "Đội ngũ được đào tạo chuyên nghiệp",
      "Bảo hiểm đầy đủ cho hàng hóa",
      "Thanh toán linh hoạt",
      "Hỗ trợ khẩn cấp 24/7",
      "Giá ưu đãi cho sinh viên",
    ],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{partner.name}</span>
            <Badge className="bg-primary text-white">
              <Star className="w-3 h-3 mr-1 fill-white" />
              {partner.rating}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {partner.specialization} • {partner.reviews} đánh giá
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Discount Badge */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Percent className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">Ưu đãi dành cho sinh viên</p>
                <p className="text-sm text-amber-700">{partner.discount}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Giới thiệu</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {partnerDetails.description}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Thông tin liên hệ</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-gray-600">{partnerDetails.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href={`tel:${partnerDetails.phone}`} className="text-primary hover:underline">
                  {partnerDetails.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${partnerDetails.email}`} className="text-primary hover:underline">
                  {partnerDetails.email}
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-gray-600">{partnerDetails.workingHours}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Dịch vụ cung cấp</h4>
            <div className="grid grid-cols-2 gap-2">
              {partnerDetails.services.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm bg-gray-50 rounded-xl p-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span className="text-gray-700">{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Điểm nổi bật</h4>
            <div className="space-y-2">
              {partnerDetails.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                🏆
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Đối tác được xác thực</p>
                <p className="text-xs text-blue-700">
                  Đã được RoomZ kiểm tra và phê duyệt theo tiêu chuẩn chất lượng cao
                </p>
              </div>
            </div>
          </div>

          {/* Customer Reviews Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Đánh giá từ khách hàng</h4>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{partner.rating}</span>
                <span className="text-xs text-gray-500">({partner.reviews} đánh giá)</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-medium text-primary">98%</p>
                <p className="text-xs text-gray-600">Hài lòng</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-medium text-primary">95%</p>
                <p className="text-xs text-gray-600">Đúng hẹn</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-lg font-medium text-primary">100%</p>
                <p className="text-xs text-gray-600">Chuyên nghiệp</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleContactPartner}
              variant="outline"
              className="flex-1 rounded-full h-12 border-2 border-primary text-primary hover:bg-primary/10"
            >
              <Phone className="w-5 h-5 mr-2" />
              Liên hệ
            </Button>
            <Button
              onClick={handleBookService}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-white"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Đặt dịch vụ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

