import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Truck,
  Sparkles,
  Package,
  ShieldCheck,
  Percent,
  ExternalLink,
} from "lucide-react";
import { BookMovingModal } from "@/components/modals/BookMovingModal";
import { CleaningScheduleModal } from "@/components/modals/CleaningScheduleModal";
import { SupportRequestModal } from "@/components/modals/SupportRequestModal";
import { PartnerDetailModal } from "@/components/modals/PartnerDetailModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { usePartners } from "@/hooks/usePartners";
import type { Partner } from "@/services/partners";

export default function SupportServicesPage() {
  const navigate = useNavigate();

  const { data: partners, isLoading: isPartnersLoading } = usePartners();

  const [isMovingModalOpen, setIsMovingModalOpen] = useState(false);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isPartnerDetailOpen, setIsPartnerDetailOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleServiceClick = (serviceId: number) => {
    if (serviceId === 1) setIsMovingModalOpen(true);
    if (serviceId === 2) setIsCleaningModalOpen(true);
    if (serviceId === 3) setIsChatOpen(true);
  };

  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsPartnerDetailOpen(true);
  };

  const handleViewAllPartners = () => {
    navigate('/partners');
  };

  const services = [
    {
      id: 1,
      title: "Dịch vụ chuyển phòng",
      description: "Đội ngũ chuyên nghiệp hỗ trợ chuyển phòng an toàn, nhanh chóng",
      icon: Truck,
      buttonText: "Đặt dịch vụ",
      color: "bg-blue-50",
      iconColor: "text-primary",
    },
    {
      id: 2,
      title: "Vệ sinh phòng",
      description: "Vệ sinh tổng quát trước khi nhận phòng hoặc trả phòng",
      icon: Sparkles,
      buttonText: "Đặt lịch dọn dẹp",
      color: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      id: 3,
      title: "Đóng gói & lắp đặt",
      description: "Giúp lắp ráp nội thất và sắp xếp không gian gọn gàng",
      icon: Package,
      buttonText: "Liên hệ đối tác",
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFF] to-white pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="ml-3">Chuyển phòng nhàn tênh</h3>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border-border"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div
                  className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center`}
                >
                  <service.icon className={`w-8 h-8 ${service.iconColor}`} />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3>{service.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {service.description}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Đối tác đã xác thực
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    <Percent className="w-3 h-3 mr-1" />
                    Giảm 15% cho sinh viên
                  </Badge>
                </div>

                {/* Button */}
                <Button
                  onClick={() => handleServiceClick(service.id)}
                  className="w-full rounded-full"
                >
                  {service.buttonText}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* All Partners Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2>Đối tác RoomZ đề xuất</h2>
            <Button
              onClick={handleViewAllPartners}
              variant="ghost"
              className="rounded-full text-primary"
            >
              Xem tất cả
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {isPartnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 rounded-2xl animate-pulse">
                  <div className="h-24 bg-muted rounded-lg" />
                </Card>
              ))}
            </div>
          ) : partners && partners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {partners.slice(0, 3).map((partner) => (
                <Card
                  key={partner.id}
                  onClick={() => handlePartnerClick(partner)}
                  className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border-border cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4>{partner.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {partner.specialization}
                        </p>
                      </div>
                      <Badge className="rounded-full bg-primary text-white">
                        ★ {partner.rating}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {partner.review_count} đánh giá
                      </span>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-amber-50 text-amber-700 text-xs"
                      >
                        {partner.discount}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Chưa có đối tác nào. Hãy quay lại sau!
              </p>
            </Card>
          )}
        </div>

        {/* CTA Section */}
        <Card className="p-8 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-white">Cần hỗ trợ theo nhu cầu?</h2>
              <p className="text-white/90">
                Liên hệ RoomZ để được hỗ trợ chuyển phòng và sắp xếp riêng cho bạn
              </p>
            </div>
            <Button
              onClick={() => navigate('/messages')}
              variant="secondary"
              className="rounded-full bg-white text-primary hover:bg-white/90 shrink-0"
            >
              Liên hệ hỗ trợ
            </Button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <BookMovingModal
        isOpen={isMovingModalOpen}
        onClose={() => setIsMovingModalOpen(false)}
      />
      <CleaningScheduleModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
      />
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipientName="SetupCare"
        recipientRole="Đối tác - Lắp đặt & sắp xếp"
      />
      <SupportRequestModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        onSubmit={() => {
          // Navigate to messages page for support
          navigate('/messages');
        }}
      />
      {selectedPartner && (
        <PartnerDetailModal
          isOpen={isPartnerDetailOpen}
          onClose={() => setIsPartnerDetailOpen(false)}
          partner={selectedPartner}
        />
      )}
    </div>
  );
}
