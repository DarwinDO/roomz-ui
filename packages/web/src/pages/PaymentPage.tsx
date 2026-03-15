/**
 * Payment Page
 * RommZ+ subscription plans and checkout with SePay QR
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle, CreditCard, Crown, Flame, Loader2, Shield, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { QRPaymentModal } from '@/components/modals/QRPaymentModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PLANS,
  createSePayCheckoutSession,
  getPromoStatus,
  getRommZPlusPlan,
  getUserSubscription,
  type BillingCycle,
  type PromoStatus,
  type Subscription,
  type SubscriptionPlan,
} from '@/services/payments';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    orderCode: string;
    qrCodeUrl: string;
    amount: number;
    expiresAt: string;
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    requestPromo: boolean;
  } | null>(null);

  const rommzPlusPlan = getRommZPlusPlan();

  useEffect(() => {
    async function fetchPromoStatus() {
      try {
        const status = await getPromoStatus();
        setPromoStatus(status);
      } catch (error) {
        console.error('Failed to fetch promo status:', error);
      }
    }

    void fetchPromoStatus();
  }, []);

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const nextSubscription = await getUserSubscription(user.id);
        setSubscription(nextSubscription);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    void fetchSubscription();
  }, [user]);

  const createCheckout = async (
    plan: SubscriptionPlan,
    selectedBillingCycle: BillingCycle,
    requestPromo: boolean,
  ) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const result = await createSePayCheckoutSession(
      user.id,
      plan,
      selectedBillingCycle,
      requestPromo,
    );

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

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký');
      navigate('/login');
      return;
    }

    if (plan === 'free') {
      toast.info('Bạn đang sử dụng gói miễn phí');
      return;
    }

    setProcessingPlan(plan);
    try {
      await createCheckout(plan, billingCycle, remainingSlots > 0);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Không thể tạo phiên thanh toán. Vui lòng thử lại.');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handlePaymentSuccess = () => {
    setQrModalData(null);
    setShowSuccess(true);
    toast.success('Thanh toán thành công. Chào mừng bạn đến với RommZ+.');

    if (user) {
      void getUserSubscription(user.id).then(setSubscription);
    }
  };

  const handleRegenerateCheckout = async () => {
    if (!qrModalData) return;

    if (!user) {
      toast.error('Vui lòng đăng nhập lại để tiếp tục thanh toán.');
      navigate('/login');
      return;
    }

    await createCheckout(
      qrModalData.plan,
      qrModalData.billingCycle,
      qrModalData.requestPromo,
    );
  };

  const getPlanIcon = (planId: SubscriptionPlan) => {
    switch (planId) {
      case 'free':
        return Star;
      case 'rommz_plus':
        return Crown;
      default:
        return Star;
    }
  };

  const getCurrentPrice = () => {
    if (!rommzPlusPlan) return 49_000;
    return billingCycle === 'monthly'
      ? rommzPlusPlan.price
      : (rommzPlusPlan.quarterlyPrice || 119_000);
  };

  const getSavings = () => {
    if (!rommzPlusPlan) return 0;
    const monthlyTotal = rommzPlusPlan.price * 3;
    const quarterlyPrice = rommzPlusPlan.quarterlyPrice || 119_000;
    return monthlyTotal - quarterlyPrice;
  };

  const remainingSlots = promoStatus
    ? (promoStatus.totalSlots ?? 0) - (promoStatus.claimedSlots ?? 0)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pb-6 pt-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Chào mừng đến với RommZ+</h2>
            <p className="mb-6 text-gray-600">
              Tài khoản của bạn đã được nâng cấp thành công. Bạn có thể quay lại tìm phòng, mở khóa roommate và dùng deal premium ngay bây giờ.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/profile')} className="w-full">
                Xem hồ sơ của tôi
              </Button>
              <Button variant="outline" onClick={() => navigate('/search')} className="w-full">
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
      <div className="sticky top-0 z-40 border-b border-border bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-3">
            <h1 className="text-lg font-semibold">Nâng cấp tài khoản</h1>
            <p className="text-sm text-gray-500">Chọn gói phù hợp với nhu cầu tìm phòng và roommate của bạn</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Crown className="h-4 w-4" />
            Nâng cấp ngay hôm nay
          </div>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">
            Mở khóa các quyền lợi cốt lõi với RommZ+
          </h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            RommZ+ tập trung vào những gì đang chạy thật: roommate không giới hạn, contact mạnh hơn, favorites không giới hạn và deal Premium của Local Passport.
          </p>
        </div>

        {remainingSlots > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-white shadow-lg">
              <Flame className="h-5 w-5" />
              <span className="font-medium">
                Chỉ còn <strong>{remainingSlots}</strong> slot giá 24.500đ
              </span>
            </div>
          </div>
        )}

        <div className="mb-8 flex justify-center">
          <div className="flex rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tháng {rommzPlusPlan?.price?.toLocaleString('vi-VN')}đ
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`flex items-center gap-1 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingCycle === 'quarterly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Quý {(rommzPlusPlan?.quarterlyPrice || 119_000).toLocaleString('vi-VN')}đ
              <Badge variant="secondary" className="bg-green-100 text-xs text-green-700">
                Tiết kiệm 19%
              </Badge>
            </button>
          </div>
        </div>

        {subscription && (
          <div className="mb-6 flex justify-center">
            <Badge className="border-green-300 bg-green-100 px-4 py-2 text-green-700">
              <Shield className="mr-2 h-4 w-4" />
              Đang sử dụng: {PLANS.find((plan) => plan.id === subscription.plan)?.name}
            </Badge>
          </div>
        )}

        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = subscription?.plan === plan.id;
            const isProcessing = processingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.recommended ? 'scale-105 border-2 border-primary shadow-lg md:scale-110' : ''
                }`}
              >
                {plan.recommended && (
                  <div className="absolute left-0 right-0 top-0 bg-primary py-1 text-center text-sm font-medium text-white">
                    Phổ biến nhất
                  </div>
                )}
                <CardHeader className={plan.recommended ? 'pt-10' : ''}>
                  <div className="mb-2 flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        plan.recommended ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className={plan.recommended && billingCycle === 'quarterly' ? 'font-medium text-green-600' : ''}>
                        {plan.recommended ? (
                          <>
                            {billingCycle === 'monthly'
                              ? `${getCurrentPrice().toLocaleString('vi-VN')}đ/tháng`
                              : `${Math.floor((rommzPlusPlan?.quarterlyPrice || 119_000) / 3).toLocaleString('vi-VN')}đ/tháng`}
                            {billingCycle === 'quarterly' && (
                              <span className="ml-1 text-xs font-normal text-gray-500">
                                ({rommzPlusPlan?.quarterlyPrice?.toLocaleString('vi-VN')}đ/quý)
                              </span>
                            )}
                          </>
                        ) : (
                          plan.priceDisplay
                        )}
                      </CardDescription>
                      {plan.recommended && billingCycle === 'quarterly' && (
                        <span className="text-xs font-medium text-green-600">
                          Tiết kiệm {getSavings().toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isProcessing}
                    className={`w-full rounded-full ${plan.recommended ? 'bg-primary hover:bg-primary/90' : ''}`}
                    variant={plan.recommended ? 'default' : 'outline'}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Gói hiện tại
                      </>
                    ) : plan.id === 'free' ? (
                      'Miễn phí'
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Nâng cấp ngay
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-gray-500">Thanh toán an toàn</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Secure</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Hủy bất cứ lúc nào. Không cam kết dài hạn.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Tôi có thể hủy đăng ký bất cứ lúc nào không?',
                a: 'Có. Bạn có thể hủy bất cứ lúc nào và quyền lợi RommZ+ sẽ tiếp tục cho đến hết chu kỳ đã thanh toán.',
              },
              {
                q: 'Có trial miễn phí không?',
                a: 'Hiện tại chưa có trial miễn phí. Bạn vẫn có thể bắt đầu theo tháng và theo dõi mức dùng thực tế của các quyền lợi premium.',
              },
              {
                q: 'Thanh toán có an toàn không?',
                a: 'Mọi giao dịch đều đi qua luồng thanh toán bảo mật. RommZ không lưu thông tin thẻ ngân hàng của bạn.',
              },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardContent className="pt-4">
                  <h3 className="mb-2 font-medium">{faq.q}</h3>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {qrModalData && (
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
      )}
    </div>
  );
}
