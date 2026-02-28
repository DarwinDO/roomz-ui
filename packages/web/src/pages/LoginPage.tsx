import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Mail, ShieldCheck, Users, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import RommzLogo from "@/assets/logo/rommz-logo.png";

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

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { user } = await signIn(loginEmail, loginPassword);

      // Fetch user profile to get role
      const { data: profile } = await (await import('@/lib/supabase')).supabase
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
    } catch (error: any) {
      setSignupError(error.message || 'Đăng ký thất bại');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setLoginError(error.message || 'Đăng nhập Google thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 lg:gap-12 items-center animate-fade-in">
        {/* Left Side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
            <img src={RommzLogo} alt="rommz" className="h-12 md:h-14 w-auto object-contain" />
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              Tìm ngôi nhà an toàn
              <br />
              <span className="text-primary">và thân thiện tiếp theo.</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Phòng đã xác thực, bạn cùng phòng phù hợp, thuê linh hoạt — tất cả trong một nền tảng.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Phòng & Chủ nhà được xác thực</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Mọi tin đăng được xác thực để đảm bảo an toàn</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Kết nối thông minh</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Tìm bạn cùng phòng phù hợp với lối sống của bạn</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">SwapRoom linh hoạt</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Cho thuê ngắn hạn dễ dàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="p-8 rounded-2xl shadow-soft-lg border border-border bg-card">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="bg-destructive/5 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-down">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{loginError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@example.com"
                    className="rounded-xl h-12"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="rounded-xl h-12"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl touch-target"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                  hoặc tiếp tục với
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border hover:bg-muted"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border"
                  disabled
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Mã SV
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                {signupError && (
                  <div className="bg-destructive/5 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-down">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{signupError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Họ và tên</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="rounded-xl h-12"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    className="rounded-xl h-12"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mật khẩu</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="rounded-xl h-12"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="rounded mt-1" required />
                  <span className="text-muted-foreground">
                    Tôi đồng ý với{" "}
                    <a href="#" className="text-primary hover:underline">
                      Điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a href="#" className="text-primary hover:underline">
                      Chính sách bảo mật
                    </a>{" "}
                    của rommz
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl touch-target"
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                  hoặc đăng ký với
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border hover:bg-muted"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border"
                  disabled
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Mã SV
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
