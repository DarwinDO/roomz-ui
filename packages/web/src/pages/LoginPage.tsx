import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Mail, ShieldCheck, Users, RefreshCw, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import RommzLogo from "@/assets/logo/rommz-logo.png";
import { GoogleIcon } from "@/components/icons";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

const REMEMBER_ME_KEY = 'rommz_remembered_email';

// Skeleton Components
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
);

const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-12 w-full" />
  </div>
);

const FeatureItemSkeleton = () => (
  <div className="flex items-center gap-3">
    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-56" />
    </div>
  </div>
);

const LoginSkeleton = () => (
  <div className="space-y-4">
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-12 w-full" />
    <div className="relative my-6">
      <Separator />
      <Skeleton className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-32 bg-card" />
    </div>
    <Skeleton className="h-12 w-full" />
  </div>
);

const SignupSkeleton = () => (
  <div className="space-y-4">
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-12 w-full" />
    <div className="relative my-6">
      <Separator />
      <Skeleton className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-32 bg-card" />
    </div>
    <Skeleton className="h-12 w-full" />
  </div>
);

const LeftPanelSkeleton = () => (
  <div className="text-center md:text-left space-y-6">
    <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
      <Skeleton className="h-12 md:h-14 w-32" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 md:w-80" />
      <Skeleton className="h-8 w-48 md:w-64" />
      <Skeleton className="h-16 w-full max-w-md" />
    </div>
    <div className="space-y-4 pt-4">
      <FeatureItemSkeleton />
      <FeatureItemSkeleton />
      <FeatureItemSkeleton />
    </div>
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Get the page user was trying to access before being redirected to login
  const savedPath = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // Paths that require landlord role - should not redirect here for non-landlords
  const landlordOnlyPaths = ['/landlord', '/post-room'];
  const isLandlordPath = savedPath && landlordOnlyPaths.some(p => savedPath.startsWith(p));

  // Default redirect for regular users
  const defaultPath = '/search';

  // Loading state for initial page load
  const [isLoading, setIsLoading] = useState(true);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Load remembered email on mount and simulate loading
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
    // Simulate initial loading for skeleton demonstration
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { user } = await signIn(loginEmail, loginPassword);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, loginEmail);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      // Fetch user profile to get role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      // Role-based redirect logic
      if (profile?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile?.role === 'landlord') {
        // Landlord can access landlord paths
        navigate(savedPath || defaultPath, { replace: true });
      } else {
        // Non-landlord users: don't redirect to landlord-only paths
        const targetPath = isLandlordPath ? defaultPath : (savedPath || defaultPath);
        navigate(targetPath, { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Validate confirm password
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Mật khẩu xác nhận không khớp');
      return;
    }

    setSignupLoading(true);

    try {
      const { user } = await signUp(signupEmail, signupPassword, {
        full_name: signupName,
      });

      // Check if email confirmation is required
      if (user && !user.email_confirmed_at) {
        // Email chưa được xác nhận -> redirect to verify page
        navigate('/verify-email', { replace: true });
      } else {
        // Email đã được xác nhận (auto-confirm enabled) -> redirect to default page
        navigate(savedPath || defaultPath, { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng ký thất bại';
      setSignupError(errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập Google thất bại';
      setLoginError(errorMessage);
    }
  };

  // Animation variants
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
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const formFieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const errorVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.15,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-accent/30 to-background flex items-center justify-center p-4"
    >
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Side - Branding */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LeftPanelSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center md:text-left space-y-6"
            >
              <motion.div variants={itemVariants} className="flex items-center justify-center md:justify-start gap-3 mb-6">
                <img src={RommzLogo} alt="rommz" className="h-12 md:h-14 w-auto object-contain" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Tìm ngôi nhà an toàn
                  <br />
                  <span className="text-primary">và thân thiện tiếp theo.</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Phòng đã xác thực, bạn cùng phòng phù hợp, thuê linh hoạt — tất cả trong một nền tảng.
                </p>
              </motion.div>

              {/* Feature Highlights */}
              <motion.div variants={containerVariants} className="space-y-4 pt-4">
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Phòng & Chủ nhà được xác thực</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Mọi tin đăng được xác thực để đảm bảo an toàn</p>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Kết nối thông minh</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Tìm bạn cùng phòng phù hợp với lối sống của bạn</p>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">SwapRoom linh hoạt</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Cho thuê ngắn hạn dễ dàng</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        >
          <Card className="p-8 rounded-2xl shadow-soft-lg border border-border bg-card">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="signup">Đăng ký</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" className="space-y-4" asChild>
                  <motion.div
                    key="login"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {isLoading ? (
                      <LoginSkeleton />
                    ) : (
                      <form onSubmit={handleLogin} className="space-y-4" noValidate>
                        <AnimatePresence mode="wait">
                          {loginError && (
                            <motion.div
                              key="login-error"
                              variants={errorVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="bg-destructive/5 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span className="text-sm">{loginError}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0 }} className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="email@example.com"
                            className="rounded-xl h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                            autoFocus
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="space-y-2">
                          <Label htmlFor="login-password">Mật khẩu</Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              type={showLoginPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="rounded-xl h-12 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              required
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="flex items-center justify-between text-sm">
                          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                            <input
                              type="checkbox"
                              className="rounded transition-all duration-200"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Ghi nhớ đăng nhập</span>
                          </label>
                          <Link to="/forgot-password" className="text-primary hover:underline transition-all duration-200">
                            Quên mật khẩu?
                          </Link>
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
                          <motion.div whileHover={{ scale: loginLoading ? 1 : 1.02 }} whileTap={{ scale: loginLoading ? 1 : 0.98 }}>
                            <Button
                              type="submit"
                              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl touch-target transition-all duration-200"
                              disabled={loginLoading}
                            >
                              {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </Button>
                          </motion.div>
                        </motion.div>

                        <div className="relative my-6">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                            hoặc tiếp tục với
                          </span>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          variants={formFieldVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: 0.2 }}
                          className="grid grid-cols-1 gap-3"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-xl border-border hover:bg-muted transition-all duration-200"
                            onClick={handleGoogleLogin}
                          >
                            <GoogleIcon className="w-5 h-5 mr-2" />
                            Google
                          </Button>
                        </motion.div>
                      </form>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4" asChild>
                  <motion.div
                    key="signup"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {isLoading ? (
                      <SignupSkeleton />
                    ) : (
                      <form onSubmit={handleSignup} className="space-y-4" noValidate>
                        <AnimatePresence mode="wait">
                          {signupError && (
                            <motion.div
                              key="signup-error"
                              variants={errorVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="bg-destructive/5 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span className="text-sm">{signupError}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0 }} className="space-y-2">
                          <Label htmlFor="signup-name">Họ và tên</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="rounded-xl h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                            autoFocus
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="email@example.com"
                            className="rounded-xl h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="space-y-2">
                          <Label htmlFor="signup-password">Mật khẩu</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showSignupPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="rounded-xl h-12 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showSignupPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>
                          <PasswordStrengthIndicator password={signupPassword} />
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="space-y-2">
                          <Label htmlFor="signup-confirm-password">Xác nhận lại mật khẩu</Label>
                          <div className="relative">
                            <Input
                              id="signup-confirm-password"
                              type={showSignupConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="rounded-xl h-12 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showSignupConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="flex items-start gap-2 text-sm">
                          <input type="checkbox" className="rounded mt-1 transition-all duration-200" required />
                          <span className="text-muted-foreground">
                            Tôi đồng ý với{" "}
                            <Link to="/terms" className="text-primary hover:underline transition-all duration-200">
                              Điều khoản dịch vụ
                            </Link>{" "}
                            và{" "}
                            <Link to="/privacy" className="text-primary hover:underline transition-all duration-200">
                              Chính sách bảo mật
                            </Link>{" "}
                            của rommz
                          </span>
                        </motion.div>

                        <motion.div variants={formFieldVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
                          <motion.div whileHover={{ scale: signupLoading ? 1 : 1.02 }} whileTap={{ scale: signupLoading ? 1 : 0.98 }}>
                            <Button
                              type="submit"
                              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl touch-target transition-all duration-200"
                              disabled={signupLoading}
                            >
                              {signupLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                            </Button>
                          </motion.div>
                        </motion.div>

                        <div className="relative my-6">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                            hoặc đăng ký với
                          </span>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          variants={formFieldVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: 0.3 }}
                          className="grid grid-cols-1 gap-3"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-xl border-border hover:bg-muted transition-all duration-200"
                            onClick={handleGoogleLogin}
                          >
                            <GoogleIcon className="w-5 h-5 mr-2" />
                            Google
                          </Button>
                        </motion.div>
                      </form>
                    )}
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
