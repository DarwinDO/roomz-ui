import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, Mail, Clock, Percent, ExternalLink, ShieldCheck } from "lucide-react";
import type { Partner } from "@/services/partners";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PartnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
}

export function PartnerDetailModal({ isOpen, onClose, partner }: PartnerDetailModalProps) {
  const navigate = useNavigate();

  const handleContactPartner = () => {
    if (partner.phone) {
      window.open(`tel:${partner.phone}`, '_blank');
    } else {
      toast.error("Chưa có SĐT");
    }
  };

  const handleBookService = () => {
    navigate('/services?tab=services');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{partner.name}</span>
            <Badge className="bg-primary text-white">
              <Star className="w-3 h-3 mr-1 fill-white" />
              {partner.rating || 0}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {partner.specialization || "Dịch vụ"} • {partner.review_count || 0} đánh giá
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
              {partner.description || <span className="text-gray-400">Chưa cập nhật</span>}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Thông tin liên hệ</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-gray-600">
                  {partner.address || <span className="text-gray-400">Chưa cập nhật</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                {partner.phone ? (
                  <a href={`tel:${partner.phone}`} className="text-primary hover:underline">
                    {partner.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Chưa cập nhật</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                {partner.email ? (
                  <a href={`mailto:${partner.email}`} className="text-primary hover:underline">
                    {partner.email}
                  </a>
                ) : (
                  <span className="text-gray-400">Chưa cập nhật</span>
                )}
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-gray-600">
                  {partner.hours || <span className="text-gray-400">Chưa cập nhật</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Đối tác được xác thực</p>
                <p className="text-xs text-blue-700">
                  Đã được RommZ kiểm tra và phê duyệt theo tiêu chuẩn chất lượng cao
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
                <span className="text-sm font-medium">{partner.rating || 0}</span>
                <span className="text-xs text-gray-500">({partner.review_count || 0} đánh giá)</span>
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
