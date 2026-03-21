import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Gift,
  HeartHandshake,
  MoveRight,
  Shirt,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeals } from "@/hooks/useDeals";
import { usePartners } from "@/hooks/usePartners";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { ShopDetailModal } from "@/components/modals/ShopDetailModal";
import { BookMovingModal } from "@/components/modals/BookMovingModal";
import { CleaningScheduleModal } from "@/components/modals/CleaningScheduleModal";
import { ChatDrawer } from "@/components/common/ChatDrawer";
import { StitchFooter } from "@/components/common/StitchFooter";
import { stitchAssets } from "@/lib/stitchAssets";
import { UPGRADE_SOURCES } from "@roomz/shared/constants/tracking";
import type { DealWithPartner } from "@/services/deals";

const familyServices = [
  {
    id: "moving",
    title: "Chuyển phòng nhanh",
    description: "Đội ngũ hỗ trợ đóng gói và chuyển đồ an toàn trong cùng ngày.",
    price: "Từ 500k/lượt",
    icon: MoveRight,
    accent: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
  },
  {
    id: "cleaning",
    title: "Dọn dẹp chuyên sâu",
    description: "Làm sạch phòng trước khi nhận phòng hoặc sau khi chuyển đi.",
    price: "Từ 150k/giờ",
    icon: Sparkles,
    accent:
      "bg-secondary-container/20 text-secondary group-hover:bg-secondary group-hover:text-white",
  },
  {
    id: "repair",
    title: "Điện nước & sửa chữa",
    description: "Những lỗi nhỏ trong phòng được xử lý nhanh, rõ lịch và dễ đặt.",
    price: "Từ 80k/lần",
    icon: Wrench,
    accent:
      "bg-tertiary-container/20 text-tertiary group-hover:bg-tertiary group-hover:text-white",
  },
  {
    id: "laundry",
    title: "Giặt ủi lấy liền",
    description: "Dịch vụ giặt, ủi và giao nhận ngay tại nơi ở của bạn.",
    price: "Từ 20k/kg",
    icon: Shirt,
    accent: "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white",
  },
] as const;

const reviews = [
  {
    name: "Minh Thư",
    role: "Sinh viên FTU",
    content:
      "Dịch vụ dọn phòng rất gọn, sạch và đúng giờ. Đặt trên RommZ xong là có lịch xác nhận ngay.",
  },
  {
    name: "Hoàng Nam",
    role: "Designer tự do",
    content:
      "Các voucher đối tác thực sự dùng được. Phần dịch vụ và ưu đãi nằm chung một nơi nên dễ quay lại hơn hẳn.",
  },
  {
    name: "Khánh Linh",
    role: "Sinh viên Y khoa",
    content:
      "Mình thích nhất là các deal gần khu đang ở. Không cần tự đi săn từng chỗ một nữa.",
  },
] as const;

function formatExpiry(value: string | null) {
  if (!value) {
    return "Không giới hạn";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
}

function categoryTone(category?: string | null) {
  switch (category) {
    case "moving":
      return "border-[#f6d5d5] bg-white/84 text-[#cc5858] shadow-[0_10px_24px_rgba(204,88,88,0.16)]";
    case "coffee":
    case "food":
      return "border-[#f3dec0] bg-white/84 text-[#a86d2b] shadow-[0_10px_24px_rgba(168,109,43,0.14)]";
    case "fitness":
    case "gym":
      return "border-[#cde6d6] bg-white/84 text-[#23754f] shadow-[0_10px_24px_rgba(35,117,79,0.14)]";
    case "workspace":
      return "border-[#d6defb] bg-white/84 text-[#355bdc] shadow-[0_10px_24px_rgba(53,91,220,0.14)]";
    default:
      return "border-white/70 bg-white/84 text-primary shadow-[0_10px_24px_rgba(53,91,220,0.12)]";
  }
}

function categoryDisplayLabel(category?: string | null) {
  if (!category) {
    return "DEAL";
  }

  return category.replace(/[_-]/g, " ").trim().toUpperCase();
}

export default function ServicesHubPage() {
  const navigate = useNavigate();
  const { data: partners = [] } = usePartners();
  const { data: deals = [] } = useDeals();
  const { isPremium } = usePremiumLimits();

  const [selectedDeal, setSelectedDeal] = useState<DealWithPartner | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isMovingModalOpen, setIsMovingModalOpen] = useState(false);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAllDeals, setShowAllDeals] = useState(false);

  const mappedDeals = useMemo(
    () =>
      deals.map((deal, index) => ({
        ...deal,
        image:
          deal.partner?.image_url ||
          stitchAssets.services.dealImages[index % stitchAssets.services.dealImages.length] ||
          stitchAssets.services.dealImages[0],
      })),
    [deals],
  );

  const visibleDeals = showAllDeals ? mappedDeals : mappedDeals.slice(0, 4);
  const visiblePartners = showAllDeals ? partners : partners.slice(0, 4);

  const handleServiceClick = (id: string) => {
    if (id === "moving") {
      setIsMovingModalOpen(true);
      return;
    }

    if (id === "cleaning") {
      setIsCleaningModalOpen(true);
      return;
    }

    setIsChatOpen(true);
  };

  const openDeal = (deal: DealWithPartner) => {
    if (deal.is_premium_only && !isPremium) {
      navigate(`/payment?source=${UPGRADE_SOURCES.DEAL_PREMIUM}`);
      return;
    }

    setSelectedDeal(deal);
    setIsDealModalOpen(true);
  };

  const revealDeals = () => {
    setShowAllDeals(true);
    document.getElementById("hot-deals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-background text-foreground">
      <main
        className="min-h-screen pb-24 pt-20 md:pb-0"
        aria-label="Noi dung chinh dich vu, skip link duoc cung cap boi AppShell"
      >
        <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-12 md:py-20">
          <div className="relative z-10 grid items-center gap-12 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="space-y-8">
              <span className="inline-block rounded-full bg-primary-container/20 px-4 py-2 font-display text-sm font-bold text-primary">
                Dành riêng cho cư dân RommZ
              </span>
              <h1 className="max-w-[13ch] xl:max-w-[11ch]">
                Sống tiện nghi, <span className="text-primary">trọn ưu đãi</span>
              </h1>
              <p className="max-w-[34rem] text-lg text-muted-foreground">
                Dịch vụ hậu thuê, ưu đãi quanh khu ở và mạng lưới đối tác địa phương giờ
                nằm trong cùng một hành trình, đúng như spec Stitch của RommZ.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => document.getElementById("family-services")?.scrollIntoView({ behavior: "smooth" })}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.currentTarget.blur();
                    }
                  }}
                  className="stitch-primary-gradient rounded-full px-8 py-4 font-display text-sm font-bold text-white stitch-editorial-shadow transition-transform hover:scale-105"
                >
                  Khám phá ngay
                </button>
                <button
                  type="button"
                  onClick={revealDeals}
                  className="rounded-full bg-surface-container-highest px-8 py-4 font-display text-sm font-bold text-primary-container-foreground transition-transform hover:scale-105"
                >
                  Xem voucher
                </button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl xl:max-w-none">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-secondary-container/30 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-tertiary-container/30 blur-2xl" />
              <img
                src={stitchAssets.services.heroImage}
                alt="Không gian dịch vụ và cộng đồng của RommZ"
                className="stitch-editorial-shadow h-[420px] w-full rounded-[32px] object-cover xl:h-[500px]"
              />
              <div className="stitch-editorial-shadow absolute bottom-4 right-4 max-w-[220px] rounded-[28px] border border-white/20 bg-white/80 p-6 backdrop-blur-xl xl:-bottom-6 xl:right-6 xl:max-w-[240px]">
                <div className="mb-2 flex items-center gap-3">
                  <HeartHandshake className="h-5 w-5 text-secondary" />
                  <span className="font-display text-sm font-bold text-foreground">98% hài lòng</span>
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  Hơn 5000+ cư dân đã dùng dịch vụ và voucher quanh nơi ở trong tháng qua.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="family-services" className="bg-surface-container-low py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12">
              <h2 className="mb-4 text-3xl">Dịch vụ gia đình</h2>
              <p className="font-body text-muted-foreground">
                Mọi nhu cầu xoay quanh việc vào ở, chuyển phòng và chăm phòng được gom lại
                trong một cụm rõ ràng.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {familyServices.map((service) => {
                const Icon = service.icon;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceClick(service.id)}
                    className="group flex rounded-[28px] bg-white p-8 text-left transition-all hover:-translate-y-2 stitch-editorial-shadow"
                  >
                    <div className="flex h-full flex-col">
                      <div
                        className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] transition-colors ${service.accent}`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mb-2 text-xl">{service.title}</h3>
                      <p className="mb-6 text-sm text-muted-foreground">{service.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <span className="block text-xs text-muted-foreground">Từ</span>
                          <span className="text-lg font-bold text-primary">{service.price}</span>
                        </div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="hot-deals" className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-4 text-3xl">Ưu đãi đối tác</h2>
              <p className="font-body text-muted-foreground">
                Voucher ăn uống, sức khỏe, workspace và các deal địa phương đổ từ dữ liệu
                thật của RommZ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showAllDeals) {
                  setShowAllDeals(false);
                  document.getElementById("hot-deals")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }

                revealDeals();
              }}
              className="flex items-center gap-2 font-display text-sm font-bold text-primary hover:underline"
            >
              {showAllDeals ? "Thu gọn ưu đãi" : "Xem toàn bộ ưu đãi"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {mappedDeals.length > 0
              ? visibleDeals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => openDeal(deal)}
                    className="overflow-hidden rounded-[28px] bg-white text-left stitch-editorial-shadow"
                  >
                    <div className="relative h-40">
                      <img src={deal.image} alt={deal.partner.name} className="h-full w-full object-cover" />
                      <div className="absolute left-4 top-4">
                        <Badge
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-[0.22em] backdrop-blur-md ${categoryTone(deal.partner.category)}`}
                        >
                          {categoryDisplayLabel(deal.partner.category)}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-primary backdrop-blur">
                        {deal.discount_value || "Ưu đãi"}
                      </div>
                    </div>
                    <div className="flex h-[188px] flex-col p-6">
                      <h4 className="text-lg">{deal.partner.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{deal.title}</p>
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {deal.description || deal.partner.specialization || "Ưu đãi đang mở cho cư dân RommZ."}
                      </p>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-muted-foreground">
                        <span>HSD: {formatExpiry(deal.valid_until)}</span>
                        <span className="font-bold text-primary">
                          {deal.is_premium_only && !isPremium ? "Premium" : "Lấy mã"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              : visiblePartners.map((partner, index) => (
                  <div key={partner.id} className="overflow-hidden rounded-[28px] bg-white stitch-editorial-shadow">
                    <div className="relative h-40">
                      <img
                        src={partner.image_url || stitchAssets.services.dealImages[index]}
                        alt={partner.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg">{partner.name}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {partner.specialization || "Đối tác địa phương của RommZ"}
                      </p>
                    </div>
                  </div>
                ))}
          </div>

          {showAllDeals && mappedDeals.length > 0 && partners.length > 0 ? (
            <div className="mt-14">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-2xl">Đối tác gần bạn</h3>
                  <p className="text-sm text-muted-foreground">
                    Danh sách đối tác được mở rộng để bạn nhìn hết hệ sinh thái dịch vụ quanh nơi ở.
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {partners.length} đối tác đang hoạt động
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {visiblePartners.map((partner, index) => (
                  <div key={`expanded-${partner.id}`} className="overflow-hidden rounded-[28px] bg-white stitch-editorial-shadow">
                    <div className="relative h-40">
                      <img
                        src={partner.image_url || stitchAssets.services.dealImages[index % stitchAssets.services.dealImages.length]}
                        alt={partner.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg">{partner.name}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {partner.specialization || "Đối tác địa phương của RommZ"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="bg-surface py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-16 text-center text-3xl">Tiếng nói cư dân</h2>
            <div className="grid gap-12 md:grid-cols-3">
              {reviews.map((review, index) => (
                <div key={review.name} className="relative pt-12">
                  <div className="stitch-editorial-shadow absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full border-4 border-white">
                    <img
                      src={stitchAssets.services.reviewAvatars[index]}
                      alt={review.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="stitch-editorial-shadow rounded-[28px] bg-white p-8 text-center">
                    <div className="mb-4 flex justify-center gap-1 text-secondary">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Gift key={starIndex} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mb-6 text-sm italic leading-7 text-muted-foreground">
                      “{review.content}”
                    </p>
                    <h5 className="font-display text-base font-bold text-foreground">{review.name}</h5>
                    <span className="text-xs text-muted-foreground">{review.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <StitchFooter variant="dark" />

      <BookMovingModal isOpen={isMovingModalOpen} onClose={() => setIsMovingModalOpen(false)} />
      <CleaningScheduleModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
      />
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        recipientName="SetupCare"
        recipientRole="Đối tác hỗ trợ RommZ"
      />
      <ShopDetailModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        deal={selectedDeal}
      />
    </div>
  );
}
