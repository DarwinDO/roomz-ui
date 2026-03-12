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
      toast.error('Vui l?ng ??ng nh?p ?? ??ng k?');
      navigate('/login');
      return;
    }

    if (plan === 'free') {
      toast.info('B?n ?ang s? d?ng g?i mi?n ph?');
      return;
    }

    setProcessingPlan(plan);
    try {
      await createCheckout(plan, billingCycle, remainingSlots > 0);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Kh?ng th? t?o phi?n thanh to?n. Vui l?ng th? l?i.');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handlePaymentSuccess = () => {
    setQrModalData(null);
    setShowSuccess(true);
    toast.success('Thanh to?n th?nh c?ng. Ch?o m?ng b?n ??n v?i RommZ+.');

    if (user) {
      void getUserSubscription(user.id).then(setSubscription);
    }
  };

  const handleRegenerateCheckout = async () => {
    if (!qrModalData) return;

    if (!user) {
      toast.error('Vui l?ng ??ng nh?p l?i ?? ti?p t?c thanh to?n.');
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
            <h2 className="mb-2 text-2xl font-bold">Ch?o m?ng ??n v?i RommZ+</h2>
            <p className="mb-6 text-gray-600">
              T?i kho?n c?a b?n ?? ???c n?ng c?p th?nh c?ng. B?n c? th? quay l?i t?m ph?ng, m? kh?a roommate v? d?ng deal premium ngay b?y gi?.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/profile')} className="w-full">
                Xem h? s? c?a t?i
              </Button>
              <Button variant="outline" onClick={() => navigate('/search')} className="w-full">
                T?m ph?ng ngay
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
            <h1 className="text-lg font-semibold">N?ng c?p t?i kho?n</h1>
            <p className="text-sm text-gray-500">Ch?n g?i ph? h?p v?i nhu c?u t?m ph?ng v? roommate c?a b?n</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Crown className="h-4 w-4" />
            N?ng c?p ngay h?m nay
          </div>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">
            M? kh?a c?c quy?n l?i c?t l?i v?i RommZ+
          </h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            RommZ+ t?p trung v?o nh?ng g? ?ang ch?y th?t: roommate kh?ng gi?i h?n, contact m?nh h?n, favorites kh?ng gi?i h?n v? deal Premium c?a Local Passport.
          </p>
        </div>

        {remainingSlots > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-white shadow-lg">
              <Flame className="h-5 w-5" />
              <span className="font-medium">
                Ch? c?n <strong>{remainingSlots}</strong> slot gi? 24.500?
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
              Th?ng {rommzPlusPlan?.price?.toLocaleString('vi-VN')}?
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`flex items-center gap-1 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingCycle === 'quarterly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Qu? {(rommzPlusPlan?.quarterlyPrice || 119_000).toLocaleString('vi-VN')}?
              <Badge variant="secondary" className="bg-green-100 text-xs text-green-700">
                Ti?t ki?m 19%
              </Badge>
            </button>
          </div>
        </div>

        {subscription && (
          <div className="mb-6 flex justify-center">
            <Badge className="border-green-300 bg-green-100 px-4 py-2 text-green-700">
              <Shield className="mr-2 h-4 w-4" />
              ?ang s? d?ng: {PLANS.find((plan) => plan.id === subscription.plan)?.name}
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
                    Ph? bi?n nh?t
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
                              ? `${getCurrentPrice().toLocaleString('vi-VN')}?/th?ng`
                              : `${Math.floor((rommzPlusPlan?.quarterlyPrice || 119_000) / 3).toLocaleString('vi-VN')}?/th?ng`}
                            {billingCycle === 'quarterly' && (
                              <span className="ml-1 text-xs font-normal text-gray-500">
                                ({rommzPlusPlan?.quarterlyPrice?.toLocaleString('vi-VN')}?/qu?)
                              </span>
                            )}
                          </>
                        ) : (
                          plan.priceDisplay
                        )}
                      </CardDescription>
                      {plan.recommended && billingCycle === 'quarterly' && (
                        <span className="text-xs font-medium text-green-600">
                          Ti?t ki?m {getSavings().toLocaleString('vi-VN')}?
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
                        ?ang x? l?...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        G?i hi?n t?i
                      </>
                    ) : plan.id === 'free' ? (
                      'Mi?n ph?'
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        N?ng c?p ngay
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-gray-500">Thanh to?n an to?n</p>
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
            H?y b?t c? l?c n?o. Kh?ng cam k?t d?i h?n.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">C?u h?i th??ng g?p</h2>
          <div className="space-y-4">
            {[
              {
                q: 'T?i c? th? h?y ??ng k? b?t c? l?c n?o kh?ng?',
                a: 'C?. B?n c? th? h?y b?t c? l?c n?o v? quy?n l?i RommZ+ s? ti?p t?c cho ??n h?t chu k? ?? thanh to?n.',
              },
              {
                q: 'C? trial mi?n ph? kh?ng?',
                a: 'Hi?n t?i ch?a c? trial mi?n ph?. B?n v?n c? th? b?t ??u theo th?ng v? theo d?i m?c d?ng th?c t? c?a c?c quy?n l?i premium.',
              },
              {
                q: 'Thanh to?n c? an to?n kh?ng?',
                a: 'M?i giao d?ch ??u ?i qua lu?ng thanh to?n b?o m?t. RommZ kh?ng l?u th?ng tin th? ng?n h?ng c?a b?n.',
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
