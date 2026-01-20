/**
 * Payment Page
 * RoomZ+ subscription plans and checkout
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
  Sparkles,
  Shield,
  Loader2,
  CheckCircle,
  CreditCard,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts";
import {
  PLANS,
  createCheckoutSession,
  handleCheckoutSuccess,
  getUserSubscription,
  type Subscription,
  type SubscriptionPlan,
} from "@/services/payments";
import { toast } from "sonner";

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for checkout success
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && user) {
      handleCheckoutComplete(sessionId);
    }
  }, [searchParams, user]);

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

  const handleCheckoutComplete = async (sessionId: string) => {
    if (!user) return;

    try {
      const sub = await handleCheckoutSuccess(user.id, sessionId);
      setSubscription(sub);
      setShowSuccess(true);
      toast.success("Đăng ký RoomZ+ thành công!");

      // Clear URL params
      window.history.replaceState({}, "", "/payment");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng liên hệ hỗ trợ.");
    }
  };

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
      const { checkoutUrl } = await createCheckoutSession(
        user.id,
        plan,
        `${window.location.origin}/payment`,
        `${window.location.origin}/payment`
      );

      // Redirect to checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Không thể tạo phiên thanh toán. Vui lòng thử lại.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planId: SubscriptionPlan) => {
    switch (planId) {
      case "free":
        return Star;
      case "roomz_plus":
        return Crown;
      case "roomz_pro":
        return Sparkles;
      default:
        return Star;
    }
  };

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
            <h2 className="text-2xl font-bold mb-2">Chào mừng đến RoomZ+!</h2>
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Nâng cấp ngay hôm nay
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Mở khóa toàn bộ tính năng với RoomZ+
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tăng cơ hội tìm được phòng phù hợp nhanh hơn 50% với các tính năng premium
          </p>
        </div>

        {/* Current Plan Badge */}
        {subscription && (
          <div className="flex justify-center mb-8">
            <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Đang sử dụng: {PLANS.find((p) => p.id === subscription.plan)?.name}
            </Badge>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = subscription?.plan === plan.id;
            const isProcessing = processingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.recommended
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
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.recommended
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.priceDisplay}</CardDescription>
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
                    className={`w-full rounded-full ${
                      plan.recommended
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
          <p className="text-sm text-gray-500 mb-4">Thanh toán an toàn với</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Stripe</span>
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
                a: "Sinh viên được miễn phí badge Verified+. Với các gói premium, bạn có thể trải nghiệm 7 ngày miễn phí.",
              },
              {
                q: "Thanh toán có an toàn không?",
                a: "Mọi giao dịch đều được xử lý qua Stripe với mã hóa SSL. Chúng tôi không lưu thông tin thẻ của bạn.",
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
    </div>
  );
}
