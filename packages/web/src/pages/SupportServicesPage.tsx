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
import { PartnerDetailModal } from "@/components/modals/PartnerDetailModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { usePartners } from "@/hooks/usePartners";
import type { Partner } from "@/services/partners";

interface SupportServicesContentProps {
  embedded?: boolean;
}

const services = [
  {
    id: 1,
    title: "Dịch vụ chuyển phòng",
    description: "Đội ngũ chuyên nghiệp hỗ trợ chuyển phòng an toàn, nhanh chóng.",
    icon: Truck,
    buttonText: "Đặt dịch vụ",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: 2,
    title: "Vệ sinh phòng",
    description: "Vệ sinh tổng quát trước khi nhận phòng hoặc trả phòng.",
    icon: Sparkles,
    buttonText: "Đặt lịch dọn dẹp",
    color: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  {
    id: 3,
    title: "Đóng gói & lắp đặt",
    description: "Giúp lắp ráp nội thất và sắp xếp không gian gọn gàng.",
    icon: Package,
    buttonText: "Liên hệ đối tác",
    color: "bg-amber-100",
    iconColor: "text-warning",
  },
] as const;

export function SupportServicesContent({
  embedded = false,
}: SupportServicesContentProps) {
  const navigate = useNavigate();
  const { data: partners, isLoading: isPartnersLoading } = usePartners();

  const [isMovingModalOpen, setIsMovingModalOpen] = useState(false);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  return (
    <div
      lang="vi"
      className={
        embedded
          ? "space-y-8"
          : "min-h-screen bg-gradient-to-b from-[#f5f8fb] via-[#faf7f2] to-[#fffdf9] pb-24 md:pb-8"
      }
    >
      {!embedded ? (
        <div className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h3 className="ml-3 font-display text-xl">Dịch vụ quanh nơi ở</h3>
          </div>
        </div>
      ) : null}

      <div className={embedded ? "space-y-8" : "mx-auto max-w-6xl space-y-8 px-4 py-8"}>
        <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,#f4f9fd_0%,#fffdf9_55%,#fff3df_100%)] p-0">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_1.95fr]">
            <div className="border-b border-border/70 bg-[#11202d] px-6 py-6 text-white lg:border-b-0 lg:border-r">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trusted support
              </div>
              <h2 className="font-display text-3xl leading-tight text-white">
                Chuyển phòng gọn hơn,
                <br />
                bớt rối hơn.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
                Từ chuyển đồ, dọn phòng đến setup góc ở mới, RommZ gom các dịch vụ
                sau thuê nhà vào một cụm rõ ràng để bạn không phải tự xoay xở.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/10 text-white">Đối tác đã xác thực</Badge>
                <Badge className="rounded-full bg-white/10 text-white">Giảm giá sinh viên</Badge>
                <Badge className="rounded-full bg-white/10 text-white">Liên hệ nhanh</Badge>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="gap-4 rounded-[28px] border-border/80 bg-card/90 p-5 shadow-soft transition-transform hover:-translate-y-1"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.color}`}
                  >
                    <service.icon className={`h-7 w-7 ${service.iconColor}`} />
                  </div>

                  <div className="space-y-2">
                    <h3>{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-secondary/20 bg-secondary/10 text-secondary"
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Đã xác thực
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-warning/20 bg-amber-50 text-warning"
                    >
                      <Percent className="mr-1 h-3 w-3" />
                      Ưu đãi sinh viên
                    </Badge>
                  </div>

                  <Button
                    onClick={() => handleServiceClick(service.id)}
                    className="mt-auto w-full rounded-full"
                  >
                    {service.buttonText}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                Đối tác đề xuất
              </p>
              <h2 className="mt-2 text-3xl text-foreground">Các đội dịch vụ được RommZ gợi ý</h2>
            </div>
            <Button
              onClick={() => navigate("/services?tab=deals")}
              variant="outline"
              className="rounded-full"
            >
              Xem ưu đãi & đối tác
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {isPartnersLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-[28px] p-5">
                  <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                </Card>
              ))}
            </div>
          ) : partners && partners.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {partners.slice(0, 3).map((partner) => (
                <Card
                  key={partner.id}
                  onClick={() => handlePartnerClick(partner)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handlePartnerClick(partner);
                    }
                    if (event.key === "Escape") {
                      event.currentTarget.blur();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Xem chi tiết đối tác ${partner.name}`}
                  className="cursor-pointer rounded-[28px] border-border/80 p-5 transition-transform hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{partner.review_count} đánh giá</span>
                      <Badge
                        variant="outline"
                        className="rounded-full border-warning/20 bg-amber-50 text-warning"
                      >
                        {partner.discount}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-[28px] p-8 text-center">
              <p className="text-muted-foreground">
                Chưa có đối tác nào. Hãy quay lại sau.
              </p>
            </Card>
          )}
        </div>

        <Card className="rounded-[30px] border-0 bg-[linear-gradient(135deg,var(--primary)_0%,#1f5f88_52%,var(--secondary)_100%)] p-8 text-white shadow-soft-lg">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="font-display text-white">Cần hỗ trợ theo nhu cầu riêng?</h2>
              <p className="max-w-2xl text-white/88">
                Liên hệ RommZ để được gợi ý tổ hợp dịch vụ phù hợp với thời điểm
                chuyển phòng, ngân sách và khu vực bạn đang ở.
              </p>
            </div>
            <Button
              onClick={() => navigate("/messages")}
              variant="secondary"
              className="shrink-0 rounded-full bg-white text-primary hover:bg-white/90"
            >
              Liên hệ hỗ trợ
            </Button>
          </div>
        </Card>
      </div>

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
      {selectedPartner ? (
        <PartnerDetailModal
          isOpen={isPartnerDetailOpen}
          onClose={() => setIsPartnerDetailOpen(false)}
          partner={selectedPartner}
        />
      ) : null}
    </div>
  );
}

export default function SupportServicesPage() {
  return <SupportServicesContent />;
}
