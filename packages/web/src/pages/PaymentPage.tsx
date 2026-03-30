import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Flame,
  Loader2,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { QRPaymentModal } from "@/components/modals/QRPaymentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts";
import { stitchAssets } from "@/lib/stitchAssets";
import { cn, formatCurrency } from "@/lib/utils";
import {
  createSePayCheckoutSession,
  getPromoStatus,
  getUserSubscription,
  PRICING,
  type BillingCycle,
  type PromoStatus,
  type Subscription,
  type SubscriptionPlan,
} from "@/services/payments";
import {
  PREMIUM_ENTITLEMENT_MATRIX,
  PREMIUM_PUBLIC_BENEFITS,
} from "@roomz/shared/constants/premium-offer";

const LIVE_ROWS = PREMIUM_ENTITLEMENT_MATRIX.filter((row) => row.status === "live");

const FAQ_ITEMS = [
  {
    question: "RommZ+ đang mở khóa gì ngay lúc này?",
    answer:
      "Tập trung vào các quyền lợi đã chạy thật như xem số điện thoại host nhiều hơn, lưu yêu thích không giới hạn, roommate không giới hạn và deal Premium của Local Passport.",
  },
  {
    question: "Nếu đã là thành viên RommZ+ thì sao?",
    answer:
      "Trang này vẫn luôn xem được để bạn đối chiếu quyền lợi, mức giá hiện hành và trạng thái gói đang dùng. Nó không biến mất khi tài khoản đã active.",
  },
  {
    question: "Thanh toán diễn ra như thế nào?",
    answer:
      "RommZ dùng SePay QR. Sau khi quét và xác nhận thành công, gói sẽ kích hoạt ngay trên tài khoản hiện tại của bạn.",
  },
] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "Không giới hạn";
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "Không giới hạn";
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
  const [recentlyActivated, setRecentlyActivated] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    orderCode: string;
    qrCodeUrl: string;
    amount: number;
    expiresAt: string;
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    requestPromo: boolean;
  } | null>(null);

  useEffect(() => {
    async function hydrate() {
      try {
        const [nextPromoStatus, nextSubscription] = await Promise.all([
          getPromoStatus(),
          user ? getUserSubscription(user.id) : Promise.resolve(null),
        ]);
        setPromoStatus(nextPromoStatus);
        setSubscription(nextSubscription);
      } catch (error) {
        console.error("Failed to hydrate payment page:", error);
      } finally {
        setLoading(false);
      }
    }

    void hydrate();
  }, [user]);

  const activeSubscription = subscription?.plan === "rommz_plus" && subscription.status === "active";
  const remainingSlots = Math.max(0, (promoStatus?.totalSlots ?? 0) - (promoStatus?.claimedSlots ?? 0));
  const showPromo = remainingSlots > 0 && !activeSubscription;
  const currentBasePrice =
    billingCycle === "monthly" ? PRICING.ROMMZ_PLUS_MONTHLY : PRICING.ROMMZ_PLUS_QUARTERLY;
  const currentPromoPrice = PRICING.getPromoPrice(currentBasePrice);
  const quarterlySavings = PRICING.ROMMZ_PLUS_MONTHLY * 3 - PRICING.ROMMZ_PLUS_QUARTERLY;
  const liveBenefitCards = useMemo(() => LIVE_ROWS.slice(0, 4), []);

  const createCheckout = async (
    plan: SubscriptionPlan,
    selectedBillingCycle: BillingCycle,
    requestPromo: boolean,
  ) => {
    if (!user) throw new Error("Not authenticated");

    const result = await createSePayCheckoutSession(user.id, plan, selectedBillingCycle, requestPromo);
    setQrModalData({
      orderCode: result.orderCode,
      qrCodeUrl: result.qrCodeUrl,
      amount: result.amount,
      expiresAt: result.expiresAt,
      plan,
      billingCycle: selectedBillingCycle,
      requestPromo,
    });
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để mở gói RommZ+.");
      navigate("/login");
      return;
    }

    if (activeSubscription) {
      toast.info("Gói RommZ+ của bạn đang hoạt động.");
      return;
    }

    setProcessingPlan("rommz_plus");
    try {
      await createCheckout("rommz_plus", billingCycle, showPromo);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Không thể tạo phiên thanh toán. Vui lòng thử lại.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handlePaymentSuccess = () => {
    setQrModalData(null);
    setRecentlyActivated(true);
    toast.success("Thanh toán thành công. RommZ+ đã được kích hoạt.");
    if (user) {
      void getUserSubscription(user.id).then(setSubscription);
    }
  };

  const handleRegenerateCheckout = async () => {
    if (!qrModalData || !user) return;
    await createCheckout(qrModalData.plan, qrModalData.billingCycle, qrModalData.requestPromo);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <Button variant="ghost" className="mb-6 rounded-full pl-0 text-on-surface" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <section className="overflow-hidden rounded-[40px] border border-primary/10 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7ff_100%)] px-6 py-8 shadow-soft-lg md:px-10 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Hội viên RommZ+
              </div>
              <h1 className="mt-5 max-w-[11ch] font-display text-4xl font-black tracking-[-0.06em] text-on-surface md:text-6xl">
                Nâng tầm trải nghiệm cùng RommZ+
              </h1>
              <p className="mt-4 max-w-[56ch] text-base leading-8 text-on-surface-variant">
                Mở lớp ưu tiên cho hành trình tìm chỗ ở: liên hệ nhanh hơn, xem sâu hơn và giữ những deal tốt nhất trong
                một bề mặt gọn hơn.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {(recentlyActivated || activeSubscription) ? (
                  <Badge className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-700 hover:bg-emerald-50">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {recentlyActivated
                      ? "RommZ+ vừa kích hoạt"
                      : `RommZ+ hoạt động tới ${formatDate(subscription?.currentPeriodEnd)}`}
                  </Badge>
                ) : null}
                {showPromo ? (
                  <Badge className="rounded-full bg-[linear-gradient(90deg,#f97316_0%,#f59e0b_100%)] px-4 py-2 text-white">
                    <Flame className="h-3.5 w-3.5" />
                    Còn {remainingSlots} slot ưu đãi
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="overflow-hidden rounded-[32px] border border-primary/10 bg-white shadow-soft">
                <img
                  src={stitchAssets.roomDetail.gallery[0]}
                  alt="Không gian phòng premium của RommZ+"
                  className="h-[280px] w-full object-cover"
                />
              </div>
              <div className="absolute bottom-5 left-5 rounded-[22px] border border-white/70 bg-white/92 px-4 py-3 shadow-soft backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Gói hiện tại</p>
                <p className="mt-1 text-xl font-bold tracking-[-0.03em] text-on-surface">
                  {showPromo ? formatCurrency(currentPromoPrice) : formatCurrency(currentBasePrice)}
                </p>
                {showPromo ? (
                  <p className="mt-1 text-sm text-muted-foreground line-through">{formatCurrency(currentBasePrice)}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Giá chính thức</p>
                )}
              </div>

              {(recentlyActivated || activeSubscription) ? (
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <Button variant="outline" className="rounded-full" onClick={() => navigate("/profile")}>
                    Xem hồ sơ
                  </Button>
                  <Button className="rounded-full" onClick={() => navigate("/services?tab=deals")}>
                    Mở deal premium
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveBenefitCards.map((benefit) => (
            <div key={benefit.id} className="rounded-[28px] border border-primary/10 bg-white px-5 py-5 shadow-soft">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {benefit.kind === "hard_entitlement" ? "Live entitlement" : "Tín hiệu mạnh"}
              </p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-on-surface">{benefit.title}</p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">{benefit.premiumValue}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 flex justify-center">
          <div className="w-full max-w-[430px] rounded-[32px] border border-primary/12 bg-white px-6 py-7 shadow-soft-lg">
            <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-surface-container-low p-2">
              {(["monthly", "quarterly"] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "rounded-[18px] px-4 py-3 text-left transition-all",
                    billingCycle === cycle ? "bg-white shadow-soft" : "text-muted-foreground hover:bg-white/70",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {cycle === "monthly" ? "Theo tháng" : "Theo quý"}
                  </p>
                  <p className="mt-2 text-base font-semibold text-on-surface">
                    {formatCurrency(cycle === "monthly" ? PRICING.ROMMZ_PLUS_MONTHLY : PRICING.ROMMZ_PLUS_QUARTERLY)}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              {showPromo ? (
                <p className="text-sm text-muted-foreground line-through">{formatCurrency(currentBasePrice)}</p>
              ) : null}
              <h2 className="mt-2 font-display text-5xl font-black tracking-[-0.06em] text-on-surface">
                {formatCurrency(showPromo ? currentPromoPrice : currentBasePrice)}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {billingCycle === "monthly"
                  ? "Thanh toán theo tháng, linh hoạt đổi nhịp dùng."
                  : `Theo quý, đang tiết kiệm ${formatCurrency(quarterlySavings)} so với trả lẻ từng tháng.`}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {PREMIUM_PUBLIC_BENEFITS.map((benefit) => (
                <div key={benefit.id} className="flex items-start gap-3 rounded-[20px] bg-surface-container-low px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-on-surface">{benefit.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => void handleSubscribe()}
                disabled={activeSubscription || processingPlan === "rommz_plus"}
                className="w-full rounded-full py-6 text-base"
              >
                {processingPlan === "rommz_plus" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WalletCards className="mr-2 h-4 w-4" />
                )}
                {activeSubscription
                  ? "Bạn đang dùng gói này"
                  : `Thanh toán ${formatCurrency(showPromo ? currentPromoPrice : currentBasePrice)}`}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => navigate(activeSubscription ? "/profile" : "/search")}
              >
                {activeSubscription ? "Quay về hồ sơ" : "Tìm phòng trước khi nâng cấp"}
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[32px] border border-primary/10 bg-white shadow-soft">
          <div className="border-b border-border/70 px-6 py-5 md:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">So sánh entitlement</p>
            <h3 className="mt-2 font-display text-3xl font-black tracking-[-0.05em] text-on-surface">
              Bạn sẽ mở khóa gì ngay lúc này
            </h3>
            <p className="mt-2 max-w-[70ch] text-sm leading-7 text-on-surface-variant">
              Các hàng dưới đây chỉ hiển thị những quyền lợi live trong repo hiện tại, để trang bán gói không overpromise.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-surface-container-low">
                <tr className="text-sm text-on-surface-variant">
                  <th className="px-6 py-4 font-semibold md:px-8">Quyền lợi</th>
                  <th className="px-6 py-4 font-semibold">Miễn phí</th>
                  <th className="px-6 py-4 font-semibold">RommZ+</th>
                </tr>
              </thead>
              <tbody>
                {LIVE_ROWS.map((row) => (
                  <tr key={row.id} className="border-t border-border/70 align-top">
                    <td className="px-6 py-4 md:px-8">
                      <p className="font-semibold text-on-surface">{row.title}</p>
                      <p className="mt-1 text-sm leading-6 text-on-surface-variant">{row.notes}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{row.freeValue}</td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{row.premiumValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-3xl rounded-[32px] border border-primary/10 bg-white px-6 py-6 shadow-soft md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Câu hỏi thường gặp</p>
          <h3 className="mt-2 font-display text-3xl font-black tracking-[-0.05em] text-on-surface">
            Chốt gói trải nghiệm
          </h3>
          <Accordion type="single" collapsible className="mt-6">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-base font-semibold text-on-surface hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-on-surface-variant">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>

      {qrModalData ? (
        <QRPaymentModal
          isOpen
          onClose={() => setQrModalData(null)}
          orderCode={qrModalData.orderCode}
          qrCodeUrl={qrModalData.qrCodeUrl}
          amount={qrModalData.amount}
          expiresAt={qrModalData.expiresAt}
          billingCycle={qrModalData.billingCycle}
          onPaymentSuccess={handlePaymentSuccess}
          onRegenerate={handleRegenerateCheckout}
        />
      ) : null}
    </div>
  );
}
