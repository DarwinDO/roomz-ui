/**
 * Payment Page
 * RommZ+ subscription plans and checkout with SePay QR
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Check,
  Crown,
  Shield,
  Loader2,
  CheckCircle,
  CreditCard,
  Star,
  Flame,
} from "lucide-react";
import { useAuth } from "@/contexts";
import {
  PLANS,
  getRommZPlusPlan,
  createSePayCheckoutSession,
  getUserSubscription,
  getPromoStatus,
  type Subscription,
  type SubscriptionPlan,
  type PromoStatus,
  type BillingCycle,
} from "@/services/payments";
import { QRPaymentModal } from "@/components/modals/QRPaymentModal";
import { toast } from "sonner";

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly">("monthly");
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);

  // QR Modal state
  const [qrModalData, setQrModalData] = useState<{
    orderCode: string;
    qrCodeUrl: string;
    amount: number;
    billingCycle: BillingCycle;
  } | null>(null);

  const rommzPlusPlan = getRommZPlusPlan();

  // Fetch promo status
  useEffect(() => {
    async function fetchPromoStatus() {
      try {
        const status = await getPromoStatus();
        setPromoStatus(status);
      } catch (error) {
        console.error("Failed to fetch promo status:", error);
      }
    }
    fetchPromoStatus();
  }, []);

  // Fetch current subscription
  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const sub = await getUserSubscription(user.id);
        setSubscription(sub);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng ký");
      navigate("/login");
      return;
    }

    if (plan === "free") {
      toast.info("Bạn đang sử dụng gói miễn phí");
      return;
    }

    setProcessingPlan(plan);
    try {
      // Use SePay QR checkout
      const result = await createSePayCheckoutSession(
        user.id,
        plan,
        billingCycle,
        remainingSlots > 0 // Apply promo if slots available
      );

      // Open QR payment modal
      setQrModalData({
        orderCode: result.orderCode,
        qrCodeUrl: result.qrCodeUrl,
        amount: billingCycle === "monthly"
          ? (rommzPlusPlan?.price || 49000)
          : (rommzPlusPlan?.quarterlyPrice || 119000),
        billingCycle,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Không thể tạo phiên thanh toán. Vui lòng thử lại.");
    } finally {
      setProcessingPlan(null);
    }
  };

  // Handle QR payment success
  const handlePaymentSuccess = () => {
    setQrModalData(null);
    setShowSuccess(true);
    toast.success("Thanh toán thành công! Chào mừng đến với RommZ+");

    // Refresh subscription
    if (user) {
      getUserSubscription(user.id).then(setSubscription);
    }
  };

  const getPlanIcon = (planId: SubscriptionPlan) => {
    switch (planId) {
      case "free":
        return Star;
      case "rommz_plus":
        return Crown;
      default:
        return Star;
    }
  };

  const getCurrentPrice = () => {
    if (!rommzPlusPlan) return 49000;
    return billingCycle === "monthly" ? rommzPlusPlan.price : (rommzPlusPlan.quarterlyPrice || 119000);
  };

  const getSavings = () => {
    if (!rommzPlusPlan) return 0;
    const monthlyTotal = rommzPlusPlan.price * 3;
    const quarterlyPrice = rommzPlusPlan.quarterlyPrice || 119000;
    return monthlyTotal - quarterlyPrice;
  };

  const remainingSlots = promoStatus ? promoStatus.totalSlots - promoStatus.claimedSlots : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Chào mừng đến RommZ+!</h2>
            <p className="text-gray-600 mb-6">
              Tài khoản của bạn đã được nâng cấp thành công. Hãy tận hưởng các tính năng premium!
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate("/profile")} className="w-full">
                Xem hồ sơ của tôi
              </Button>
              <Button variant="outline" onClick={() => navigate("/search")} className="w-full">
                Tìm phòng ngay
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="ml-3">
            <h1 className="text-lg font-semibold">Nâng cấp tài khoản</h1>
            <p className="text-sm text-gray-500">Chọn gói phù hợp với bạn</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Nâng cấp ngay hôm nay
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Mở khóa toàn bộ tính năng với RommZ+
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trải nghiệm thuê nhà tốt nhất với các tính năng premium độc quyền
          </p>
        </div>

        {/* Early Bird Promo Bar */}
        {remainingSlots > 0 && (
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
              <Flame className="w-5 h-5" />
              <span className="font-medium">
                Chỉ còn <strong>{remainingSlots}</strong> slot giá 24.500đ!
              </span>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-full flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Tháng {rommzPlusPlan?.price?.toLocaleString('vi-VN')}đ
            </button>
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${billingCycle === "quarterly"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Quý {(rommzPlusPlan?.quarterlyPrice || 119000).toLocaleString('vi-VN')}đ
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                Tiết kiệm 19%
              </Badge>
            </button>
          </div>
        </div>

        {/* Current Plan Badge */}
        {subscription && (
          <div className="flex justify-center mb-6">
            <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Đang sử dụng: {PLANS.find((p) => p.id === subscription.plan)?.name}
            </Badge>
          </div>
        )}

        {/* Pricing Cards - 2 Column */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = subscription?.plan === plan.id;
            const isProcessing = processingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${plan.recommended
                  ? "border-2 border-primary shadow-lg scale-105 md:scale-110"
                  : ""
                  }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center text-sm py-1 font-medium">
                    Phổ biến nhất
                  </div>
                )}
                <CardHeader className={plan.recommended ? "pt-10" : ""}>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.recommended
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className={plan.recommended && billingCycle === "quarterly" ? "text-green-600 font-medium" : ""}>
                        {plan.recommended ? (
                          <>
                            {billingCycle === "monthly"
                              ? `${getCurrentPrice().toLocaleString('vi-VN')}đ/tháng`
                              : `${Math.floor((rommzPlusPlan?.quarterlyPrice || 119000) / 3).toLocaleString('vi-VN')}đ/tháng`
                            }
                            {billingCycle === "quarterly" && (
                              <span className="text-xs text-gray-500 font-normal ml-1">
                                ({rommzPlusPlan?.quarterlyPrice?.toLocaleString('vi-VN')}đ/quý)
                              </span>
                            )}
                          </>
                        ) : (
                          plan.priceDisplay
                        )}
                      </CardDescription>
                      {plan.recommended && billingCycle === "quarterly" && (
                        <span className="text-xs text-green-600 font-medium">
                          Tiết kiệm {getSavings().toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isProcessing}
                    className={`w-full rounded-full ${plan.recommended
                      ? "bg-primary hover:bg-primary/90"
                      : ""
                      }`}
                    variant={plan.recommended ? "default" : "outline"}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Gói hiện tại
                      </>
                    ) : plan.id === "free" ? (
                      "Miễn phí"
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Nâng cấp ngay
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Thanh toán an toàn</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Secure</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Hủy bất cứ lúc nào. Không cam kết dài hạn.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {[
              {
                q: "Tôi có thể hủy đăng ký bất cứ lúc nào không?",
                a: "Có, bạn có thể hủy đăng ký bất cứ lúc nào. Tài khoản premium sẽ vẫn hoạt động đến hết chu kỳ thanh toán.",
              },
              {
                q: "Có trial miễn phí không?",
                a: "Hiện tại chúng tôi không có trial miễn phí. Bạn có thể hủy bất cứ lúc nào nếu không hài lòng.",
              },
              {
                q: "Thanh toán có an toàn không?",
                a: "Mọi giao dịch đều được bảo mật với mã hóa SSL. Chúng tôi không lưu thông tin thẻ của bạn.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* QR Payment Modal */}
      {qrModalData && (
        <QRPaymentModal
          isOpen={true}
          onClose={() => setQrModalData(null)}
          orderCode={qrModalData.orderCode}
          qrCodeUrl={qrModalData.qrCodeUrl}
          amount={qrModalData.amount}
          billingCycle={qrModalData.billingCycle}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
