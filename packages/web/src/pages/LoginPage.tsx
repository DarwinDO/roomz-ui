import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Mail, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import RommzLogo from '@/assets/logo/rommz-logo.png';

const REMEMBER_ME_KEY = 'rommz_remembered_email';
const PUBLIC_AUTH_REDIRECT_KEY = 'rommz_public_auth_redirect';
const OTP_LENGTH = 6;

type AuthStep = 'email' | 'otp';

type UserRole = 'admin' | 'landlord' | 'student' | 'renter' | null;

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
);

const LoginSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-4 w-36" />
    <Skeleton className="h-12 w-full" />
    <div className="relative my-6">
      <Separator />
      <Skeleton className="absolute left-1/2 top-1/2 h-4 w-32 -translate-x-1/2 -translate-y-1/2 bg-card" />
    </div>
    <Skeleton className="h-12 w-full" />
  </div>
);

const LeftPanelSkeleton = () => (
  <div className="space-y-6 text-center md:text-left">
    <div className="mb-6 flex items-center justify-center gap-3 md:justify-start">
      <Skeleton className="h-12 w-32 md:h-14" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 md:w-80" />
      <Skeleton className="h-8 w-48 md:w-64" />
      <Skeleton className="h-16 w-full max-w-md" />
    </div>
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
    </div>
  </div>
);

function getPublicRedirectPath(savedPath?: string) {
  return savedPath || '/search';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendEmailOtp, signInWithGoogle, verifyEmailOtp } = useAuth();

  const savedPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  const landlordOnlyPaths = ['/host', '/landlord', '/post-room'];
  const isLandlordPath = !!savedPath && landlordOnlyPaths.some((path) => savedPath.startsWith(path));
  const redirectPath = useMemo(() => getPublicRedirectPath(savedPath), [savedPath]);

  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) {
      return;
    }

    const timer = setTimeout(() => setOtpCountdown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const persistRememberedEmail = () => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, email.trim());
      return;
    }

    localStorage.removeItem(REMEMBER_ME_KEY);
  };

  const getRole = async (userId: string): Promise<UserRole> => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.role as UserRole) ?? null;
  };

  const completePublicLogin = async (userId: string) => {
    const role = await getRole(userId);

    if (role === 'admin') {
      await supabase.auth.signOut();
      localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);
      throw new Error('Tài khoản quản trị vui lòng đăng nhập tại trang admin.');
    }

    persistRememberedEmail();
    localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);

    if (role === 'landlord') {
      navigate(redirectPath, { replace: true });
      return;
    }

    const targetPath = isLandlordPath ? '/search' : redirectPath;
    navigate(targetPath, { replace: true });
  };

  const sendOtp = async () => {
    const normalizedEmail = email.trim();
    setErrorMessage('');
    setStatusMessage('');
    setIsSendingOtp(true);

    try {
      await sendEmailOtp(normalizedEmail);
      setAuthStep('otp');
      setOtpCode('');
      setOtpCountdown(60);
      setStatusMessage(`Mã đăng nhập đã được gửi tới ${normalizedEmail}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi mã đăng nhập';
      setErrorMessage(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendOtp();
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setIsVerifyingOtp(true);

    try {
      const { user } = await verifyEmailOtp(email.trim(), otpCode.trim());
      await completePublicLogin(user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xác thực mã đăng nhập';
      setErrorMessage(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) {
      return;
    }

    await sendOtp();
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setIsGoogleLoading(true);
    localStorage.setItem(PUBLIC_AUTH_REDIRECT_KEY, redirectPath);

    try {
      await signInWithGoogle();
    } catch (error) {
      localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);
      const message = error instanceof Error ? error.message : 'Đăng nhập Google thất bại';
      setErrorMessage(message);
      setIsGoogleLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setAuthStep('email');
    setOtpCode('');
    setErrorMessage('');
    setStatusMessage('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="left-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LeftPanelSkeleton />
            </motion.div>
          ) : (
            <motion.div key="left-content" variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 text-center md:text-left">
              <motion.div variants={itemVariants} className="mb-6 flex items-center justify-center gap-3 md:justify-start">
                <img src={RommzLogo} alt="rommz" className="h-12 w-auto object-contain md:h-14" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">
                  Tìm ngôi nhà an toàn
                  <br />
                  <span className="text-primary">và thân thiện tiếp theo.</span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  Phòng đã xác thực, bạn cùng phòng phù hợp, thuê linh hoạt - tất cả trong một nền tảng.
                </p>
              </motion.div>

              <motion.div variants={containerVariants} className="space-y-4 pt-4">
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Phòng và chủ nhà được xác thực</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">Mọi tin đăng đều được xác thực để đảm bảo an toàn.</p>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                    <Users className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Kết nối thông minh</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">Tìm bạn cùng phòng phù hợp với lối sống của bạn.</p>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Đăng nhập nhanh gọn</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">Không cần mật khẩu, chỉ cần Google hoặc mã OTP từ email.</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}>
          <Card className="rounded-2xl border border-border bg-card p-8 shadow-soft-lg">
            <div className="mb-6 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {authStep === 'email' ? 'Đăng nhập bằng email' : 'Nhập mã OTP'}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {authStep === 'email'
                  ? 'Nhập email để nhận mã đăng nhập. Nếu chưa có tài khoản, hệ thống sẽ tạo sau khi xác thực.'
                  : `Nhập mã gồm ${OTP_LENGTH} chữ số đã gửi tới ${email.trim()}.`}
              </p>
            </div>

            {isLoading ? (
              <LoginSkeleton />
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {errorMessage && (
                    <motion.div key="login-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {statusMessage && (
                    <motion.div key="login-status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{statusMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {authStep === 'email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@example.com"
                        className="h-12 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                      <span>Ghi nhớ email này trên thiết bị này</span>
                    </label>

                    <Button type="submit" className="h-12 w-full rounded-xl bg-primary hover:bg-primary/90" disabled={isSendingOtp || email.trim().length === 0}>
                      {isSendingOtp ? 'Đang gửi mã...' : 'Gửi mã đăng nhập'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email</Label>
                      <Input id="otp-email" type="email" value={email} className="h-12 rounded-xl" disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp-code">Mã OTP</Label>
                      <div className="rounded-xl border border-border p-3">
                        <InputOTP
                          id="otp-code"
                          maxLength={OTP_LENGTH}
                          autoComplete="one-time-code"
                          value={otpCode}
                          onChange={(value) => setOtpCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                          containerClassName="justify-center"
                          className="w-full"
                          autoFocus
                        >
                          <InputOTPGroup>
                            {Array.from({ length: OTP_LENGTH }, (_, index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className="h-12 w-10 rounded-md border text-base sm:w-12 sm:text-lg"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <button type="button" onClick={handleChangeEmail} className="text-primary transition-colors hover:underline">
                        Đổi email
                      </button>
                      <button type="button" onClick={handleResendOtp} disabled={otpCountdown > 0 || isSendingOtp} className="text-primary transition-colors hover:underline disabled:text-muted-foreground disabled:no-underline">
                        {otpCountdown > 0 ? `Gửi lại sau ${otpCountdown}s` : 'Gửi lại mã'}
                      </button>
                    </div>

                    <Button type="submit" className="h-12 w-full rounded-xl bg-primary hover:bg-primary/90" disabled={isVerifyingOtp || otpCode.length !== OTP_LENGTH}>
                      {isVerifyingOtp ? 'Đang xác thực...' : 'Xác thực và đăng nhập'}
                    </Button>
                  </form>
                )}

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                    hoặc tiếp tục với
                  </span>
                </div>

                <Button type="button" variant="outline" className="h-12 w-full rounded-xl border-border hover:bg-muted" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                  <GoogleIcon className="mr-2 h-5 w-5" />
                  {isGoogleLoading ? 'Đang chuyển hướng...' : 'Google'}
                </Button>

                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <p>Bạn lần đầu sử dụng? Hệ thống sẽ tạo tài khoản sau khi xác thực thành công.</p>
                  <p>
                    Tài khoản quản trị?{' '}
                    <Link to="/admin/login" className="text-primary hover:underline">
                      Đăng nhập bằng mật khẩu tại đây
                    </Link>
                    .
                  </p>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
