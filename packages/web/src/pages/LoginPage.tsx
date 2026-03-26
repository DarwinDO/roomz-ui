import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { createPublicMotion } from "@/lib/motion";
import { supabase } from "@/lib/supabase";
import { stitchAssets } from "@/lib/stitchAssets";
import { useThreePilotEnabled } from "@/lib/threePilot";

const LoginHeroPilot3D = lazy(() =>
  import("@/components/3d/HeroAccentPilot").then((module) => ({
    default: module.LoginHeroPilot3D,
  })),
);

const REMEMBER_ME_KEY = "rommz_remembered_email";
const PUBLIC_AUTH_REDIRECT_KEY = "rommz_public_auth_redirect";
const OTP_LENGTH = 6;

type AuthStep = "email" | "otp";
type UserRole = "admin" | "landlord" | "student" | "renter" | null;

function getPublicRedirectPath(savedPath?: string) {
  return savedPath || "/search";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const canRenderThreePilot = useThreePilotEnabled({
    enabled: !shouldReduceMotion,
    minWidth: 1100,
  });
  const motionTokens = useMemo(
    () => createPublicMotion(!!shouldReduceMotion),
    [shouldReduceMotion],
  );
  const { sendEmailOtp, signInWithGoogle, verifyEmailOtp } = useAuth();

  const savedPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  const redirectPath = useMemo(() => getPublicRedirectPath(savedPath), [savedPath]);
  const landlordOnlyPaths = ["/host", "/landlord", "/post-room"];
  const isLandlordPath =
    !!savedPath && landlordOnlyPaths.some((path) => savedPath.startsWith(path));

  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
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
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.role as UserRole) ?? null;
  };

  const completePublicLogin = async (userId: string) => {
    const role = await getRole(userId);

    if (role === "admin") {
      await supabase.auth.signOut();
      localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);
      throw new Error("Tài khoản này chỉ đăng nhập ở khu vực quản trị.");
    }

    persistRememberedEmail();
    localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);

    if (role === "landlord") {
      navigate(redirectPath, { replace: true });
      return;
    }

    navigate(isLandlordPath ? "/search" : redirectPath, { replace: true });
  };

  const sendOtp = async () => {
    const normalizedEmail = email.trim();
    setErrorMessage("");
    setStatusMessage("");
    setIsSendingOtp(true);

    try {
      await sendEmailOtp(normalizedEmail);
      setAuthStep("otp");
      setOtpCode("");
      setOtpCountdown(60);
      setStatusMessage(`Mã đăng nhập đã được gửi tới ${normalizedEmail}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể gửi mã đăng nhập",
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsVerifyingOtp(true);

    try {
      const { user } = await verifyEmailOtp(email.trim(), otpCode.trim());
      await completePublicLogin(user.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể xác thực mã đăng nhập",
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setStatusMessage("");
    setIsGoogleLoading(true);
    localStorage.setItem(PUBLIC_AUTH_REDIRECT_KEY, redirectPath);

    try {
      await signInWithGoogle();
    } catch (error) {
      localStorage.removeItem(PUBLIC_AUTH_REDIRECT_KEY);
      setErrorMessage(error instanceof Error ? error.message : "Đăng nhập Google thất bại");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div lang="vi" className="flex min-h-screen items-center justify-center bg-background px-4 py-4 md:p-6 xl:p-8">
      <a href="#login-main" className="skip-link">
        Bỏ qua đến form đăng nhập
      </a>
      <main
        id="login-main"
        className="stitch-editorial-shadow grid min-h-[870px] w-full max-w-7xl overflow-hidden rounded-[32px] bg-surface-container-lowest lg:grid-cols-[minmax(420px,0.92fr)_minmax(0,1.08fr)]"
      >
        <motion.section
          className="relative hidden flex-col justify-between overflow-hidden bg-surface-container-low p-12 lg:flex xl:p-16"
          initial="hidden"
          animate="show"
          variants={motionTokens.revealScale(20)}
        >
          <div className="absolute -right-[10%] top-[-10%] h-96 w-96 rounded-full bg-primary-container/20 blur-3xl" />
          <div className="absolute -bottom-[5%] left-[-5%] h-80 w-80 rounded-full bg-tertiary-container/30 blur-3xl" />

          <div className="relative z-10">
            <h1 className="font-display text-3xl font-black tracking-tighter text-foreground">
              RommZ
            </h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-primary">
              Find your sanctuary
            </p>
          </div>

          <motion.div
            className="relative z-10 max-w-[34rem] space-y-8"
            variants={motionTokens.stagger(0.08, 0.08)}
          >
            <div className="relative">
              <motion.div
                className="stitch-editorial-shadow aspect-[4/5] max-w-[28rem] overflow-hidden rounded-[32px] xl:max-w-[30rem]"
                variants={motionTokens.revealScale(18)}
              >
                {!canRenderThreePilot ? (
                <img
                  src={stitchAssets.login.heroRoom}
                  alt="Không gian sống hiện đại của RommZ"
                  className="h-full w-full object-cover transition-transform duration-1000 hover:scale-100"
                />
                ) : null}
              </motion.div>
              {canRenderThreePilot ? (
                <div className="absolute inset-0">
                  <Suspense fallback={null}>
                    <LoginHeroPilot3D />
                  </Suspense>
                </div>
              ) : null}

              <motion.div
                className="stitch-editorial-shadow absolute -bottom-8 -right-4 max-w-[13.5rem] rounded-[24px] border border-white/40 bg-white/76 p-5 backdrop-blur-xl xl:-bottom-10 xl:-right-8 xl:max-w-[14rem] xl:p-6"
                variants={motionTokens.reveal(16, 0.08)}
              >
                <Sparkles className="mb-4 h-6 w-6 text-primary" />
                <h3 className="text-lg leading-8">
                  Bắt đầu lại từ một nơi ở bạn thực sự muốn quay về.
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Tìm phòng, ghép bạn ở và quay lại đúng hành trình bạn đang theo dõi.
                </p>
              </motion.div>
            </div>
          </motion.div>

          <p className="relative z-10 text-sm text-muted-foreground">
            © 2026 RommZ. All rights reserved.
          </p>
        </motion.section>

        <motion.section
          className="flex flex-col justify-center bg-surface-container-lowest px-8 py-12 lg:px-14 xl:px-24"
          initial="hidden"
          animate="show"
          variants={motionTokens.reveal(24, 0.05)}
        >
          <motion.div
            className="mx-auto w-full max-w-md"
            variants={motionTokens.stagger(0.08, 0.04)}
          >
            <div className="mb-12">
              <h2 className="mb-4 text-4xl">
                {authStep === "email" ? "Chào mừng quay lại" : "Xác thực email của bạn"}
              </h2>
              <p className="text-muted-foreground">
                {authStep === "email"
                  ? "Truy cập lại hành trình tìm phòng và kết nối với cộng đồng RommZ."
                  : `Nhập mã gồm ${OTP_LENGTH} chữ số đã gửi tới ${email.trim()}.`}
              </p>
            </div>

            <div className="mb-10 grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.currentTarget.blur();
                  }
                }}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-3 rounded-full bg-surface-container px-4 py-3 transition-colors hover:bg-surface-container-high"
                whileHover={motionTokens.hoverSoft}
                whileTap={motionTokens.tap}
              >
                <GoogleIcon className="h-5 w-5" />
                <span className="font-label text-sm font-semibold text-foreground">Google</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={sendOtp}
                disabled={isSendingOtp || email.trim().length === 0}
                className="flex items-center justify-center gap-3 rounded-full bg-surface-container px-4 py-3 transition-colors hover:bg-surface-container-high"
                whileHover={motionTokens.hoverSoft}
                whileTap={motionTokens.tap}
              >
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-label text-sm font-semibold text-foreground">OTP email</span>
              </motion.button>
            </div>

            <div className="relative mb-10 flex items-center justify-center">
              <Separator />
              <span className="absolute bg-card px-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Hoặc tiếp tục với email
              </span>
            </div>

            {errorMessage ? (
              <div className="mb-6 rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm leading-6">{errorMessage}</p>
                </div>
              </div>
            ) : null}

            {statusMessage ? (
              <div className="mb-6 rounded-[24px] border border-primary/10 bg-surface-container-low p-4">
                <div className="flex items-start gap-3 text-foreground">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6">{statusMessage}</p>
                </div>
              </div>
            ) : null}

            {authStep === "email" ? (
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendOtp();
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="identifier" className="ml-1 text-sm font-bold text-muted-foreground">
                    Email
                  </label>
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="identifier"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      aria-label="Email dang nhap"
                      placeholder="alex@example.com"
                      className="h-14 rounded-full border-transparent bg-surface-container-low pl-12 pr-4 text-base shadow-none focus-visible:border-primary/20 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-primary/5"
                      autoFocus
                    />
                  </div>
                </div>

                <label htmlFor="remember" className="ml-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-5 w-5 rounded-md border-outline-variant text-primary"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Giữ email này trên thiết bị
                </label>

                <motion.button
                  type="submit"
                  disabled={isSendingOtp || email.trim().length === 0}
                  className="stitch-primary-gradient mt-4 w-full rounded-full px-6 py-5 font-display text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
                  whileHover={motionTokens.hoverSoft}
                  whileTap={motionTokens.tap}
                >
                  {isSendingOtp ? "Đang gửi mã..." : "Nhận mã OTP để đăng nhập"}
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="otp-email" className="ml-1 text-sm font-bold text-muted-foreground">
                    Email
                  </label>
                  <Input
                    id="otp-email"
                    type="email"
                    value={email}
                    aria-label="Email nhan ma OTP"
                    disabled
                    className="h-14 rounded-full border-transparent bg-surface-container-low pl-5 pr-4 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="otp-code" className="ml-1 text-sm font-bold text-muted-foreground">
                    Mã xác thực
                  </label>
                  <div className="rounded-[28px] bg-surface-container-low p-4">
                    <InputOTP
                      id="otp-code"
                      maxLength={OTP_LENGTH}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                      aria-label="Ma xac thuc gom sau chu so"
                      containerClassName="justify-center"
                      autoFocus
                    >
                      <InputOTPGroup aria-label="Nhom nhap ma OTP">
                        {Array.from({ length: OTP_LENGTH }, (_, index) => (
                          <InputOTPSlot
                            key={index}
                            id={`otp-slot-${index}`}
                            aria-label={`Chu so OTP ${index + 1}`}
                            index={index}
                            className="h-12 w-10 rounded-[18px] border border-border bg-white text-base sm:w-12 sm:text-lg"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep("email");
                      setOtpCode("");
                      setErrorMessage("");
                      setStatusMessage("");
                    }}
                    className="text-primary transition-colors hover:opacity-80"
                  >
                    Đổi email
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendOtp()}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    className="text-primary transition-colors hover:opacity-80 disabled:text-muted-foreground"
                  >
                    {otpCountdown > 0 ? `Gửi lại sau ${otpCountdown}s` : "Gửi lại mã"}
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== OTP_LENGTH}
                  className="stitch-primary-gradient w-full rounded-full px-6 py-5 font-display text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
                  whileHover={motionTokens.hoverSoft}
                  whileTap={motionTokens.tap}
                >
                  {isVerifyingOtp ? "Đang xác thực..." : "Đăng nhập vào RommZ"}
                </motion.button>
              </form>
            )}

            <div className="mt-8 rounded-[24px] bg-surface-container-low p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] bg-white text-primary stitch-editorial-shadow">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bảo mật rõ ràng, không thừa ma sát
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Không cần nhớ thêm mật khẩu. RommZ dùng OTP và Google để đưa bạn về
                    đúng route đang tiếp tục.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-10 text-center text-sm leading-7 text-muted-foreground">
              Lần đầu dùng RommZ? Chỉ cần xác thực bằng OTP hoặc Google, hồ sơ sẽ được tạo sau
              khi bạn đăng nhập thành công.
            </p>
          </motion.div>
        </motion.section>
      </main>

      <motion.button
        type="button"
        onClick={() => navigate("/support-services")}
        className="stitch-editorial-shadow fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary transition-transform hover:scale-110"
        initial="hidden"
        animate="show"
        variants={motionTokens.revealScale(16, 0.98, 0.2)}
        whileHover={motionTokens.hoverSoft}
        whileTap={motionTokens.tap}
        aria-label="Cần trợ giúp"
      >
        <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  );
}
